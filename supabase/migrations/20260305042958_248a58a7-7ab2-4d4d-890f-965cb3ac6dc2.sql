
-- Add referral columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_source TEXT;

-- Create referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  credits_awarded INTEGER DEFAULT 20,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on referrals
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view their own referrals (as referrer)
CREATE POLICY "Users can view their referrals" ON public.referrals
  FOR SELECT TO authenticated
  USING (referrer_id = auth.uid());

-- Users can view referrals where they were referred
CREATE POLICY "Users can view where they were referred" ON public.referrals
  FOR SELECT TO authenticated
  USING (referred_id = auth.uid());

-- Backfill existing profiles with referral codes
UPDATE public.profiles SET referral_code = UPPER(SUBSTR(MD5(id::text), 1, 8)) WHERE referral_code IS NULL;

-- Make referral_code NOT NULL after backfill
ALTER TABLE public.profiles ALTER COLUMN referral_code SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN referral_code SET DEFAULT '';

-- Update handle_new_user to generate referral code and process referrals
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
  -- Get promo code from user metadata
  promo_code := UPPER(TRIM(COALESCE(NEW.raw_user_meta_data->>'promo_code', '')));
  
  -- Determine credits based on promo code
  IF promo_code = 'REAL' THEN
    credits_to_grant := 100;
  ELSE
    credits_to_grant := 20;
  END IF;

  -- Generate referral code from user id
  ref_code := UPPER(SUBSTR(MD5(NEW.id::text), 1, 8));

  -- Insert profile
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

  -- Process referral: credit the referrer
  IF NEW.raw_user_meta_data->>'referral_code' IS NOT NULL AND TRIM(NEW.raw_user_meta_data->>'referral_code') != '' THEN
    SELECT id INTO referrer_user_id FROM public.profiles WHERE referral_code = UPPER(TRIM(NEW.raw_user_meta_data->>'referral_code'));
    IF referrer_user_id IS NOT NULL THEN
      -- Award 20 bonus credits to referrer
      UPDATE public.profiles SET ai_credits_monthly = ai_credits_monthly + 20 WHERE id = referrer_user_id;
      -- Record the referral
      INSERT INTO public.referrals (referrer_id, referred_id, credits_awarded) VALUES (referrer_user_id, NEW.id, 20);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
