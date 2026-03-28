-- Migration: add meta_adset_ids and meta_ad_ids arrays to campaigns
-- Needed to track which Meta objects were created so we can edit/pause/analyze them.

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS meta_adset_ids  text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meta_ad_ids     text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS meta_creative_ids text[] DEFAULT '{}';
