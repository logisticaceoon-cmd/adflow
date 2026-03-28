-- Add targeting and placement columns to campaigns table
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS target_country       TEXT,
  ADD COLUMN IF NOT EXISTS target_age_min       INTEGER,
  ADD COLUMN IF NOT EXISTS target_age_max       INTEGER,
  ADD COLUMN IF NOT EXISTS target_gender        TEXT,
  ADD COLUMN IF NOT EXISTS target_interests     JSONB,
  ADD COLUMN IF NOT EXISTS recommended_placement TEXT,
  ADD COLUMN IF NOT EXISTS recommended_schedule  TEXT;
