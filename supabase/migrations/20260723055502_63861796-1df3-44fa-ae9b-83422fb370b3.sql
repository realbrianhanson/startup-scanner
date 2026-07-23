
-- 1. Columns on public.reports
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS generation_started_at   timestamptz,
  ADD COLUMN IF NOT EXISTS generation_heartbeat_at timestamptz,
  ADD COLUMN IF NOT EXISTS generation_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS generation_attempt_id   uuid,
  ADD COLUMN IF NOT EXISTS generation_error        text,
  ADD COLUMN IF NOT EXISTS credits_charged_at      timestamptz,
  ADD COLUMN IF NOT EXISTS generation_quality      text NOT NULL DEFAULT 'standard';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'reports_generation_quality_check'
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_generation_quality_check
      CHECK (generation_quality IN ('standard', 'premium'));
  END IF;
END $$;

-- Backfill quality from owning project
UPDATE public.reports r
SET generation_quality = COALESCE(p.report_quality, 'standard')
FROM public.projects p
WHERE r.project_id = p.id
  AND (r.generation_quality IS NULL OR r.generation_quality = 'standard')
  AND p.report_quality IN ('standard','premium');

-- Backfill timestamps
UPDATE public.reports r
SET generation_started_at   = COALESCE(generation_started_at, r.created_at),
    generation_heartbeat_at = COALESCE(generation_heartbeat_at, r.created_at)
WHERE generation_started_at IS NULL OR generation_heartbeat_at IS NULL;

-- Completed_at for complete projects
UPDATE public.reports r
SET generation_completed_at = COALESCE(r.generation_completed_at, p.updated_at, r.created_at)
FROM public.projects p
WHERE r.project_id = p.id
  AND p.status = 'complete'
  AND r.generation_completed_at IS NULL;

-- credits_charged_at: proof from ai_usage_logs (report_generation entry)
UPDATE public.reports r
SET credits_charged_at = COALESCE(r.credits_charged_at, u.created_at)
FROM (
  SELECT project_id, MIN(created_at) AS created_at
  FROM public.ai_usage_logs
  WHERE operation_type = 'report_generation'
  GROUP BY project_id
) u
WHERE r.project_id = u.project_id
  AND r.credits_charged_at IS NULL;

-- credits_charged_at fallback for legacy complete projects lacking usage log
UPDATE public.reports r
SET credits_charged_at = COALESCE(r.credits_charged_at, p.updated_at, r.created_at)
FROM public.projects p
WHERE r.project_id = p.id
  AND p.status = 'complete'
  AND r.credits_charged_at IS NULL;

-- Incomplete analyzing reports without proof remain uncharged (NULL).

