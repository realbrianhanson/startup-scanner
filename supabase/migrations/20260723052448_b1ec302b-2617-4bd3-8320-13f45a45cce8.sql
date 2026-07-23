CREATE SCHEMA IF NOT EXISTS internal_archive;
REVOKE ALL ON SCHEMA internal_archive FROM PUBLIC;
REVOKE ALL ON SCHEMA internal_archive FROM anon;
REVOKE ALL ON SCHEMA internal_archive FROM authenticated;

CREATE TABLE IF NOT EXISTS internal_archive.reports_duplicates_20260723
  (LIKE public.reports INCLUDING DEFAULTS);
REVOKE ALL ON internal_archive.reports_duplicates_20260723 FROM PUBLIC;
REVOKE ALL ON internal_archive.reports_duplicates_20260723 FROM anon;
REVOKE ALL ON internal_archive.reports_duplicates_20260723 FROM authenticated;
CREATE UNIQUE INDEX IF NOT EXISTS reports_duplicates_20260723_id_uidx
  ON internal_archive.reports_duplicates_20260723(id);

WITH ranked AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at DESC, id DESC) AS rn
  FROM public.reports
),
dup_ids AS (
  SELECT id FROM ranked WHERE rn > 1
),
archived AS (
  INSERT INTO internal_archive.reports_duplicates_20260723
  SELECT r.* FROM public.reports r JOIN dup_ids d ON d.id = r.id
  ON CONFLICT (id) DO NOTHING
  RETURNING id
)
DELETE FROM public.reports r USING dup_ids d WHERE r.id = d.id;

CREATE UNIQUE INDEX IF NOT EXISTS reports_project_id_unique ON public.reports(project_id);