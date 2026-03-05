CREATE TABLE public.site_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read config" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage config" ON public.site_config FOR ALL USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.site_config (key, value) VALUES 
  ('calendly_url', 'https://calendly.com/REPLACE_WITH_YOUR_LINK'),
  ('cta_headline', 'Ready to Turn This Report Into Reality?'),
  ('cta_enabled', 'true');