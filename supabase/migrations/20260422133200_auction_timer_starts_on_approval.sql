/*
  # Auction timer starts from admin approval

  1. Changes
    - Add `duration_days` integer column to `auctions` table to store the user-selected duration
    - Update `approve_auction` function to recalculate `ends_at` = now() + duration_days at approval time
    - Backfill existing auctions: estimate duration_days from ends_at - created_at

  2. Behavior
    - When a user creates an auction, they choose a duration (e.g. 7 days)
    - The duration is saved in `duration_days`
    - `ends_at` is set to a placeholder (far future) until approval
    - When admin approves, `ends_at` is recalculated as now() + duration_days
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auctions' AND column_name = 'duration_days'
  ) THEN
    ALTER TABLE auctions ADD COLUMN duration_days integer DEFAULT 7;
  END IF;
END $$;

-- Backfill existing auctions: estimate duration from ends_at - created_at
UPDATE auctions
SET duration_days = GREATEST(1, EXTRACT(DAY FROM (ends_at - created_at))::integer)
WHERE duration_days IS NULL OR duration_days = 7;

-- Update approve_auction to recalculate ends_at from approval time
CREATE OR REPLACE FUNCTION approve_auction(p_auction_id uuid, p_admin_id uuid)
RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_family_member_id uuid;
  v_duration_days integer;
BEGIN
  -- Get auction owner and duration
  SELECT user_id, family_member_id, COALESCE(duration_days, 7)
  INTO v_user_id, v_family_member_id, v_duration_days
  FROM auctions WHERE id = p_auction_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Auction not found';
  END IF;

  -- Update auction: set approved, recalculate ends_at from NOW
  UPDATE auctions
  SET approval_status = 'approved',
      status = 'active',
      approved_at = now(),
      approved_by = p_admin_id,
      ends_at = now() + (v_duration_days || ' days')::interval
  WHERE id = p_auction_id;

  -- Award 15 points for auction creation
  IF v_family_member_id IS NOT NULL THEN
    INSERT INTO user_activity (user_id, family_member_id, total_points, auctions_count, last_activity_at, created_at, updated_at)
    VALUES (v_user_id, v_family_member_id, 15, 1, now(), now(), now())
    ON CONFLICT (user_id, family_member_id)
    DO UPDATE SET
      total_points = user_activity.total_points + 15,
      auctions_count = COALESCE(user_activity.auctions_count, 0) + 1,
      last_activity_at = now(),
      updated_at = now();
  ELSE
    INSERT INTO user_activity (user_id, family_member_id, total_points, auctions_count, last_activity_at, created_at, updated_at)
    VALUES (v_user_id, NULL, 15, 1, now(), now(), now())
    ON CONFLICT (user_id) WHERE family_member_id IS NULL
    DO UPDATE SET
      total_points = user_activity.total_points + 15,
      auctions_count = COALESCE(user_activity.auctions_count, 0) + 1,
      last_activity_at = now(),
      updated_at = now();
  END IF;

  -- Log activity
  INSERT INTO activity_log (user_id, family_member_id, activity_type, title, description, points_earned, icon, color, metadata, created_at)
  VALUES (v_user_id, v_family_member_id, 'auction_approved', 'Asta approvata',
    'La tua asta e'' stata approvata ed e'' ora visibile.',
    15, 'gavel', 'green',
    jsonb_build_object('auction_id', p_auction_id), now());

  -- Send notification to owner
  INSERT INTO notifications (user_id, family_member_id, type, title, message, data)
  VALUES (v_user_id, v_family_member_id, 'auction_approved',
    'Asta approvata',
    'La tua asta e'' stata approvata ed e'' ora visibile a tutti gli utenti. Hai guadagnato 15 punti! Il timer di ' || v_duration_days || ' giorni e'' partito ora.',
    jsonb_build_object('auction_id', p_auction_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
