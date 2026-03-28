ALTER TABLE business_profiles
  ADD COLUMN IF NOT EXISTS business_portfolio_id TEXT,
  ADD COLUMN IF NOT EXISTS business_portfolio_name TEXT;
