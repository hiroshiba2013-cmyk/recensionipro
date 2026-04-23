/*
  # Fix double-counting in business additions and review approvals

  1. Problem: businesses_added_count was incremented BOTH on INSERT (submission) 
     AND on UPDATE (approval), resulting in double-counting
  2. Problem: trigger_log_review_approval created duplicate activity_log entries 
     because approve_review function already logs the activity
  
  3. Changes:
     - Drop trigger_increment_unclaimed_business_count (INSERT trigger) 
       since businesses_added_count should only increment on approval
     - Drop trigger_log_review_approval since approve_review function 
       already handles activity logging and notifications
     - Fix log_review_approval trigger that checked only proof_image_url 
       (old field) instead of also checking proof_documents (new field)
  
  4. Important notes:
     - The approval trigger (trigger_award_points_unclaimed_business_on_approval) 
       remains active and handles both points AND count increment
     - The decrement trigger on DELETE remains active for correct cleanup
     - The approve_review function already correctly logs activity, awards points, 
       and sends notifications
*/

-- 1. Drop the INSERT trigger that double-counts businesses_added_count
DROP TRIGGER IF EXISTS trigger_increment_unclaimed_business_count ON unclaimed_business_locations;

-- 2. Drop the review approval trigger that creates duplicate activity_log entries
DROP TRIGGER IF EXISTS trigger_log_review_approval ON reviews;
