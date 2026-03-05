ALTER TABLE public.ai_usage_logs ADD COLUMN IF NOT EXISTS model_name TEXT;
ALTER TABLE public.ai_usage_logs ADD COLUMN IF NOT EXISTS estimated_cost_usd NUMERIC(10,6) DEFAULT 0;