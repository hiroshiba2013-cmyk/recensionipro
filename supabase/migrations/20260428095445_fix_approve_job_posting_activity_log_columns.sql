/*
  # Fix approve_job_posting activity_log column names

  activity_log uses activity_type/metadata/points_earned, not action/details/points_awarded.
*/

CREATE OR REPLACE FUNCTION approve_job_posting(
  p_job_id uuid,
  p_admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job RECORD;
  v_owner_id uuid;
BEGIN
  SELECT jp.*, rb.owner_id
  INTO v_job
  FROM job_postings jp
  LEFT JOIN registered_businesses rb ON rb.id = jp.registered_business_id
  WHERE jp.id = p_job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job posting not found';
  END IF;

  IF v_job.owner_id IS NULL AND v_job.business_id IS NOT NULL THEN
    SELECT owner_id INTO v_owner_id FROM businesses WHERE id = v_job.business_id;
  ELSE
    v_owner_id := v_job.owner_id;
  END IF;

  UPDATE job_postings
  SET approval_status = 'approved',
      status = 'active',
      approved_at = now(),
      approved_by = p_admin_id
  WHERE id = p_job_id;

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
      'Il tuo annuncio di lavoro e'' stato approvato',
      10,
      jsonb_build_object('job_id', p_job_id),
      'check-circle',
      'green'
    );

    INSERT INTO notifications (user_id, business_location_id, type, title, message, data)
    VALUES (
      v_owner_id,
      v_job.registered_business_location_id,
      'job_approved',
      'Annuncio di lavoro approvato',
      'Il tuo annuncio di lavoro e'' stato approvato ed e'' ora visibile. Hai guadagnato 10 punti!',
      jsonb_build_object('job_id', p_job_id)
    );
  END IF;
END;
$$;
