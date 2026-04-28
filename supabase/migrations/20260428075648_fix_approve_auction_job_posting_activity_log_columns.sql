/*
  # Fix approve_auction and approve_job_posting activity_log INSERT columns

  Both functions were using non-existent columns 'action' and 'details'.
  The activity_log table uses: activity_type, title, description, points_earned, metadata.
*/

CREATE OR REPLACE FUNCTION approve_auction(
  p_auction_id uuid,
  p_admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auction RECORD;
  points_to_award integer := 15;
  v_user_type text;
BEGIN
  SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Asta non trovata'; END IF;
  IF v_auction.approval_status != 'pending' THEN RAISE EXCEPTION 'L''asta e'' gia'' stata processata'; END IF;

  SELECT user_type INTO v_user_type FROM profiles WHERE id = v_auction.user_id;
  IF v_user_type = 'business' THEN points_to_award := 0; END IF;

  UPDATE auctions
  SET approval_status = 'approved',
      approved_by = p_admin_id, approved_at = now(),
      points_awarded = points_to_award
  WHERE id = p_auction_id;

  IF points_to_award > 0 THEN
    INSERT INTO user_activity (user_id, family_member_id, total_points, last_activity_at, created_at, updated_at)
    VALUES (v_auction.user_id, NULL, points_to_award, now(), now(), now())
    ON CONFLICT (user_id, family_member_id)
    DO UPDATE SET
      total_points = user_activity.total_points + points_to_award,
      last_activity_at = now(), updated_at = now();
  END IF;

  INSERT INTO activity_log (user_id, activity_type, title, description, points_earned, metadata)
  VALUES (
    p_admin_id,
    'auction_approved',
    'Asta approvata',
    v_auction.title,
    points_to_award,
    jsonb_build_object('auction_id', p_auction_id)
  );
END;
$$;

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
  points_to_award integer := 10;
  v_user_type text;
BEGIN
  SELECT * INTO v_job FROM job_postings WHERE id = p_job_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Offerta di lavoro non trovata'; END IF;
  IF v_job.approval_status != 'pending' THEN RAISE EXCEPTION 'L''offerta e'' gia'' stata processata'; END IF;

  SELECT user_type INTO v_user_type FROM profiles WHERE id = v_job.user_id;
  IF v_user_type = 'business' THEN points_to_award := 0; END IF;

  UPDATE job_postings
  SET approval_status = 'approved',
      approved_by = p_admin_id, approved_at = now(),
      points_awarded = points_to_award
  WHERE id = p_job_id;

  IF points_to_award > 0 THEN
    INSERT INTO user_activity (user_id, family_member_id, total_points, last_activity_at, created_at, updated_at)
    VALUES (v_job.user_id, NULL, points_to_award, now(), now(), now())
    ON CONFLICT (user_id, family_member_id)
    DO UPDATE SET
      total_points = user_activity.total_points + points_to_award,
      last_activity_at = now(), updated_at = now();
  END IF;

  INSERT INTO activity_log (user_id, activity_type, title, description, points_earned, metadata)
  VALUES (
    p_admin_id,
    'job_posting_approved',
    'Offerta di lavoro approvata',
    v_job.title,
    points_to_award,
    jsonb_build_object('job_id', p_job_id)
  );
END;
$$;
