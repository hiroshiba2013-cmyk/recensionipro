/*
  # Add business_location_id to notifications

  ## Summary
  Adds a `business_location_id` column to the `notifications` table so that
  business users can filter notifications by the currently selected location
  in their dashboard.

  ## Changes
  - `notifications`: add nullable `business_location_id` uuid column
  - Update `get_unread_notification_count` to support location filtering
  - Update `mark_all_notifications_read` to support location filtering
  - Update `approve_classified_ad` / `reject_classified_ad` to stamp the location
  - Update `approve_job_posting` / `reject_job_posting` to stamp the location
  - Add trigger function to stamp location on new review notification for business owner
*/

-- 1. Add column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'business_location_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN business_location_id uuid REFERENCES registered_business_locations(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_business_location_id ON notifications(business_location_id);

-- 2. Updated get_unread_notification_count (respects location filter for business users)
CREATE OR REPLACE FUNCTION get_unread_notification_count(
  p_family_member_id uuid DEFAULT NULL,
  p_business_location_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count integer;
BEGIN
  IF p_business_location_id IS NOT NULL THEN
    -- Business user with specific location selected:
    -- show notifications for that location OR notifications with no location
    SELECT COUNT(*)::integer INTO v_count
    FROM notifications
    WHERE user_id = auth.uid()
      AND read = false
      AND (business_location_id = p_business_location_id OR business_location_id IS NULL);
  ELSIF p_family_member_id IS NOT NULL THEN
    SELECT COUNT(*)::integer INTO v_count
    FROM notifications
    WHERE user_id = auth.uid()
      AND read = false
      AND family_member_id = p_family_member_id;
  ELSE
    SELECT COUNT(*)::integer INTO v_count
    FROM notifications
    WHERE user_id = auth.uid()
      AND read = false
      AND family_member_id IS NULL;
  END IF;

  RETURN COALESCE(v_count, 0);
END;
$$;

-- 3. Updated mark_all_notifications_read (respects location filter)
CREATE OR REPLACE FUNCTION mark_all_notifications_read(
  p_family_member_id uuid DEFAULT NULL,
  p_business_location_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_business_location_id IS NOT NULL THEN
    UPDATE notifications
    SET read = true
    WHERE user_id = auth.uid()
      AND read = false
      AND (business_location_id = p_business_location_id OR business_location_id IS NULL);
  ELSIF p_family_member_id IS NOT NULL THEN
    UPDATE notifications
    SET read = true
    WHERE user_id = auth.uid()
      AND read = false
      AND family_member_id = p_family_member_id;
  ELSE
    UPDATE notifications
    SET read = true
    WHERE user_id = auth.uid()
      AND read = false
      AND family_member_id IS NULL;
  END IF;
END;
$$;

-- 4. approve_classified_ad: stamp business_location_id
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
  v_exists boolean;
BEGIN
  SELECT * INTO ad_record FROM classified_ads WHERE id = ad_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Annuncio non trovato';
  END IF;

  IF ad_record.approval_status != 'pending' THEN
    RAISE EXCEPTION 'L''annuncio e'' gia'' stato processato';
  END IF;

  UPDATE classified_ads
  SET approval_status = 'approved',
      status = 'active',
      approved_by = staff_id_param,
      approved_at = now(),
      points_awarded = points_to_award
  WHERE id = ad_id_param;

  PERFORM award_points(
    ad_record.user_id,
    points_to_award,
    'classified_ad',
    'Annuncio approvato',
    ad_record.family_member_id
  );

  IF ad_record.family_member_id IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM user_activity
      WHERE user_id = ad_record.user_id AND family_member_id = ad_record.family_member_id
    ) INTO v_exists;
    IF v_exists THEN
      UPDATE user_activity SET ads_posted_count = ads_posted_count + 1, last_activity_at = now(), updated_at = now()
      WHERE user_id = ad_record.user_id AND family_member_id = ad_record.family_member_id;
    ELSE
      INSERT INTO user_activity (user_id, family_member_id, ads_posted_count, last_activity_at, created_at, updated_at)
      VALUES (ad_record.user_id, ad_record.family_member_id, 1, now(), now(), now());
    END IF;
  ELSE
    SELECT EXISTS(
      SELECT 1 FROM user_activity
      WHERE user_id = ad_record.user_id AND family_member_id IS NULL
    ) INTO v_exists;
    IF v_exists THEN
      UPDATE user_activity SET ads_posted_count = ads_posted_count + 1, last_activity_at = now(), updated_at = now()
      WHERE user_id = ad_record.user_id AND family_member_id IS NULL;
    ELSE
      INSERT INTO user_activity (user_id, family_member_id, ads_posted_count, last_activity_at, created_at, updated_at)
      VALUES (ad_record.user_id, NULL, 1, now(), now(), now());
    END IF;
  END IF;

  INSERT INTO activity_log (user_id, family_member_id, activity_type, title, description, points_earned, metadata, icon, color)
  VALUES (
    ad_record.user_id, ad_record.family_member_id, 'classified_ad_approved', 'Annuncio Approvato',
    'Il tuo annuncio "' || ad_record.title || '" e'' stato approvato', points_to_award,
    jsonb_build_object('ad_id', ad_id_param, 'ad_title', ad_record.title, 'approved_by', staff_id_param),
    'check-circle', 'green'
  );

  INSERT INTO notifications (user_id, family_member_id, business_location_id, type, title, message, data)
  VALUES (
    ad_record.user_id,
    ad_record.family_member_id,
    ad_record.registered_business_location_id,
    'classified_ad_approved',
    'Annuncio Approvato',
    'Il tuo annuncio "' || ad_record.title || '" e'' stato approvato e pubblicato. Hai guadagnato ' || points_to_award || ' punti in classifica!',
    jsonb_build_object('ad_id', ad_id_param, 'ad_title', ad_record.title, 'points_awarded', points_to_award)
  );
END;
$$;

-- 5. reject_classified_ad: stamp business_location_id
CREATE OR REPLACE FUNCTION reject_classified_ad(
  ad_id_param uuid,
  staff_id_param uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  ad_record RECORD;
BEGIN
  SELECT * INTO ad_record FROM classified_ads WHERE id = ad_id_param;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Annuncio non trovato';
  END IF;

  IF ad_record.approval_status != 'pending' THEN
    RAISE EXCEPTION 'L''annuncio e'' gia'' stato processato';
  END IF;

  UPDATE classified_ads
  SET approval_status = 'rejected', approved_by = staff_id_param, approved_at = now(), points_awarded = 0
  WHERE id = ad_id_param;

  INSERT INTO activity_log (user_id, family_member_id, activity_type, title, description, points_earned, metadata, icon, color)
  VALUES (
    ad_record.user_id, ad_record.family_member_id, 'classified_ad_rejected', 'Annuncio Rifiutato',
    'Il tuo annuncio "' || ad_record.title || '" e'' stato rifiutato', 0,
    jsonb_build_object('ad_id', ad_id_param, 'ad_title', ad_record.title, 'rejected_by', staff_id_param),
    'x-circle', 'red'
  );

  INSERT INTO notifications (user_id, family_member_id, business_location_id, type, title, message, data)
  VALUES (
    ad_record.user_id,
    ad_record.family_member_id,
    ad_record.registered_business_location_id,
    'classified_ad_rejected',
    'Annuncio Rifiutato',
    'Il tuo annuncio "' || ad_record.title || '" non e'' stato approvato. Verifica che rispetti le linee guida e riprova.',
    jsonb_build_object('ad_id', ad_id_param, 'ad_title', ad_record.title)
  );
END;
$$;

-- 6. approve_job_posting: stamp business_location_id
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
  v_owner_id uuid;
BEGIN
  SELECT jp.*, rb.owner_id
  INTO v_job
  FROM job_postings jp
  LEFT JOIN registered_businesses rb ON rb.id = jp.registered_business_id
  WHERE jp.id = p_job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job posting not found';
  END IF;

  -- fallback to old businesses table
  IF v_job.owner_id IS NULL AND v_job.business_id IS NOT NULL THEN
    SELECT owner_id INTO v_owner_id FROM businesses WHERE id = v_job.business_id;
  ELSE
    v_owner_id := v_job.owner_id;
  END IF;

  UPDATE job_postings
  SET approval_status = 'approved', status = 'active', approved_at = now(), approved_by = p_admin_id
  WHERE id = p_job_id;

  IF v_owner_id IS NOT NULL THEN
    INSERT INTO user_activity (user_id, total_points, job_postings_count)
    VALUES (v_owner_id, 10, 1)
    ON CONFLICT (user_id, COALESCE(family_member_id, '00000000-0000-0000-0000-000000000000'))
    DO UPDATE SET
      total_points = user_activity.total_points + 10,
      job_postings_count = COALESCE(user_activity.job_postings_count, 0) + 1;

    INSERT INTO activity_log (user_id, action, details, points_awarded)
    VALUES (v_owner_id, 'job_posting_approved', jsonb_build_object('job_id', p_job_id), 10);

    INSERT INTO notifications (user_id, business_location_id, type, title, message, data)
    VALUES (
      v_owner_id,
      v_job.registered_business_location_id,
      'job_approved',
      'Annuncio di lavoro approvato',
      'Il tuo annuncio di lavoro e'' stato approvato ed e'' ora visibile. Hai guadagnato 10 punti!',
      jsonb_build_object('job_id', p_job_id)
    );
  END IF;
END;
$$;

-- 7. reject_job_posting: stamp business_location_id
CREATE OR REPLACE FUNCTION reject_job_posting(
  p_job_id uuid,
  p_admin_id uuid,
  p_reason text DEFAULT ''
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_job RECORD;
  v_owner_id uuid;
BEGIN
  SELECT jp.*, rb.owner_id
  INTO v_job
  FROM job_postings jp
  LEFT JOIN registered_businesses rb ON rb.id = jp.registered_business_id
  WHERE jp.id = p_job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job posting not found';
  END IF;

  IF v_job.owner_id IS NULL AND v_job.business_id IS NOT NULL THEN
    SELECT owner_id INTO v_owner_id FROM businesses WHERE id = v_job.business_id;
  ELSE
    v_owner_id := v_job.owner_id;
  END IF;

  UPDATE job_postings
  SET approval_status = 'rejected', approval_notes = p_reason, status = 'closed', approved_at = now(), approved_by = p_admin_id
  WHERE id = p_job_id;

  IF v_owner_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, business_location_id, type, title, message, data)
    VALUES (
      v_owner_id,
      v_job.registered_business_location_id,
      'job_rejected',
      'Annuncio di lavoro non approvato',
      CASE WHEN p_reason != ''
        THEN 'Il tuo annuncio di lavoro non e'' stato approvato. Motivo: ' || p_reason
        ELSE 'Il tuo annuncio di lavoro non e'' stato approvato. Contatta l''assistenza per maggiori informazioni.'
      END,
      jsonb_build_object('job_id', p_job_id)
    );
  END IF;
END;
$$;

-- 8. Trigger: stamp business_location_id on notifications generated for new reviews on a business location
CREATE OR REPLACE FUNCTION notify_business_owner_on_review()
RETURNS TRIGGER AS $$
DECLARE
  v_owner_id uuid;
  v_location_id uuid;
  v_business_name text;
BEGIN
  -- Only notify for approved reviews
  IF NEW.review_status != 'approved' THEN
    RETURN NEW;
  END IF;

  -- Determine location: prefer business_location_id, then unclaimed_business_location_id
  v_location_id := COALESCE(NEW.business_location_id, NEW.unclaimed_business_location_id);

  IF v_location_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Try registered_business_locations first
  SELECT rb.owner_id, rbl.name
  INTO v_owner_id, v_business_name
  FROM registered_business_locations rbl
  JOIN registered_businesses rb ON rb.id = rbl.business_id
  WHERE rbl.id = v_location_id;

  IF v_owner_id IS NULL THEN
    -- Try unclaimed business locations
    SELECT ubl.name INTO v_business_name
    FROM unclaimed_business_locations ubl
    WHERE ubl.id = v_location_id;
    -- No owner to notify for unclaimed
    RETURN NEW;
  END IF;

  -- Don't notify if owner is the reviewer
  IF v_owner_id = NEW.customer_id THEN
    RETURN NEW;
  END IF;

  INSERT INTO notifications (user_id, business_location_id, type, title, message, data)
  VALUES (
    v_owner_id,
    v_location_id,
    'review_received',
    'Nuova Recensione Ricevuta',
    'Hai ricevuto una nuova recensione per ' || COALESCE(v_business_name, 'la tua sede') || '.',
    jsonb_build_object('review_id', NEW.id, 'location_id', v_location_id, 'rating', NEW.overall_rating)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS notify_business_on_review ON reviews;
CREATE TRIGGER notify_business_on_review
  AFTER INSERT OR UPDATE OF review_status ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION notify_business_owner_on_review();
