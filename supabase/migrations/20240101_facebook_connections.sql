CREATE TABLE facebook_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP,
  ad_account_id TEXT,
  ad_account_name TEXT,
  facebook_user_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE facebook_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own connections"
ON facebook_connections FOR ALL
USING (auth.uid() = user_id);
