-- Entitlement protection trigger function
CREATE OR REPLACE FUNCTION public.protect_profile_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role'
     OR session_user IN ('postgres', 'supabase_admin')
     OR public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  IF NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier
     OR NEW.ai_credits_monthly IS DISTINCT FROM OLD.ai_credits_monthly
     OR NEW.ai_credits_used IS DISTINCT FROM OLD.ai_credits_used
     OR NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.referral_source IS DISTINCT FROM OLD.referral_source
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Protected profile fields cannot be changed directly'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.protect_profile_entitlements() FROM PUBLIC;

-- Monthly credit reset routine
CREATE OR REPLACE FUNCTION public.reset_monthly_credits_cron()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  WITH to_reset AS (
    SELECT id, ai_credits_used
    FROM public.profiles
    WHERE ai_credits_used > 0
  ),
  logged AS (
    INSERT INTO public.credit_resets (user_id, previous_credits_used)
    SELECT id, ai_credits_used FROM to_reset
    RETURNING user_id
  ),
  updated AS (
    UPDATE public.profiles p
    SET ai_credits_used = 0
    FROM to_reset t
    WHERE p.id = t.id
    RETURNING p.id
  )
  SELECT COUNT(*) INTO affected FROM updated;

  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.reset_monthly_credits_cron() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reset_monthly_credits_cron() FROM anon;
REVOKE ALL ON FUNCTION public.reset_monthly_credits_cron() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reset_monthly_credits_cron() TO service_role;

-- Cron schedule
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reset-monthly-credits') THEN
    PERFORM cron.unschedule('reset-monthly-credits');
  END IF;
  PERFORM cron.schedule(
    'reset-monthly-credits',
    '0 0 1 * *',
    $cron$SELECT public.reset_monthly_credits_cron();$cron$
  );
END $$;