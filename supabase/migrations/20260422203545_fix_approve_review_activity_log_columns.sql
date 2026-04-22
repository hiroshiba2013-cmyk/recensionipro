/*
  # Fix approve_review activity_log column names

  1. Changes
    - Fix `approve_review` function: replace incorrect `action` and `details` columns
      with the correct `activity_type`, `title`, `description`, `points_earned`, `metadata`, `icon`, `color`, `family_member_id` columns
    - Now matches the actual `activity_log` table schema and all other approval functions

  2. Important Notes
    - Only `approve_review` was affected; `reject_review` and all other approval/rejection functions already use correct columns
*/

CREATE OR REPLACE FUNCTION approve_review(review_id_param uuid, staff_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  review_record RECORD;
  customer_id_var uuid;
  family_member_id_var uuid;
  points_to_award integer;
  has_proof boolean;
BEGIN
  SELECT * INTO review_record FROM reviews WHERE id = review_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Recensione non trovata';
  END IF;

  IF review_record.review_status != 'pending' THEN
    RAISE EXCEPTION 'La recensione e'' gia'' stata processata';
  END IF;

  has_proof := (
    (review_record.proof_image_url IS NOT NULL AND review_record.proof_image_url != '')
    OR
    (review_record.proof_documents IS NOT NULL AND array_length(review_record.proof_documents, 1) > 0)
  );

  IF has_proof THEN
    points_to_award := 50;
  ELSE
    points_to_award := 25;
  END IF;

  UPDATE reviews
  SET review_status = 'approved',
      approved_by = staff_id_param,
      approved_at = now(),
      points_awarded = points_to_award
  WHERE id = review_id_param;

  customer_id_var := review_record.customer_id;
  family_member_id_var := review_record.family_member_id;

  PERFORM award_points(customer_id_var, points_to_award, 'review', 'Recensione approvata', family_member_id_var);

  INSERT INTO activity_log (user_id, family_member_id, activity_type, title, description, points_earned, metadata, icon, color)
  VALUES (
    customer_id_var,
    family_member_id_var,
    'review_approved',
    'Recensione Approvata',
    'La tua recensione e'' stata approvata. Hai guadagnato ' || points_to_award || ' punti in classifica!',
    points_to_award,
    jsonb_build_object(
      'review_id', review_id_param,
      'points_awarded', points_to_award,
      'had_proof', has_proof,
      'approved_by', staff_id_param
    ),
    'check-circle',
    'green'
  );

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
$$;