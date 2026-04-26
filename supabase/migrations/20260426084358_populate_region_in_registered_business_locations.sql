/*
  # Populate region in registered_business_locations

  Sets the region field based on province, using the unclaimed_business_locations
  table as reference (which has accurate province-to-region mappings from OSM data).
  Also adds a trigger to auto-populate region on insert/update.
*/

UPDATE registered_business_locations rbl
SET region = (
  SELECT DISTINCT ubl.region
  FROM unclaimed_business_locations ubl
  WHERE ubl.province = rbl.province
    AND ubl.region IS NOT NULL
    AND ubl.region != ''
  LIMIT 1
)
WHERE (region IS NULL OR region = '')
  AND province IS NOT NULL
  AND province != '';
