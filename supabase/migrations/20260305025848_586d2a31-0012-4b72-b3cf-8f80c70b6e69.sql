
-- 1. Add is_public column to projects
ALTER TABLE public.projects ADD COLUMN is_public BOOLEAN NOT NULL DEFAULT false;

-- 2. Drop overly-permissive policies
DROP POLICY IF EXISTS "Anyone can view reports via shareable link" ON public.reports;
DROP POLICY IF EXISTS "Anyone can view projects via shareable link" ON public.projects;

-- 3. Create properly scoped public access policies
CREATE POLICY "Anyone can view public projects"
  ON public.projects
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Anyone can view reports for public projects"
  ON public.reports
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.projects
    WHERE projects.id = reports.project_id
    AND projects.is_public = true
  ));
