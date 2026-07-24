-- ============================================================
-- Corrective migration for the admin launch dashboard + ops table.
-- 1) Paid = subscription_tier <> 'free' only. stripe_customer_id alone is a
--    billing profile / checkout lead and is reported separately.
-- 2) New page_viewed landing sessions only count when page_url = '/'.
--    Legacy landing_page_view remains included regardless of page_url.
-- 3) Revoke broad UPDATE on operational_events from authenticated and grant
--    column-level UPDATE(resolved_at, resolved_by) only. Admin RLS unchanged.
-- ============================================================

-- Tighten operational_events privileges
REVOKE UPDATE ON public.operational_events FROM authenticated;
GRANT SELECT ON public.operational_events TO authenticated;
GRANT UPDATE (resolved_at, resolved_by) ON public.operational_events TO authenticated;

-- Replace the dashboard function
CREATE OR REPLACE FUNCTION public.get_admin_launch_dashboard(p_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_days integer := GREATEST(1, LEAST(365, COALESCE(p_days, 30)));
  v_since timestamptz := now() - make_interval(days => v_days);
  v_stuck_cutoff timestamptz := now() - interval '15 minutes';

  v_cohort_signups int := 0;
  v_cohort_projects int := 0;
  v_cohort_reports int := 0;
  v_cohort_chats int := 0;
  v_cohort_paid int := 0;
  v_cohort_billing_profiles int := 0;

  v_landing_sessions int := 0;
  v_cta_sessions int := 0;

  v_total_users int := 0;
  v_total_paid int := 0;
  v_total_billing_profiles int := 0;
  v_total_projects int := 0;
  v_total_reports_complete int := 0;

  v_reports_started int := 0;
  v_reports_completed int := 0;
  v_reports_failed int := 0;
  v_reports_stuck int := 0;

  v_webhook_failed int := 0;
  v_webhook_processing int := 0;

  v_unresolved_info int := 0;
  v_unresolved_warning int := 0;
  v_unresolved_critical int := 0;

  v_recent_events jsonb := '[]'::jsonb;
  v_daily jsonb := '[]'::jsonb;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- Signup cohort
  WITH cohort AS (
    SELECT id, subscription_tier, stripe_customer_id
    FROM public.profiles
    WHERE created_at >= v_since
  )
  SELECT
    (SELECT count(*) FROM cohort),
    (SELECT count(DISTINCT c.id) FROM cohort c
       WHERE EXISTS (SELECT 1 FROM public.projects p WHERE p.user_id = c.id)),
    (SELECT count(DISTINCT c.id) FROM cohort c
       WHERE EXISTS (
         SELECT 1 FROM public.projects p
         JOIN public.reports r ON r.project_id = p.id
         WHERE p.user_id = c.id AND r.generation_completed_at IS NOT NULL
       )),
    (SELECT count(DISTINCT c.id) FROM cohort c
       WHERE EXISTS (
         SELECT 1 FROM public.chat_messages m
         JOIN public.chat_conversations conv ON conv.id = m.conversation_id
         JOIN public.projects p ON p.id = conv.project_id
         WHERE p.user_id = c.id AND m.role = 'user'
       )),
    (SELECT count(*) FROM cohort c
       WHERE c.subscription_tier::text IS DISTINCT FROM 'free'),
    (SELECT count(*) FROM cohort c
       WHERE c.stripe_customer_id IS NOT NULL)
  INTO v_cohort_signups, v_cohort_projects, v_cohort_reports, v_cohort_chats,
       v_cohort_paid, v_cohort_billing_profiles;

  -- Landing / CTA sessions.
  -- New page_viewed events only count on '/'; legacy alias counts unconditionally.
  SELECT
    count(DISTINCT COALESCE((event_properties->>'session_id')::text, id::text))
  INTO v_landing_sessions
  FROM public.analytics_events
  WHERE created_at >= v_since
    AND (
      event_name = 'landing_page_view'
      OR (event_name = 'page_viewed' AND page_url = '/')
    );

  SELECT
    count(DISTINCT COALESCE((event_properties->>'session_id')::text, id::text))
  INTO v_cta_sessions
  FROM public.analytics_events
  WHERE created_at >= v_since
    AND event_name IN ('cta_click','landing_cta_clicked');

  -- Current totals
  SELECT count(*) INTO v_total_users FROM public.profiles;
  SELECT count(*) INTO v_total_paid FROM public.profiles
    WHERE subscription_tier::text IS DISTINCT FROM 'free';
  SELECT count(*) INTO v_total_billing_profiles FROM public.profiles
    WHERE stripe_customer_id IS NOT NULL;
  SELECT count(*) INTO v_total_projects FROM public.projects;
  SELECT count(*) INTO v_total_reports_complete FROM public.reports
    WHERE generation_completed_at IS NOT NULL;

  -- Report health (within period)
  SELECT count(*) INTO v_reports_started FROM public.reports
    WHERE generation_started_at >= v_since;
  SELECT count(*) INTO v_reports_completed FROM public.reports
    WHERE generation_completed_at >= v_since;
  SELECT count(*) INTO v_reports_failed FROM public.reports
    WHERE generation_started_at >= v_since
      AND generation_error IS NOT NULL
      AND generation_completed_at IS NULL;
  SELECT count(*) INTO v_reports_stuck FROM public.reports
    WHERE generation_started_at >= v_since
      AND generation_completed_at IS NULL
      AND COALESCE(generation_heartbeat_at, generation_started_at) < v_stuck_cutoff;

  -- Stripe webhook health
  SELECT count(*) INTO v_webhook_failed FROM public.stripe_webhook_events
    WHERE status = 'failed' AND COALESCE(last_attempt_at, created_at) >= v_since;
  SELECT count(*) INTO v_webhook_processing FROM public.stripe_webhook_events
    WHERE status = 'processing'
      AND COALESCE(last_attempt_at, created_at) < now() - interval '15 minutes';

  -- Unresolved operational severity counts
  SELECT
    count(*) FILTER (WHERE severity = 'info'),
    count(*) FILTER (WHERE severity = 'warning'),
    count(*) FILTER (WHERE severity = 'critical')
  INTO v_unresolved_info, v_unresolved_warning, v_unresolved_critical
  FROM public.operational_events
  WHERE resolved_at IS NULL;

  SELECT COALESCE(jsonb_agg(x ORDER BY x.created_at DESC), '[]'::jsonb)
  INTO v_recent_events
  FROM (
    SELECT id, severity, category, event_name, function_name, error_code,
           metadata, created_at
    FROM public.operational_events
    WHERE resolved_at IS NULL
    ORDER BY created_at DESC
    LIMIT 25
  ) x;

  WITH days AS (
    SELECT generate_series(
      (date_trunc('day', now()) - interval '13 days')::date,
      date_trunc('day', now())::date,
      interval '1 day'
    )::date AS day
  ),
  s AS (
    SELECT date_trunc('day', created_at)::date AS day, count(*) AS c
    FROM public.profiles
    WHERE created_at >= now() - interval '14 days'
    GROUP BY 1
  ),
  p AS (
    SELECT date_trunc('day', created_at)::date AS day, count(*) AS c
    FROM public.projects
    WHERE created_at >= now() - interval '14 days'
    GROUP BY 1
  ),
  r AS (
    SELECT date_trunc('day', generation_completed_at)::date AS day, count(*) AS c
    FROM public.reports
    WHERE generation_completed_at >= now() - interval '14 days'
    GROUP BY 1
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'day', to_char(d.day, 'YYYY-MM-DD'),
    'signups', COALESCE(s.c, 0),
    'projects', COALESCE(p.c, 0),
    'reports_completed', COALESCE(r.c, 0)
  ) ORDER BY d.day), '[]'::jsonb)
  INTO v_daily
  FROM days d
  LEFT JOIN s USING (day)
  LEFT JOIN p USING (day)
  LEFT JOIN r USING (day);

  RETURN jsonb_build_object(
    'period_days', v_days,
    'generated_at', now(),
    'cohort_funnel', jsonb_build_object(
      'signups', v_cohort_signups,
      'created_project', v_cohort_projects,
      'completed_report', v_cohort_reports,
      'used_chat', v_cohort_chats,
      'paid', v_cohort_paid,
      'billing_profiles', v_cohort_billing_profiles
    ),
    'acquisition', jsonb_build_object(
      'landing_sessions', v_landing_sessions,
      'cta_sessions', v_cta_sessions
    ),
    'totals', jsonb_build_object(
      'users', v_total_users,
      'paid_users', v_total_paid,
      'billing_profiles', v_total_billing_profiles,
      'projects', v_total_projects,
      'reports_complete', v_total_reports_complete
    ),
    'report_health', jsonb_build_object(
      'started', v_reports_started,
      'completed', v_reports_completed,
      'failed', v_reports_failed,
      'stuck', v_reports_stuck
    ),
    'billing_health', jsonb_build_object(
      'webhook_failed', v_webhook_failed,
      'webhook_processing_stale', v_webhook_processing
    ),
    'unresolved', jsonb_build_object(
      'info', v_unresolved_info,
      'warning', v_unresolved_warning,
      'critical', v_unresolved_critical
    ),
    'recent_events', v_recent_events,
    'daily_14d', v_daily
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_launch_dashboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_launch_dashboard(integer) TO authenticated;