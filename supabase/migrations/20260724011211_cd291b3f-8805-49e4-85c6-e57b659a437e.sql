CREATE OR REPLACE FUNCTION public.prevent_billing_field_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF auth.role() = 'service_role'
     OR session_user IN ('postgres', 'supabase_admin')
     OR public.has_role(auth.uid(), 'admin'::public.app_role) THEN
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

REVOKE EXECUTE ON FUNCTION public.prevent_billing_field_updates() FROM PUBLIC, anon, authenticated;