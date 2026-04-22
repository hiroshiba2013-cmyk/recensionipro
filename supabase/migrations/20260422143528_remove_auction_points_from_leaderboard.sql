/*
  # Remove auction points from leaderboard

  1. Problem
    - Auctions were awarding 15 points upon approval
    - Auctions should NOT contribute to the leaderboard/points system
    - Some users already received illegitimate auction points

  2. Changes
    - Update `approve_auction` function to no longer award points or increment auctions_count
    - Subtract all previously awarded auction points from user_activity
    - Reset auctions_count to 0 for all users

  3. Notes
    - The activity_log entries are kept for audit trail but points_earned is set to 0
    - Notifications already sent cannot be revoked, but points are corrected
*/

-- Fix existing data: subtract auction points already awarded
UPDATE user_activity ua
SET total_points = GREATEST(ua.total_points - COALESCE(agg.auction_points, 0), 0),
    auctions_count = 0,
    updated_at = now()
FROM (
  SELECT user_id, family_member_id, SUM(points_earned) AS auction_points
  FROM activity_log
  WHERE activity_type = 'auction_approved' AND points_earned > 0
  GROUP BY user_id, family_member_id
) agg
WHERE ua.user_id = agg.user_id
  AND (ua.family_member_id IS NOT DISTINCT FROM agg.family_member_id);

-- Zero out auction points in activity_log for history accuracy
UPDATE activity_log
SET points_earned = 0,
    description = description || ' (punti rimossi: le aste non danno punti)'
WHERE activity_type = 'auction_approved' AND points_earned > 0;

-- Recreate approve_auction WITHOUT points
CREATE OR REPLACE FUNCTION approve_auction(
  p_auction_id uuid,
  p_admin_id uuid
)
RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_family_member_id uuid;
  v_duration_days integer;
BEGIN
  SELECT user_id, family_member_id, COALESCE(duration_days, 7)
  INTO v_user_id, v_family_member_id, v_duration_days
  FROM auctions WHERE id = p_auction_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;

  UPDATE auctions
  SET approval_status = 'approved',
      status = 'active',
      approved_at = now(),
      approved_by = p_admin_id,
      ends_at = now() + (v_duration_days || ' days')::interval
  WHERE id = p_auction_id;

  -- Log activity (no points)
  INSERT INTO activity_log (user_id, family_member_id, activity_type, title, description, points_earned, icon, color, metadata, created_at)
  VALUES (v_user_id, v_family_member_id, 'auction_approved', 'Asta approvata',
    'La tua asta e'' stata approvata ed e'' ora visibile.',
    0, 'gavel', 'green',
    jsonb_build_object('auction_id', p_auction_id), now());

  -- Send notification to owner (no points mention)
  INSERT INTO notifications (user_id, family_member_id, type, title, message, data)
  VALUES (v_user_id, v_family_member_id, 'auction_approved',
    'Asta approvata',
    'La tua asta e'' stata approvata ed e'' ora visibile a tutti gli utenti. Il timer di ' || v_duration_days || ' giorni e'' partito ora.',
    jsonb_build_object('auction_id', p_auction_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
