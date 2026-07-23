
CREATE OR REPLACE FUNCTION public.consume_ai_credits(p_user_id uuid, p_amount integer)
RETURNS TABLE(ai_credits_used integer, ai_credits_monthly integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  UPDATE public.profiles AS p
     SET ai_credits_used = p.ai_credits_used + p_amount
   WHERE p.id = p_user_id
     AND p.ai_credits_used + p_amount <= p.ai_credits_monthly
  RETURNING p.ai_credits_used, p.ai_credits_monthly;
END;
$$;

CREATE OR REPLACE FUNCTION public.release_ai_credits(p_user_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN;
  END IF;

  UPDATE public.profiles AS p
     SET ai_credits_used = greatest(0, p.ai_credits_used - p_amount)
   WHERE p.id = p_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_ai_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.release_ai_credits(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_credits(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.release_ai_credits(uuid, integer) TO service_role;
