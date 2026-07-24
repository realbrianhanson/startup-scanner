
-- ============================================================
-- operational_events: admin-only operational log
-- ============================================================
CREATE TABLE IF NOT EXISTS public.operational_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL CHECK (severity IN ('info','warning','critical')),
  category TEXT NOT NULL CHECK (category ~ '^[a-z0-9_]{1,64}$'),
  event_name TEXT NOT NULL CHECK (event_name ~ '^[a-z0-9_]{1,80}$'),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  function_name TEXT CHECK (function_name IS NULL OR function_name ~ '^[a-z0-9_-]{1,80}$'),
  error_code TEXT CHECK (error_code IS NULL OR error_code ~ '^[A-Za-z0-9_.-]{1,80}$'),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (
    jsonb_typeof(metadata) = 'object' AND length(metadata::text) <= 4000
  ),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operational_events_unresolved
  ON public.operational_events (created_at DESC)
  WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_operational_events_created
  ON public.operational_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operational_events_category
  ON public.operational_events (category, created_at DESC);

GRANT SELECT, UPDATE ON public.operational_events TO authenticated;
GRANT ALL ON public.operational_events TO service_role;

ALTER TABLE public.operational_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view operational events" ON public.operational_events;
CREATE POLICY "Admins can view operational events"
  ON public.operational_events
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can resolve operational events" ON public.operational_events;
CREATE POLICY "Admins can resolve operational events"
  ON public.operational_events
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- No INSERT/DELETE policies for authenticated. Only service_role can insert.

-- Supporting index for report health scans
CREATE INDEX IF NOT EXISTS idx_reports_generation_started_at
  ON public.reports (generation_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_completed_at
  ON public.reports (generation_completed_at DESC);

-- ============================================================
-- get_admin_launch_dashboard
-- ============================================================
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

  v_landing_sessions int := 0;
  v_cta_sessions int := 0;

  v_total_users int := 0;
  v_total_paid int := 0;
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
       WHERE c.subscription_tier IS DISTINCT FROM 'free' OR c.stripe_customer_id IS NOT NULL)
  INTO v_cohort_signups, v_cohort_projects, v_cohort_reports, v_cohort_chats, v_cohort_paid;

  -- Landing / CTA sessions (event-based; supports new + legacy aliases)
  SELECT
    count(DISTINCT COALESCE((event_properties->>'session_id')::text, id::text))
  INTO v_landing_sessions
  FROM public.analytics_events
  WHERE created_at >= v_since
    AND event_name IN ('landing_page_view','page_viewed');

  SELECT
    count(DISTINCT COALESCE((event_properties->>'session_id')::text, id::text))
  INTO v_cta_sessions
  FROM public.analytics_events
  WHERE created_at >= v_since
    AND event_name IN ('cta_click','landing_cta_clicked');

  -- Current totals
  SELECT count(*) INTO v_total_users FROM public.profiles;
  SELECT count(*) INTO v_total_paid FROM public.profiles
    WHERE subscription_tier IS DISTINCT FROM 'free' OR stripe_customer_id IS NOT NULL;
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

  -- Recent unresolved events (safe fields only, no user text)
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

  -- 14-day daily series
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
      'paid', v_cohort_paid
    ),
    'acquisition', jsonb_build_object(
      'landing_sessions', v_landing_sessions,
      'cta_sessions', v_cta_sessions
    ),
    'totals', jsonb_build_object(
      'users', v_total_users,
      'paid_users', v_total_paid,
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
