/*
  # Fix approve_classified_ad activity_log INSERT columns

  The activity_log table uses columns: activity_type, title, description, points_earned, metadata
  The previous function was incorrectly using: action, details
  This fixes the INSERT statement.
*/

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

  INSERT INTO activity_log (user_id, activity_type, title, description, points_earned, metadata, family_member_id)
  VALUES (
    staff_id_param,
    'classified_ad_approved',
    'Annuncio approvato',
    ad_record.title,
    points_to_award,
    jsonb_build_object('ad_id', ad_id_param, 'family_member_id', ad_record.family_member_id),
    NULL
  );
END;
$$;
