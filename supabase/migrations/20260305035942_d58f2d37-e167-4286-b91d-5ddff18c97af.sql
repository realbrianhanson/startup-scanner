CREATE TABLE public.credit_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  previous_credits_used INTEGER NOT NULL,
  reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.credit_resets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view credit resets"
  ON public.credit_resets FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));