/*
  # Fix unique_conversation_with_context constraint to treat NULLs as equal

  ## Problem
  PostgreSQL B-tree unique indexes treat NULL != NULL, so rows with all-NULL
  context columns are not considered duplicates. This causes duplicate conversations
  and 409 errors.

  ## Changes
  1. Remove duplicate conversations (keep oldest)
  2. Drop constraint via ALTER TABLE
  3. Recreate with NULLS NOT DISTINCT
*/

-- Step 1: Remove duplicate conversations keeping the oldest one
DELETE FROM conversations
WHERE id NOT IN (
  SELECT DISTINCT ON (
    participant1_id,
    participant2_id,
    conversation_type,
    reference_id,
    COALESCE(participant1_family_member_id::text, ''),
    COALESCE(participant2_family_member_id::text, ''),
    COALESCE(participant1_location_id::text, ''),
    COALESCE(participant2_location_id::text, '')
  ) id
  FROM conversations
  ORDER BY
    participant1_id,
    participant2_id,
    conversation_type,
    reference_id,
    COALESCE(participant1_family_member_id::text, ''),
    COALESCE(participant2_family_member_id::text, ''),
    COALESCE(participant1_location_id::text, ''),
    COALESCE(participant2_location_id::text, ''),
    created_at ASC
);

-- Step 2: Drop constraint via ALTER TABLE
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS unique_conversation_with_context;

-- Step 3: Recreate with NULLS NOT DISTINCT
CREATE UNIQUE INDEX unique_conversation_with_context
  ON conversations (
    participant1_id,
    participant2_id,
    conversation_type,
    reference_id,
    participant1_family_member_id,
    participant2_family_member_id,
    participant1_location_id,
    participant2_location_id
  )
  NULLS NOT DISTINCT;

-- Re-add as constraint (so ON CONFLICT ON CONSTRAINT still works)
ALTER TABLE conversations
  ADD CONSTRAINT unique_conversation_with_context
  UNIQUE USING INDEX unique_conversation_with_context;
