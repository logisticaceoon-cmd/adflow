-- Migration: atomic consume_user_credits RPC
-- Replaces the race-condition-prone check + increment pattern with a single
-- transactional function that validates balance and deducts atomically.

CREATE OR REPLACE FUNCTION consume_user_credits(
  p_user_id    uuid,
  p_action     text,
  p_cost       int  DEFAULT 1,
  p_campaign_id uuid DEFAULT NULL
)
RETURNS TABLE(success boolean, credits_remaining int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total     int;
  v_used      int;
  v_remaining int;
BEGIN
  -- Lock the profile row so concurrent calls don't double-spend
  SELECT credits_total, credits_used
    INTO v_total, v_used
    FROM profiles
   WHERE id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0;
    RETURN;
  END IF;

  v_remaining := GREATEST(0, COALESCE(v_total, 0) - COALESCE(v_used, 0));

  IF v_remaining < p_cost THEN
    RETURN QUERY SELECT false, v_remaining;
    RETURN;
  END IF;

  -- Atomic deduction
  UPDATE profiles
     SET credits_used = COALESCE(credits_used, 0) + p_cost
   WHERE id = p_user_id;

  -- Audit log
  INSERT INTO credit_usage (user_id, action, credits_used, campaign_id)
  VALUES (p_user_id, p_action, p_cost, p_campaign_id);

  RETURN QUERY SELECT true, (v_remaining - p_cost);
END;
$$;

-- Grant execute to authenticated users (service role already bypasses RLS)
GRANT EXECUTE ON FUNCTION consume_user_credits(uuid, text, int, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION consume_user_credits(uuid, text, int, uuid) TO service_role;
