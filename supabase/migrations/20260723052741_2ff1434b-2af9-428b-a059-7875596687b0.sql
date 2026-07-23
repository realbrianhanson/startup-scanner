ALTER TABLE public.stripe_webhook_events
  ADD COLUMN IF NOT EXISTS last_attempt_at timestamptz NOT NULL DEFAULT now();

UPDATE public.stripe_webhook_events
SET last_attempt_at = created_at
WHERE last_attempt_at = created_at OR last_attempt_at IS NULL;

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.stripe_webhook_events FROM PUBLIC;
REVOKE ALL ON public.stripe_webhook_events FROM anon;
REVOKE ALL ON public.stripe_webhook_events FROM authenticated;
GRANT ALL ON public.stripe_webhook_events TO service_role;