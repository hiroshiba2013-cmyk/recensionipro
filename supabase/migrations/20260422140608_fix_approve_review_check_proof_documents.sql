/*
  # Fix approve_review to check proof_documents array

  1. Problem
    - The approve_review function only checked proof_image_url for 50 points
    - Users can now upload proof via proof_documents (array of URLs) instead of proof_image_url
    - Reviews with proof_documents were incorrectly awarded 25 points instead of 50

  2. Fix
    - Check BOTH proof_image_url AND proof_documents array when determining points
    - If either has content, award 50 points
    - Clear proof_documents after approval (same as proof_image_url)
*/

CREATE OR REPLACE FUNCTION approve_review(review_id_param uuid, staff_id_param uuid)
RETURNS void AS $$
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

  -- Check both proof_image_url and proof_documents for proof
  has_proof := (review_record.proof_image_url IS NOT NULL AND review_record.proof_image_url != '')
    OR (review_record.proof_documents IS NOT NULL AND array_length(review_record.proof_documents, 1) > 0);

  IF has_proof THEN
    points_to_award := 50;
  ELSE
    points_to_award := 25;
  END IF;

  UPDATE reviews
  SET review_status = 'approved',
      approved_by = staff_id_param,
      approved_at = now(),
      points_awarded = points_to_award,
      proof_image_url = NULL,
      proof_documents = NULL
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
      WHEN has_proof THEN 'La tua recensione con prova e'' stata approvata. +' || points_to_award || ' punti!'
      ELSE 'La tua recensione e'' stata approvata. +' || points_to_award || ' punti!'
    END,
    points_to_award,
    jsonb_build_object('review_id', review_id_param, 'had_proof', has_proof),
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
