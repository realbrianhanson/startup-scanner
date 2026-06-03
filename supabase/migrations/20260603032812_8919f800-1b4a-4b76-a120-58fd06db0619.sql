
-- 1) Fix mutable search_path on update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 2) Lock down SECURITY DEFINER function EXECUTE privileges
-- has_role is used inside RLS policies; only authenticated users need EXECUTE
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Trigger-only functions: not callable directly by clients
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_feedback_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_report_quality() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- 3) Tighten analytics_events insert to prevent garbage flooding
DROP POLICY IF EXISTS "Anyone can insert analytics" ON public.analytics_events;
CREATE POLICY "Anyone can insert valid analytics"
ON public.analytics_events
FOR INSERT
TO public
WITH CHECK (
  event_name IS NOT NULL
  AND length(event_name) BETWEEN 1 AND 100
  AND (page_url IS NULL OR length(page_url) <= 2048)
);
