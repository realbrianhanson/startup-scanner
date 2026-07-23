CREATE OR REPLACE FUNCTION public.protect_profile_entitlements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin'::public.app_role) THEN
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
$function$;

REVOKE ALL ON FUNCTION public.protect_profile_entitlements() FROM PUBLIC;

DROP TRIGGER IF EXISTS protect_profile_entitlements_trigger ON public.profiles;
CREATE TRIGGER protect_profile_entitlements_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_entitlements();

DROP POLICY IF EXISTS "Users can create reports for their projects" ON public.reports;