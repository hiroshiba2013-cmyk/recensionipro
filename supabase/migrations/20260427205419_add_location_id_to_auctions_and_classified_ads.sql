/*
  # Add business location to auctions and classified ads

  Links each auction and classified ad to the specific business location
  (registered_business_location) that created it. This allows filtering
  content per location so each sede only sees its own items.

  Changes:
  - auctions: add registered_business_location_id (nullable FK)
  - classified_ads: add registered_business_location_id (nullable FK)
  - Add indexes for efficient filtering
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'auctions' AND column_name = 'registered_business_location_id'
  ) THEN
    ALTER TABLE auctions
      ADD COLUMN registered_business_location_id uuid REFERENCES registered_business_locations(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'classified_ads' AND column_name = 'registered_business_location_id'
  ) THEN
    ALTER TABLE classified_ads
      ADD COLUMN registered_business_location_id uuid REFERENCES registered_business_locations(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_auctions_registered_business_location
  ON auctions(registered_business_location_id)
  WHERE registered_business_location_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_classified_ads_registered_business_location
  ON classified_ads(registered_business_location_id)
  WHERE registered_business_location_id IS NOT NULL;
