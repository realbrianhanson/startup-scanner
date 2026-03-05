ALTER TABLE public.projects ADD COLUMN report_quality TEXT DEFAULT 'standard' NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_report_quality()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.report_quality NOT IN ('standard', 'premium') THEN
    RAISE EXCEPTION 'report_quality must be standard or premium';
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER validate_report_quality_trigger
  BEFORE INSERT OR UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_report_quality();