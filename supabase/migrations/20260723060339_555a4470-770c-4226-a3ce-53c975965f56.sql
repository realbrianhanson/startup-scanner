-- =========================================================
-- Corrective claim_report_generation (fix state machine)
-- =========================================================
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
AS $$
DECLARE
  v_project        public.projects%ROWTYPE;
  v_profile        public.profiles%ROWTYPE;
  v_report         public.reports%ROWTYPE;
  v_has_report     boolean := false;
  v_effective_q    text;
  v_credits        integer;
  v_attempt_id     uuid := gen_random_uuid();
  v_now            timestamptz := now();
  v_resumed        boolean := false;
  v_charged        boolean := false;
  v_data           jsonb;
  v_status         jsonb;
  v_new_status     jsonb;
  v_section        text;
  v_section_status text;
  v_pending_keys   text[] := ARRAY[
    'executive_summary','market_analysis','customer_personas','competitive_landscape',
    'strategic_frameworks','porter_five_forces','pestel_analysis','catwoe_analysis',
    'path_to_mvp','go_to_market_strategy','usp_analysis','game_changing_idea',
    'financial_basics','risk_matrix','action_plan'
  ];
BEGIN
  IF p_quality NOT IN ('standard','premium') THEN
    RAISE EXCEPTION 'invalid quality' USING ERRCODE = '22023';
  END IF;

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

  -- Load existing report (capture presence explicitly — do not rely on FOUND later)
  SELECT * INTO v_report FROM public.reports
   WHERE project_id = p_project_id FOR UPDATE;
  v_has_report := FOUND;

  -- Already-complete short-circuit (unless explicit regenerate)
  IF v_has_report
     AND NOT p_regenerate
     AND v_report.generation_completed_at IS NOT NULL
     AND v_project.status = 'complete' THEN
    RETURN jsonb_build_object(
      'already_complete',    true,
      'already_in_progress', false,
      'resumed',             false,
      'charged',             false,
      'credits_charged',     0,
      'attempt_id',          NULL,
      'effective_quality',   COALESCE(NULLIF(v_report.generation_quality,''),'standard'),
      'report',              to_jsonb(v_report)
    );
  END IF;

  -- Fresh in-progress heartbeat always wins — even against explicit regenerate.
  IF v_has_report
     AND v_report.generation_heartbeat_at IS NOT NULL
     AND v_report.generation_heartbeat_at > v_now - interval '5 minutes'
     AND v_report.generation_completed_at IS NULL THEN
    RETURN jsonb_build_object(
      'already_complete',    false,
      'already_in_progress', true,
      'resumed',             false,
      'charged',             false,
      'credits_charged',     0,
      'attempt_id',          NULL,
      'effective_quality',   COALESCE(NULLIF(v_report.generation_quality,''), p_quality),
      'report_id',           v_report.id,
      'report',              to_jsonb(v_report)
    );
  END IF;

  -- Effective quality: new / explicit regen use requested; ordinary resume uses stored.
  IF NOT v_has_report OR p_regenerate THEN
    v_effective_q := p_quality;
  ELSE
    v_effective_q := COALESCE(NULLIF(v_report.generation_quality,''), p_quality);
  END IF;
  v_credits := CASE WHEN v_effective_q = 'premium' THEN 12 ELSE 5 END;

  -- Canonical pending status template
  v_new_status := '{}'::jsonb;
  FOREACH v_section IN ARRAY v_pending_keys LOOP
    v_new_status := v_new_status || jsonb_build_object(v_section, 'pending');
  END LOOP;

  IF NOT v_has_report THEN
    -- Brand new report: charge once
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
      v_attempt_id, NULL, v_now, v_effective_q
    )
    RETURNING * INTO v_report;

  ELSIF p_regenerate THEN
    -- Explicit regenerate: reset in place, charge once
    IF v_profile.ai_credits_used + v_credits > v_profile.ai_credits_monthly THEN
      RAISE EXCEPTION 'insufficient credits' USING ERRCODE = 'P0001';
    END IF;
    UPDATE public.profiles
       SET ai_credits_used = ai_credits_used + v_credits
     WHERE id = p_user_id;
    v_charged := true;

    UPDATE public.reports
       SET report_data           = '{}'::jsonb,
           generation_status     = v_new_status,
           generation_started_at = v_now,
           generation_heartbeat_at = v_now,
           generation_completed_at = NULL,
           generation_attempt_id = v_attempt_id,
           generation_error      = NULL,
           credits_charged_at    = v_now,
           generation_quality    = v_effective_q
     WHERE id = v_report.id
     RETURNING * INTO v_report;

  ELSE
    -- Ordinary resume: preserve complete sections, promote others to pending
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

    IF v_report.credits_charged_at IS NULL THEN
      -- Legacy uncharged: charge once
      IF v_profile.ai_credits_used + v_credits > v_profile.ai_credits_monthly THEN
        RAISE EXCEPTION 'insufficient credits' USING ERRCODE = 'P0001';
      END IF;
      UPDATE public.profiles
         SET ai_credits_used = ai_credits_used + v_credits
       WHERE id = p_user_id;
      v_charged := true;

      UPDATE public.reports
         SET report_data           = v_data,
             generation_status     = v_new_status,
             generation_started_at = COALESCE(v_report.generation_started_at, v_now),
             generation_heartbeat_at = v_now,
             generation_completed_at = NULL,
             generation_attempt_id = v_attempt_id,
             generation_error      = NULL,
             credits_charged_at    = v_now,
             generation_quality    = v_effective_q
       WHERE id = v_report.id
       RETURNING * INTO v_report;
    ELSE
      v_resumed := true;
      UPDATE public.reports
         SET report_data           = v_data,
             generation_status     = v_new_status,
             generation_started_at = COALESCE(v_report.generation_started_at, v_now),
             generation_heartbeat_at = v_now,
             generation_completed_at = NULL,
             generation_attempt_id = v_attempt_id,
             generation_error      = NULL,
             generation_quality    = v_effective_q
       WHERE id = v_report.id
       RETURNING * INTO v_report;
    END IF;
  END IF;

  UPDATE public.projects SET status = 'analyzing' WHERE id = p_project_id;

  RETURN jsonb_build_object(
    'already_complete',    false,
    'already_in_progress', false,
    'resumed',             v_resumed,
    'charged',             v_charged,
    'credits_charged',     CASE WHEN v_charged THEN v_credits ELSE 0 END,
    'attempt_id',          v_attempt_id,
    'effective_quality',   v_effective_q,
    'report',              to_jsonb(v_report)
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.claim_report_generation(uuid,uuid,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.claim_report_generation(uuid,uuid,text,boolean) TO service_role;

-- =========================================================
-- Atomic finalize_report_generation (owner-checked)
-- =========================================================
CREATE OR REPLACE FUNCTION public.finalize_report_generation(
  p_report_id  uuid,
  p_attempt_id uuid,
  p_report_data jsonb,
  p_generation_status jsonb,
  p_score integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_report  public.reports%ROWTYPE;
  v_project public.projects%ROWTYPE;
  v_now     timestamptz := now();
BEGIN
  SELECT * INTO v_report FROM public.reports WHERE id = p_report_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('finalized', false, 'error', 'not_found');
  END IF;

  IF v_report.generation_completed_at IS NOT NULL THEN
    RETURN jsonb_build_object(
      'finalized',         false,
      'already_finalized', true,
      'report_id',         v_report.id,
      'project_id',        v_report.project_id
    );
  END IF;

  IF v_report.generation_attempt_id IS DISTINCT FROM p_attempt_id THEN
    RETURN jsonb_build_object(
      'finalized',  false,
      'superseded', true,
      'report_id',  v_report.id,
      'project_id', v_report.project_id
    );
  END IF;

  SELECT * INTO v_project FROM public.projects WHERE id = v_report.project_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('finalized', false, 'error', 'project_not_found');
  END IF;

  UPDATE public.reports
     SET report_data             = p_report_data,
         generation_status       = p_generation_status,
         generation_completed_at = v_now,
         generation_heartbeat_at = v_now,
         generation_error        = NULL
   WHERE id = v_report.id
     AND generation_attempt_id = p_attempt_id
     AND generation_completed_at IS NULL;

  IF NOT FOUND THEN
    -- Someone else finalized/superseded between checks
    RETURN jsonb_build_object(
      'finalized',  false,
      'superseded', true,
      'report_id',  v_report.id,
      'project_id', v_report.project_id
    );
  END IF;

  UPDATE public.projects
     SET status           = 'complete',
         validation_score = p_score,
         report_quality   = COALESCE(NULLIF(v_report.generation_quality,''), report_quality)
   WHERE id = v_project.id;

  RETURN jsonb_build_object(
    'finalized',  true,
    'report_id',  v_report.id,
    'project_id', v_project.id
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.finalize_report_generation(uuid,uuid,jsonb,jsonb,integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.finalize_report_generation(uuid,uuid,jsonb,jsonb,integer) TO service_role;