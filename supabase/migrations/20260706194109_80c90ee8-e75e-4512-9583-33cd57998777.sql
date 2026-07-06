
-- 1) Realign default monthly credits (Free = 15: 1 standard report + 10 chat messages)
ALTER TABLE public.profiles ALTER COLUMN ai_credits_monthly SET DEFAULT 15;

-- 2) Update signup handler to match new plan math
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  promo_code TEXT;
  credits_to_grant INTEGER;
  ref_code TEXT;
  referrer_user_id UUID;
BEGIN
  promo_code := UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'promo_code', '')));

  -- Free tier default: 15 credits (enough for 1 standard report + 10 chat messages).
  -- Remix tip: change these numbers to match your own pricing.
  IF promo_code = 'REAL' THEN
    credits_to_grant := 100;
  ELSE
    credits_to_grant := 15;
  END IF;

  ref_code := UPPER(SUBSTR(MD5(NEW.id::text), 1, 8));

  INSERT INTO public.profiles (id, email, full_name, subscription_tier, ai_credits_monthly, ai_credits_used, referral_code, referral_source)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'free',
    credits_to_grant,
    0,
    ref_code,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'referral_code', '')), '')
  );

  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL AND TRIM(NEW.raw_user_meta_data->>'referral_code') != '' THEN
    SELECT id INTO referrer_user_id FROM public.profiles WHERE referral_code = UPPER(TRIM(NEW.raw_user_meta_data->>'referral_code'));
    IF referrer_user_id IS NOT NULL THEN
      UPDATE public.profiles SET ai_credits_monthly = ai_credits_monthly + 20 WHERE id = referrer_user_id;
      INSERT INTO public.referrals (referrer_id, referred_id, credits_awarded) VALUES (referrer_user_id, NEW.id, 20);
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 3) Tighten user profile update RLS: add WITH CHECK
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4) BEFORE UPDATE trigger that blocks billing-column edits unless caller is
--    the service role or an admin. Prevents privilege-escalation via the anon
--    key from the browser.
CREATE OR REPLACE FUNCTION public.prevent_billing_field_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_role TEXT := current_user;
  is_admin BOOLEAN := FALSE;
BEGIN
  -- Only enforce for the two web-facing PostgREST roles.
  IF caller_role NOT IN ('authenticated', 'anon') THEN
    RETURN NEW;
  END IF;

  -- Admins may adjust billing fields (used by the Admin UI).
  BEGIN
    is_admin := public.has_role(auth.uid(), 'admin'::app_role);
  EXCEPTION WHEN OTHERS THEN
    is_admin := FALSE;
  END;
  IF is_admin THEN
    RETURN NEW;
  END IF;

  IF NEW.subscription_tier   IS DISTINCT FROM OLD.subscription_tier
  OR NEW.ai_credits_monthly  IS DISTINCT FROM OLD.ai_credits_monthly
  OR NEW.ai_credits_used     IS DISTINCT FROM OLD.ai_credits_used
  OR NEW.stripe_customer_id  IS DISTINCT FROM OLD.stripe_customer_id THEN
    RAISE EXCEPTION
      'Billing fields (subscription_tier, ai_credits_monthly, ai_credits_used, stripe_customer_id) can only be modified by the backend'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_billing_field_updates() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS prevent_profile_billing_updates ON public.profiles;
CREATE TRIGGER prevent_profile_billing_updates
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_billing_field_updates();

-- 5) Monthly credit reset via pg_cron (portable across remixes, no HTTP call)
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'reset-monthly-credits') THEN
    PERFORM cron.schedule(
      'reset-monthly-credits',
      '0 0 1 * *',  -- 00:00 UTC on the 1st of every month
      $cron$
        INSERT INTO public.credit_resets (user_id, previous_credits_used)
        SELECT id, ai_credits_used FROM public.profiles WHERE ai_credits_used > 0;
        UPDATE public.profiles SET ai_credits_used = 0 WHERE ai_credits_used > 0;
      $cron$
    );
  END IF;
END $$;
