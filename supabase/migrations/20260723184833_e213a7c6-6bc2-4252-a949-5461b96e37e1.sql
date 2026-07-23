
-- A1: operation_type check constraint
ALTER TABLE public.ai_usage_logs
  DROP CONSTRAINT IF EXISTS ai_usage_logs_operation_type_check;
ALTER TABLE public.ai_usage_logs
  ADD CONSTRAINT ai_usage_logs_operation_type_check
  CHECK (operation_type = ANY (ARRAY[
    'report_generation','chat','analysis','website_analysis','project_comparison'
  ]));

-- A2: analytics_events insert policies
DROP POLICY IF EXISTS "Anyone can insert valid analytics" ON public.analytics_events;

CREATE POLICY "Anon can insert analytics"
  ON public.analytics_events
  FOR INSERT
  TO anon
  WITH CHECK (
    user_id IS NULL
    AND event_name IS NOT NULL
    AND length(event_name) BETWEEN 1 AND 100
    AND (page_url IS NULL OR length(page_url) <= 2048)
    AND COALESCE(pg_column_size(event_properties), 0) <= 16384
  );

CREATE POLICY "Authenticated can insert analytics"
  ON public.analytics_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (user_id IS NULL OR user_id = auth.uid())
    AND event_name IS NOT NULL
    AND length(event_name) BETWEEN 1 AND 100
    AND (page_url IS NULL OR length(page_url) <= 2048)
    AND COALESCE(pg_column_size(event_properties), 0) <= 16384
  );

-- A3: revoke execute on internal / definer functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_billing_field_updates() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_entitlements() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.claim_report_generation(uuid, uuid, text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_report_generation(uuid, uuid, text, boolean) TO service_role;

REVOKE EXECUTE ON FUNCTION public.finalize_report_generation(uuid, uuid, jsonb, jsonb, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finalize_report_generation(uuid, uuid, jsonb, jsonb, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.consume_ai_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_credits(uuid, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.release_ai_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_ai_credits(uuid, integer) TO service_role;
