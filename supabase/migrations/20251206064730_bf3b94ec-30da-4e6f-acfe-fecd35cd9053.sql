CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  promo_code TEXT;
  credits_to_grant INTEGER;
BEGIN
  -- Get promo code from user metadata (convert to uppercase for comparison)
  promo_code := UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'promo_code', '')));
  
  -- Determine credits based on promo code
  IF promo_code = 'REAL' THEN
    credits_to_grant := 100;
  ELSE
    credits_to_grant := 20;
  END IF;

  -- Insert profile with appropriate credits
  INSERT INTO public.profiles (id, email, full_name, subscription_tier, ai_credits_monthly, ai_credits_used)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'free',
    credits_to_grant,
    0
  );
  
  RETURN NEW;
END;
$$;