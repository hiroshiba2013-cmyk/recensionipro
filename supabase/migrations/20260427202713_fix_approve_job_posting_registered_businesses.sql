/*
  # Fix approve_job_posting to support registered businesses

  The current function fails with "Job posting not found" when the job posting
  belongs to a registered_business (registered_business_id) instead of a legacy
  business (business_id), because it only looks at business_id.

  This migration recreates the function to handle both cases.
*/

CREATE OR REPLACE FUNCTION approve_job_posting(p_job_id uuid, p_admin_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_business_id uuid;
  v_registered_business_id uuid;
  v_owner_id uuid;
  v_job_title text;
BEGIN
  SELECT jp.business_id, jp.registered_business_id, jp.title
    INTO v_business_id, v_registered_business_id, v_job_title
  FROM job_postings jp
  WHERE jp.id = p_job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job posting not found';
  END IF;

  -- Approve the posting
  UPDATE job_postings
  SET approval_status = 'approved',
      status = 'active',
      approved_at = now(),
      approved_by = p_admin_id
  WHERE id = p_job_id;

  -- Resolve owner
  IF v_business_id IS NOT NULL THEN
    SELECT owner_id INTO v_owner_id FROM businesses WHERE id = v_business_id;
  ELSIF v_registered_business_id IS NOT NULL THEN
    SELECT owner_id INTO v_owner_id FROM registered_businesses WHERE id = v_registered_business_id;
  END IF;

  IF v_owner_id IS NOT NULL THEN
    INSERT INTO user_activity (user_id, family_member_id, total_points, job_postings_count, last_activity_at, created_at, updated_at)
    VALUES (v_owner_id, NULL, 10, 1, now(), now(), now())
    ON CONFLICT (user_id) WHERE family_member_id IS NULL
    DO UPDATE SET
      total_points = user_activity.total_points + 10,
      job_postings_count = COALESCE(user_activity.job_postings_count, 0) + 1,
      last_activity_at = now(),
      updated_at = now();

    INSERT INTO activity_log (user_id, activity_type, title, description, points_earned, metadata, icon, color)
    VALUES (
      v_owner_id,
      'job_posting_approved',
      'Annuncio di Lavoro Approvato',
      'Il tuo annuncio di lavoro "' || COALESCE(v_job_title, '') || '" e'' stato approvato.',
      10,
      jsonb_build_object('job_id', p_job_id, 'job_title', v_job_title),
      'briefcase',
      'green'
    );

    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      v_owner_id,
      'job_approved',
      'Annuncio di Lavoro Approvato',
      'Il tuo annuncio di lavoro "' || COALESCE(v_job_title, '') || '" e'' stato approvato ed e'' ora visibile. Hai guadagnato 10 punti!',
      jsonb_build_object('job_id', p_job_id, 'points_awarded', 10)
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION reject_job_posting(p_job_id uuid, p_admin_id uuid, p_reason text DEFAULT '')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_business_id uuid;
  v_registered_business_id uuid;
  v_owner_id uuid;
  v_job_title text;
BEGIN
  SELECT jp.business_id, jp.registered_business_id, jp.title
    INTO v_business_id, v_registered_business_id, v_job_title
  FROM job_postings jp
  WHERE jp.id = p_job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job posting not found';
  END IF;

  UPDATE job_postings
  SET approval_status = 'rejected',
      status = 'closed',
      approval_notes = p_reason,
      approved_at = now(),
      approved_by = p_admin_id
  WHERE id = p_job_id;

  IF v_business_id IS NOT NULL THEN
    SELECT owner_id INTO v_owner_id FROM businesses WHERE id = v_business_id;
  ELSIF v_registered_business_id IS NOT NULL THEN
    SELECT owner_id INTO v_owner_id FROM registered_businesses WHERE id = v_registered_business_id;
  END IF;

  IF v_owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      v_owner_id,
      'job_rejected',
      'Annuncio di Lavoro Rifiutato',
      'Il tuo annuncio di lavoro "' || COALESCE(v_job_title, '') || '" non e'' stato approvato.' ||
        CASE WHEN p_reason != '' THEN ' Motivo: ' || p_reason ELSE '' END,
      jsonb_build_object('job_id', p_job_id, 'reason', p_reason)
    );
  END IF;
END;
$$;
