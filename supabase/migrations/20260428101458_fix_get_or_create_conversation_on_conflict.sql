/*
  # Fix get_or_create_conversation race condition and 409 errors

  The function was failing with 409 (unique constraint violation) because:
  1. A race condition between the SELECT and INSERT allowed two concurrent
     calls to both see no existing row and both attempt INSERT.
  2. The lookup used IS NOT DISTINCT FROM on all context columns, so a
     conversation created with different context values (e.g., NULL location)
     wasn't matched when called with a non-NULL location.

  Fix: Use INSERT ... ON CONFLICT DO UPDATE (upsert) so that concurrent
  inserts are handled safely, and always return the existing conversation id.
*/

CREATE OR REPLACE FUNCTION public.get_or_create_conversation(
  p_user1_id uuid,
  p_user2_id uuid,
  p_conversation_type text,
  p_reference_id uuid,
  p_user1_family_member_id uuid DEFAULT NULL,
  p_user2_family_member_id uuid DEFAULT NULL,
  p_user1_location_id uuid DEFAULT NULL,
  p_user2_location_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id uuid;
  v_participant1_id uuid;
  v_participant2_id uuid;
  v_p1_family_member_id uuid;
  v_p2_family_member_id uuid;
  v_p1_location_id uuid;
  v_p2_location_id uuid;
BEGIN
  -- Order participants consistently (smaller UUID first)
  IF p_user1_id < p_user2_id THEN
    v_participant1_id := p_user1_id;
    v_participant2_id := p_user2_id;
    v_p1_family_member_id := p_user1_family_member_id;
    v_p2_family_member_id := p_user2_family_member_id;
    v_p1_location_id := p_user1_location_id;
    v_p2_location_id := p_user2_location_id;
  ELSE
    v_participant1_id := p_user2_id;
    v_participant2_id := p_user1_id;
    v_p1_family_member_id := p_user2_family_member_id;
    v_p2_family_member_id := p_user1_family_member_id;
    v_p1_location_id := p_user2_location_id;
    v_p2_location_id := p_user1_location_id;
  END IF;

  -- Try to find existing conversation (ignoring context columns to avoid
  -- creating duplicates when the same pair contacts about the same reference)
  SELECT id INTO v_conversation_id
  FROM conversations
  WHERE participant1_id = v_participant1_id
    AND participant2_id = v_participant2_id
    AND conversation_type = p_conversation_type
    AND reference_id = p_reference_id
  LIMIT 1;

  -- If found, return immediately
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- Insert with ON CONFLICT to handle race conditions
  INSERT INTO conversations (
    participant1_id,
    participant2_id,
    conversation_type,
    reference_id,
    participant1_family_member_id,
    participant2_family_member_id,
    participant1_location_id,
    participant2_location_id,
    ad_id
  )
  VALUES (
    v_participant1_id,
    v_participant2_id,
    p_conversation_type,
    p_reference_id,
    v_p1_family_member_id,
    v_p2_family_member_id,
    v_p1_location_id,
    v_p2_location_id,
    CASE WHEN p_conversation_type = 'classified_ad' THEN p_reference_id ELSE NULL END
  )
  ON CONFLICT ON CONSTRAINT unique_conversation_with_context
  DO UPDATE SET updated_at = now()
  RETURNING id INTO v_conversation_id;

  -- If ON CONFLICT didn't return (edge case), fetch the existing row
  IF v_conversation_id IS NULL THEN
    SELECT id INTO v_conversation_id
    FROM conversations
    WHERE participant1_id = v_participant1_id
      AND participant2_id = v_participant2_id
      AND conversation_type = p_conversation_type
      AND reference_id = p_reference_id
    LIMIT 1;
  END IF;

  RETURN v_conversation_id;
END;
$$;
