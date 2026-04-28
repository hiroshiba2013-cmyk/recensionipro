/*
  # Exclude business users from points system and leaderboard

  Business users do not participate in the points/ranking system.
  All point-awarding functions now check the user's type and skip
  if user_type = 'business'.

  ## Changes
  1. Replace award_points - adds business user check at the top
  2. Replace approve_classified_ad - skips points for business users
  3. Replace approve_auction - skips points for business users
  4. Replace approve_job_posting - skips points for business users
  5. Replace award_points_for_unclaimed_business trigger fn - skips business users
*/

-- 1. Replace award_points with business-user guard
DROP FUNCTION IF EXISTS award_points(uuid, integer, text, text, uuid);

CREATE FUNCTION award_points(
  p_user_id uuid,
  p_points integer,
  p_activity_type text,
  p_description text DEFAULT '',
  p_family_member_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_total integer;
  v_exists boolean;
  v_user_type text;
BEGIN
  -- Business users do not participate in the points system
  SELECT user_type INTO v_user_type FROM profiles WHERE id = p_user_id;
  IF v_user_type = 'business' THEN
    RETURN 0;
  END IF;

  IF p_family_member_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM user_activity
      WHERE user_id = p_user_id AND family_member_id = p_family_member_id
    ) INTO v_exists;

    IF v_exists THEN
      UPDATE user_activity SET
        total_points = total_points + p_points,
        reviews_count = CASE WHEN p_activity_type = 'review' THEN reviews_count + 1 ELSE reviews_count END,
        last_activity_at = now(),
        updated_at = now()
      WHERE user_id = p_user_id AND family_member_id = p_family_member_id;
    ELSE
      INSERT INTO user_activity (user_id, family_member_id, total_points, reviews_count, last_activity_at, created_at, updated_at)
      VALUES (p_user_id, p_family_member_id, p_points,
        CASE WHEN p_activity_type = 'review' THEN 1 ELSE 0 END,
        now(), now(), now());
    END IF;

    SELECT total_points INTO v_new_total FROM user_activity
    WHERE user_id = p_user_id AND family_member_id = p_family_member_id;
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM user_activity
      WHERE user_id = p_user_id AND family_member_id IS NULL
    ) INTO v_exists;

    IF v_exists THEN
      UPDATE user_activity SET
        total_points = total_points + p_points,
        reviews_count = CASE WHEN p_activity_type = 'review' THEN reviews_count + 1 ELSE reviews_count END,
        last_activity_at = now(),
        updated_at = now()
      WHERE user_id = p_user_id AND family_member_id IS NULL;
    ELSE
      INSERT INTO user_activity (user_id, family_member_id, total_points, reviews_count, last_activity_at, created_at, updated_at)
      VALUES (p_user_id, NULL, p_points,
        CASE WHEN p_activity_type = 'review' THEN 1 ELSE 0 END,
        now(), now(), now());
    END IF;

    SELECT total_points INTO v_new_total FROM user_activity
    WHERE user_id = p_user_id AND family_member_id IS NULL;
  END IF;

  RETURN v_new_total;
END;
$$;

-- 2. Replace approve_classified_ad - skip points for business users
CREATE OR REPLACE FUNCTION approve_classified_ad(
  ad_id_param uuid,
  staff_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ad_record RECORD;
  points_to_award integer := 5;
  v_user_type text;
BEGIN
  SELECT * INTO ad_record FROM classified_ads WHERE id = ad_id_param;
  IF NOT FOUND THEN RAISE EXCEPTION 'Annuncio non trovato'; END IF;
  IF ad_record.approval_status != 'pending' THEN RAISE EXCEPTION 'L''annuncio e'' gia'' stato processato'; END IF;

  SELECT user_type INTO v_user_type FROM profiles WHERE id = ad_record.user_id;
  IF v_user_type = 'business' THEN points_to_award := 0; END IF;

  UPDATE classified_ads
  SET approval_status = 'approved', status = 'active',
      approved_by = staff_id_param, approved_at = now(),
      points_awarded = points_to_award
  WHERE id = ad_id_param;

  IF points_to_award > 0 THEN
    PERFORM award_points(ad_record.user_id, points_to_award, 'classified_ad', 'Annuncio approvato', ad_record.family_member_id);
  END IF;

  INSERT INTO activity_log (user_id, action, details)
  VALUES (staff_id_param, 'classified_ad_approved', jsonb_build_object(
    'ad_id', ad_id_param, 'ad_title', ad_record.title,
    'points_awarded', points_to_award, 'family_member_id', ad_record.family_member_id
  ));
END;
$$;

-- 3. Replace approve_auction - skip points for business users
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

  INSERT INTO activity_log (user_id, action, details)
  VALUES (p_admin_id, 'auction_approved', jsonb_build_object(
    'auction_id', p_auction_id, 'auction_title', v_auction.title,
    'points_awarded', points_to_award
  ));
END;
$$;

-- 4. Replace approve_job_posting - skip points for business users
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

  INSERT INTO activity_log (user_id, action, details)
  VALUES (p_admin_id, 'job_posting_approved', jsonb_build_object(
    'job_id', p_job_id, 'job_title', v_job.title,
    'points_awarded', points_to_award
  ));
END;
$$;

-- 5. Replace award_points_for_unclaimed_business trigger - skip business users
CREATE OR REPLACE FUNCTION award_points_for_unclaimed_business()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points integer;
  v_user_type text;
BEGIN
  -- Business users do not receive points
  SELECT user_type INTO v_user_type FROM profiles WHERE id = NEW.added_by;
  IF v_user_type = 'business' THEN
    RETURN NEW;
  END IF;

  IF NEW.approval_status = 'approved' THEN
    v_points := 25;
  ELSE
    v_points := 0;
  END IF;

  IF v_points > 0 THEN
    PERFORM award_points(NEW.added_by, v_points, 'unclaimed_business', 'Attività aggiunta e approvata', NULL);
  END IF;

  RETURN NEW;
END;
$$;