-- 2. claim_report_generation function
CREATE OR REPLACE FUNCTION public.claim_report_generation(
  p_project_id uuid,
  p_user_id    uuid,
  p_quality    text,
  p_regenerate boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_project     public.projects%ROWTYPE;
  v_profile     public.profiles%ROWTYPE;
  v_report      public.reports%ROWTYPE;
  v_credits     integer;
  v_attempt_id  uuid := gen_random_uuid();
  v_now         timestamptz := now();
  v_resumed     boolean := false;
  v_charged     boolean := false;
  v_data        jsonb;
  v_status      jsonb;
  v_new_status  jsonb;
  v_section     text;
  v_section_status text;
  v_pending_keys text[] := ARRAY[
    'executive_summary','market_analysis','customer_personas','competitive_landscape',
    'strategic_frameworks','porter_five_forces','pestel_analysis','catwoe_analysis',
    'path_to_mvp','go_to_market_strategy','usp_analysis','game_changing_idea',
    'financial_basics','risk_matrix','action_plan'
  ];
BEGIN
  IF p_quality NOT IN ('standard','premium') THEN
    RAISE EXCEPTION 'invalid quality %', p_quality USING ERRCODE = '22023';
  END IF;
  v_credits := CASE WHEN p_quality = 'premium' THEN 12 ELSE 5 END;

  -- Lock project
  SELECT * INTO v_project FROM public.projects
   WHERE id = p_project_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'project not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_project.user_id <> p_user_id THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;

  -- Lock profile
  SELECT * INTO v_profile FROM public.profiles
   WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found' USING ERRCODE = 'P0002';
  END IF;

  -- Existing report
  SELECT * INTO v_report FROM public.reports
   WHERE project_id = p_project_id FOR UPDATE;

  -- Heartbeat check for active worker
  IF FOUND
     AND NOT p_regenerate
     AND v_report.generation_heartbeat_at IS NOT NULL
     AND v_report.generation_heartbeat_at > v_now - interval '5 minutes'
     AND v_report.generation_completed_at IS NULL
     AND v_project.status = 'analyzing' THEN
    RETURN jsonb_build_object(
      'already_in_progress', true,
      'report_id', v_report.id,
      'project_id', v_project.id
    );
  END IF;

  -- Build canonical pending status
  v_new_status := '{}'::jsonb;
  FOREACH v_section IN ARRAY v_pending_keys LOOP
    v_new_status := v_new_status || jsonb_build_object(v_section, 'pending');
  END LOOP;

  IF NOT FOUND THEN
    -- Brand new report: charge
    IF v_profile.ai_credits_used + v_credits > v_profile.ai_credits_monthly THEN
      RAISE EXCEPTION 'insufficient credits' USING ERRCODE = 'P0001';
    END IF;
    UPDATE public.profiles
       SET ai_credits_used = ai_credits_used + v_credits
     WHERE id = p_user_id;
    v_charged := true;

    INSERT INTO public.reports(
      project_id, report_data, generation_status,
      generation_started_at, generation_heartbeat_at, generation_completed_at,
      generation_attempt_id, generation_error, credits_charged_at, generation_quality
    ) VALUES (
      p_project_id, '{}'::jsonb, v_new_status,
      v_now, v_now, NULL,
      v_attempt_id, NULL, v_now, p_quality
    )
    RETURNING * INTO v_report;

  ELSIF p_regenerate THEN
    -- Explicit regenerate: reset in place, charge (unless somehow already charged this cycle? per spec always charge on explicit regenerate)
    IF v_profile.ai_credits_used + v_credits > v_profile.ai_credits_monthly THEN
      RAISE EXCEPTION 'insufficient credits' USING ERRCODE = 'P0001';
    END IF;
    UPDATE public.profiles
       SET ai_credits_used = ai_credits_used + v_credits
     WHERE id = p_user_id;
    v_charged := true;

    UPDATE public.reports
       SET report_data = '{}'::jsonb,
           generation_status = v_new_status,
           generation_started_at = v_now,
           generation_heartbeat_at = v_now,
           generation_completed_at = NULL,
           generation_attempt_id = v_attempt_id,
           generation_error = NULL,
           credits_charged_at = v_now,
           generation_quality = p_quality
     WHERE id = v_report.id
     RETURNING * INTO v_report;

  ELSE
    -- Stale/incomplete resume: preserve complete sections, promote missing/failed/generating to pending
    v_data   := COALESCE(v_report.report_data, '{}'::jsonb);
    v_status := COALESCE(v_report.generation_status, '{}'::jsonb);
    v_new_status := '{}'::jsonb;

    FOREACH v_section IN ARRAY v_pending_keys LOOP
      v_section_status := COALESCE(v_status ->> v_section, 'pending');
      IF v_section_status = 'complete' THEN
        v_new_status := v_new_status || jsonb_build_object(v_section, 'complete');
      ELSE
        v_new_status := v_new_status || jsonb_build_object(v_section, 'pending');
      END IF;
    END LOOP;

    -- Charge only if legacy uncharged
    IF v_report.credits_charged_at IS NULL THEN
      IF v_profile.ai_credits_used + v_credits > v_profile.ai_credits_monthly THEN
        RAISE EXCEPTION 'insufficient credits' USING ERRCODE = 'P0001';
      END IF;
      UPDATE public.profiles
         SET ai_credits_used = ai_credits_used + v_credits
       WHERE id = p_user_id;
      v_charged := true;

      UPDATE public.reports
         SET report_data = v_data,
             generation_status = v_new_status,
             generation_started_at = COALESCE(v_report.generation_started_at, v_now),
             generation_heartbeat_at = v_now,
             generation_completed_at = NULL,
             generation_attempt_id = v_attempt_id,
             generation_error = NULL,
             credits_charged_at = v_now,
             generation_quality = COALESCE(NULLIF(v_report.generation_quality,''), p_quality)
       WHERE id = v_report.id
       RETURNING * INTO v_report;
    ELSE
      v_resumed := true;
      UPDATE public.reports
         SET report_data = v_data,
             generation_status = v_new_status,
             generation_started_at = COALESCE(v_report.generation_started_at, v_now),
             generation_heartbeat_at = v_now,
             generation_completed_at = NULL,
             generation_attempt_id = v_attempt_id,
             generation_error = NULL,
             generation_quality = COALESCE(NULLIF(v_report.generation_quality,''), p_quality)
       WHERE id = v_report.id
       RETURNING * INTO v_report;
    END IF;
  END IF;

  -- Set project to analyzing
  UPDATE public.projects
     SET status = 'analyzing'
   WHERE id = p_project_id;

  RETURN jsonb_build_object(
    'already_in_progress', false,
    'resumed', v_resumed,
    'charged', v_charged,
    'credits_charged', CASE WHEN v_charged THEN v_credits ELSE 0 END,
    'attempt_id', v_attempt_id,
    'report', to_jsonb(v_report)
  );
END;
$function$;

REVOKE ALL ON FUNCTION public.claim_report_generation(uuid, uuid, text, boolean) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_report_generation(uuid, uuid, text, boolean) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_report_generation(uuid, uuid, text, boolean) TO service_role;
