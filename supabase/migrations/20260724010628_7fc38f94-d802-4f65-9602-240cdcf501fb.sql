-- Persist authoritative Stripe subscription state on profiles and lock down
-- the new fields so only service_role / admins can mutate them. Also replace
-- get_admin_launch_dashboard with a truthful funnel and current-totals shape.

-- ============================================================
-- 1) Add protected subscription-state columns to public.profiles
-- ============================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_subscription_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_subscription_status_check
      CHECK (subscription_status IN (
        'free','trialing','active','past_due','unpaid','incomplete','canceled','unknown'
      ));
  END IF;
END$$;

-- Backfill: only mark 'unknown' when we have both a Stripe customer AND a
-- non-free tier. Never infer active revenue from tier alone.
UPDATE public.profiles
   SET subscription_status = 'unknown'
 WHERE subscription_status = 'free'
   AND stripe_customer_id IS NOT NULL
   AND subscription_tier::text <> 'free';

-- ============================================================
-- 2) Extend billing-field protection triggers
-- ============================================================
CREATE OR REPLACE FUNCTION public.prevent_billing_field_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  caller_role TEXT := current_user;
  is_admin BOOLEAN := FALSE;
BEGIN
  IF caller_role NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  BEGIN
    is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  EXCEPTION WHEN OTHERS THEN
    is_admin := FALSE;
  END;
  IF is_admin THEN
    RETURN NEW;
  END IF;

  IF NEW.subscription_tier        IS DISTINCT FROM OLD.subscription_tier
  OR NEW.ai_credits_monthly       IS DISTINCT FROM OLD.ai_credits_monthly
  OR NEW.ai_credits_used          IS DISTINCT FROM OLD.ai_credits_used
  OR NEW.stripe_customer_id       IS DISTINCT FROM OLD.stripe_customer_id
  OR NEW.subscription_status      IS DISTINCT FROM OLD.subscription_status
  OR NEW.trial_ends_at            IS DISTINCT FROM OLD.trial_ends_at
  OR NEW.current_period_ends_at   IS DISTINCT FROM OLD.current_period_ends_at
  OR NEW.cancel_at_period_end     IS DISTINCT FROM OLD.cancel_at_period_end THEN
    RAISE EXCEPTION
      'Billing fields can only be modified by the backend'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.protect_profile_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  IF auth.role() = 'service_role'
     OR session_user IN ('postgres', 'supabase_admin')
     OR public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.subscription_tier        IS DISTINCT FROM OLD.subscription_tier
     OR NEW.ai_credits_monthly    IS DISTINCT FROM OLD.ai_credits_monthly
     OR NEW.ai_credits_used       IS DISTINCT FROM OLD.ai_credits_used
     OR NEW.stripe_customer_id    IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.email                 IS DISTINCT FROM OLD.email
     OR NEW.referral_code         IS DISTINCT FROM OLD.referral_code
     OR NEW.referral_source       IS DISTINCT FROM OLD.referral_source
     OR NEW.created_at            IS DISTINCT FROM OLD.created_at
     OR NEW.subscription_status   IS DISTINCT FROM OLD.subscription_status
     OR NEW.trial_ends_at         IS DISTINCT FROM OLD.trial_ends_at
     OR NEW.current_period_ends_at IS DISTINCT FROM OLD.current_period_ends_at
     OR NEW.cancel_at_period_end  IS DISTINCT FROM OLD.cancel_at_period_end THEN
    RAISE EXCEPTION 'Protected profile fields cannot be changed directly'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.protect_profile_entitlements() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 3) Replace get_admin_launch_dashboard with truthful shape
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

  v_accounts_created int := 0;
  v_cohort_signups int := 0;   -- verified
  v_cohort_projects int := 0;
  v_cohort_reports int := 0;
  v_cohort_chats int := 0;
  v_cohort_trialing int := 0;
  v_cohort_paid int := 0;      -- active subscriptions only

  v_landing_sessions int := 0;
  v_cta_sessions int := 0;

  v_total_users int := 0;
  v_total_active int := 0;
  v_total_trials int := 0;
  v_total_past_due int := 0;
  v_total_pro_tier int := 0;
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

  -- Accounts + verified cohort. Verified = auth.users.email_confirmed_at IS NOT NULL.
  WITH accounts AS (
    SELECT p.id, p.subscription_status
    FROM public.profiles p
    WHERE p.created_at >= v_since
  ),
  verified AS (
    SELECT a.id, a.subscription_status
    FROM accounts a
    JOIN auth.users u ON u.id = a.id
    WHERE u.email_confirmed_at IS NOT NULL
  )
  SELECT
    (SELECT count(*) FROM accounts),
    (SELECT count(*) FROM verified),
    (SELECT count(DISTINCT v.id) FROM verified v
      WHERE EXISTS (SELECT 1 FROM public.projects p WHERE p.user_id = v.id)),
    (SELECT count(DISTINCT v.id) FROM verified v
      WHERE EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.reports r ON r.project_id = p.id
        WHERE p.user_id = v.id AND r.generation_completed_at IS NOT NULL
      )),
    (SELECT count(DISTINCT v.id) FROM verified v
      WHERE EXISTS (
        SELECT 1 FROM public.chat_messages m
        JOIN public.chat_conversations conv ON conv.id = m.conversation_id
        JOIN public.projects p ON p.id = conv.project_id
        WHERE p.user_id = v.id AND m.role = 'user'
      )),
    (SELECT count(*) FROM verified v WHERE v.subscription_status = 'trialing'),
    (SELECT count(*) FROM verified v WHERE v.subscription_status = 'active')
  INTO v_accounts_created, v_cohort_signups, v_cohort_projects, v_cohort_reports,
       v_cohort_chats, v_cohort_trialing, v_cohort_paid;

  -- Landing / CTA sessions (unchanged truth: new page_viewed counts only '/').
  SELECT count(DISTINCT COALESCE((event_properties->>'session_id')::text, id::text))
    INTO v_landing_sessions
  FROM public.analytics_events
  WHERE created_at >= v_since
    AND (
      event_name = 'landing_page_view'
      OR (event_name = 'page_viewed' AND page_url = '/')
    );

  SELECT count(DISTINCT COALESCE((event_properties->>'session_id')::text, id::text))
    INTO v_cta_sessions
  FROM public.analytics_events
  WHERE created_at >= v_since
    AND event_name IN ('cta_click','landing_cta_clicked');

  -- Current totals (authoritative on subscription_status)
  SELECT count(*) INTO v_total_users FROM public.profiles;
  SELECT count(*) INTO v_total_active     FROM public.profiles WHERE subscription_status = 'active';
  SELECT count(*) INTO v_total_trials     FROM public.profiles WHERE subscription_status = 'trialing';
  SELECT count(*) INTO v_total_past_due   FROM public.profiles WHERE subscription_status = 'past_due';
  SELECT count(*) INTO v_total_pro_tier   FROM public.profiles
    WHERE subscription_tier::text IS DISTINCT FROM 'free';
  SELECT count(*) INTO v_total_billing_profiles FROM public.profiles
    WHERE stripe_customer_id IS NOT NULL;
  SELECT count(*) INTO v_total_projects FROM public.projects;
  SELECT count(*) INTO v_total_reports_complete FROM public.reports
    WHERE generation_completed_at IS NOT NULL;

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

  SELECT count(*) INTO v_webhook_failed FROM public.stripe_webhook_events
    WHERE status = 'failed' AND COALESCE(last_attempt_at, created_at) >= v_since;
  SELECT count(*) INTO v_webhook_processing FROM public.stripe_webhook_events
    WHERE status = 'processing'
      AND COALESCE(last_attempt_at, created_at) < now() - interval '15 minutes';

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
      'accounts_created', v_accounts_created,
      'signups', v_cohort_signups,
      'created_project', v_cohort_projects,
      'completed_report', v_cohort_reports,
      'used_chat', v_cohort_chats,
      'trialing', v_cohort_trialing,
      'paid', v_cohort_paid
    ),
    'acquisition', jsonb_build_object(
      'landing_sessions', v_landing_sessions,
      'cta_sessions', v_cta_sessions
    ),
    'totals', jsonb_build_object(
      'users', v_total_users,
      'active_subscriptions', v_total_active,
      'trials', v_total_trials,
      'past_due', v_total_past_due,
      'pro_tier', v_total_pro_tier,
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