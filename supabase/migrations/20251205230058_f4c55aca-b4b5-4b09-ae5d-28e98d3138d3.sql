-- Allow public access to view any report (for shareable links)
CREATE POLICY "Anyone can view reports via shareable link"
ON public.reports
FOR SELECT
USING (true);

-- Also allow public access to view project names for the report header
CREATE POLICY "Anyone can view projects via shareable link"
ON public.projects
FOR SELECT
USING (true);