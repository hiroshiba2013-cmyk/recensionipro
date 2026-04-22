/*
  # Fix all approval/rejection functions: notifications, points, activity logs

  1. Problems Fixed
    - reject_auction: missing activity log for user
    - approve_job_posting: broken ON CONFLICT for NULL family_member, wrong activity_log columns
    - reject_job_posting: missing activity log for user
    - approve_review: activity log only for admin, not for user
    - reject_review: activity log only for admin, not for user

  2. All Functions Now Consistently Include
    - Notification to the user on approval (with points info)
    - Notification to the user on rejection (with reason if provided)
    - Points awarded on approval (added to user_activity)
    - Activity log entry for the user (with correct schema: activity_type, title, description)
    - Correct NULL family_member_id handling in user_activity upserts
*/

-- Fix reject_auction: add activity log for user
CREATE OR REPLACE FUNCTION reject_auction(p_auction_id uuid, p_admin_id uuid, p_reason text DEFAULT '')
RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_family_member_id uuid;
  v_title text;
BEGIN
  SELECT user_id, family_member_id, title
  INTO v_user_id, v_family_member_id, v_title
  FROM auctions WHERE id = p_auction_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;

  UPDATE auctions
  SET approval_status = 'rejected',
      approval_notes = p_reason,
      status = 'cancelled',
      approved_at = now(),
      approved_by = p_admin_id
  WHERE id = p_auction_id;

  -- Activity log for user
  INSERT INTO activity_log (user_id, family_member_id, activity_type, title, description, points_earned, metadata, icon, color)
  VALUES (
    v_user_id,
    v_family_member_id,
    'auction_rejected',
    'Asta Rifiutata',
    'La tua asta "' || v_title || '" non e'' stata approvata.',
    0,
    jsonb_build_object('auction_id', p_auction_id, 'reason', p_reason),
    'x-circle',
    'red'
  );

  -- Notification to owner
  INSERT INTO notifications (user_id, family_member_id, type, title, message, data)
  VALUES (v_user_id, v_family_member_id, 'auction_rejected',
    'Asta Non Approvata',
    CASE WHEN p_reason IS NOT NULL AND p_reason != '' 
      THEN 'La tua asta "' || v_title || '" non e'' stata approvata. Motivo: ' || p_reason
      ELSE 'La tua asta "' || v_title || '" non e'' stata approvata. Contatta l''assistenza per maggiori informazioni.'
    END,
    jsonb_build_object('auction_id', p_auction_id, 'reason', p_reason)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix approve_job_posting: correct ON CONFLICT, correct activity_log schema, add job title to notification
CREATE OR REPLACE FUNCTION approve_job_posting(p_job_id uuid, p_admin_id uuid)
RETURNS void AS $$
DECLARE
  v_business_id uuid;
  v_owner_id uuid;
  v_job_title text;
BEGIN
  SELECT jp.business_id, jp.title INTO v_business_id, v_job_title
  FROM job_postings jp WHERE jp.id = p_job_id;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Job posting not found';
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM businesses WHERE id = v_business_id;

  UPDATE job_postings
  SET approval_status = 'approved',
      status = 'active',
      approved_at = now(),
      approved_by = p_admin_id
  WHERE id = p_job_id;

  IF v_owner_id IS NOT NULL THEN
    -- Award 10 points with correct NULL handling
    INSERT INTO user_activity (user_id, family_member_id, total_points, job_postings_count, last_activity_at, created_at, updated_at)
    VALUES (v_owner_id, NULL, 10, 1, now(), now(), now())
    ON CONFLICT (user_id) WHERE family_member_id IS NULL
    DO UPDATE SET
      total_points = user_activity.total_points + 10,
      job_postings_count = COALESCE(user_activity.job_postings_count, 0) + 1,
      last_activity_at = now(),
      updated_at = now();

    -- Activity log with correct schema
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

    -- Notification
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (v_owner_id, 'job_approved',
      'Annuncio di Lavoro Approvato',
      'Il tuo annuncio di lavoro "' || COALESCE(v_job_title, '') || '" e'' stato approvato ed e'' ora visibile. Hai guadagnato 10 punti!',
      jsonb_build_object('job_id', p_job_id, 'points_awarded', 10)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix reject_job_posting: add activity log, add job title to notification
CREATE OR REPLACE FUNCTION reject_job_posting(p_job_id uuid, p_admin_id uuid, p_reason text DEFAULT '')
RETURNS void AS $$
DECLARE
  v_business_id uuid;
  v_owner_id uuid;
  v_job_title text;
BEGIN
  SELECT jp.business_id, jp.title INTO v_business_id, v_job_title
  FROM job_postings jp WHERE jp.id = p_job_id;

  IF v_business_id IS NULL THEN
    RAISE EXCEPTION 'Job posting not found';
  END IF;

  SELECT owner_id INTO v_owner_id
  FROM businesses WHERE id = v_business_id;

  UPDATE job_postings
  SET approval_status = 'rejected',
      approval_notes = p_reason,
      status = 'closed',
      approved_at = now(),
      approved_by = p_admin_id
  WHERE id = p_job_id;

  IF v_owner_id IS NOT NULL THEN
    -- Activity log
    INSERT INTO activity_log (user_id, activity_type, title, description, points_earned, metadata, icon, color)
    VALUES (
      v_owner_id,
      'job_posting_rejected',
      'Annuncio di Lavoro Rifiutato',
      'Il tuo annuncio di lavoro "' || COALESCE(v_job_title, '') || '" non e'' stato approvato.',
      0,
      jsonb_build_object('job_id', p_job_id, 'reason', p_reason),
      'x-circle',
      'red'
    );

    -- Notification
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (v_owner_id, 'job_rejected',
      'Annuncio di Lavoro Non Approvato',
      CASE WHEN p_reason IS NOT NULL AND p_reason != ''
        THEN 'Il tuo annuncio di lavoro "' || COALESCE(v_job_title, '') || '" non e'' stato approvato. Motivo: ' || p_reason
        ELSE 'Il tuo annuncio di lavoro "' || COALESCE(v_job_title, '') || '" non e'' stato approvato. Contatta l''assistenza per maggiori informazioni.'
      END,
      jsonb_build_object('job_id', p_job_id, 'reason', p_reason)
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix approve_review: add user-facing activity log (keep admin log too)
CREATE OR REPLACE FUNCTION approve_review(review_id_param uuid, staff_id_param uuid)
RETURNS void AS $$
DECLARE
  review_record RECORD;
  customer_id_var uuid;
  family_member_id_var uuid;
  points_to_award integer;
BEGIN
  SELECT * INTO review_record FROM reviews WHERE id = review_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recensione non trovata';
  END IF;

  IF review_record.review_status != 'pending' THEN
    RAISE EXCEPTION 'La recensione e'' gia'' stata processata';
  END IF;

  IF review_record.proof_image_url IS NOT NULL AND review_record.proof_image_url != '' THEN
    points_to_award := 50;
  ELSE
    points_to_award := 25;
  END IF;

  UPDATE reviews
  SET review_status = 'approved',
      approved_by = staff_id_param,
      approved_at = now(),
      points_awarded = points_to_award,
      proof_image_url = NULL
  WHERE id = review_id_param;

  customer_id_var := review_record.customer_id;
  family_member_id_var := review_record.family_member_id;

  PERFORM award_points(customer_id_var, points_to_award, 'review', 'Recensione approvata', family_member_id_var);

  -- User-facing activity log
  INSERT INTO activity_log (user_id, family_member_id, activity_type, title, description, points_earned, metadata, icon, color)
  VALUES (
    customer_id_var,
    family_member_id_var,
    'review_approved',
    'Recensione Approvata',
    CASE 
      WHEN review_record.proof_image_url IS NOT NULL THEN 'La tua recensione con prova e'' stata approvata. +' || points_to_award || ' punti!'
      ELSE 'La tua recensione e'' stata approvata. +' || points_to_award || ' punti!'
    END,
    points_to_award,
    jsonb_build_object('review_id', review_id_param, 'had_proof', (review_record.proof_image_url IS NOT NULL)),
    'star',
    'green'
  );

  -- Notification
  INSERT INTO notifications (user_id, family_member_id, type, title, message, data)
  VALUES (
    customer_id_var,
    family_member_id_var,
    'review_approved',
    'Recensione Approvata',
    'La tua recensione e'' stata approvata. Hai guadagnato ' || points_to_award || ' punti in classifica!',
    jsonb_build_object('review_id', review_id_param, 'points_awarded', points_to_award)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix reject_review: add user-facing activity log
CREATE OR REPLACE FUNCTION reject_review(review_id_param uuid, staff_id_param uuid)
RETURNS void AS $$
DECLARE
  review_record RECORD;
BEGIN
  SELECT * INTO review_record FROM reviews WHERE id = review_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recensione non trovata';
  END IF;

  IF review_record.review_status != 'pending' THEN
    RAISE EXCEPTION 'La recensione e'' gia'' stata processata';
  END IF;

  UPDATE reviews
  SET review_status = 'rejected',
      approved_by = staff_id_param,
      approved_at = now(),
      points_awarded = 0,
      proof_image_url = NULL
  WHERE id = review_id_param;

  -- User-facing activity log
  INSERT INTO activity_log (user_id, family_member_id, activity_type, title, description, points_earned, metadata, icon, color)
  VALUES (
    review_record.customer_id,
    review_record.family_member_id,
    'review_rejected',
    'Recensione Rifiutata',
    'La tua recensione non e'' stata approvata. Verifica che rispetti le linee guida.',
    0,
    jsonb_build_object('review_id', review_id_param),
    'x-circle',
    'red'
  );

  -- Notification
  INSERT INTO notifications (user_id, family_member_id, type, title, message, data)
  VALUES (
    review_record.customer_id,
    review_record.family_member_id,
    'review_rejected',
    'Recensione Rifiutata',
    'La tua recensione non e'' stata approvata. Verifica che rispetti le linee guida e riprova.',
    jsonb_build_object('review_id', review_id_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
