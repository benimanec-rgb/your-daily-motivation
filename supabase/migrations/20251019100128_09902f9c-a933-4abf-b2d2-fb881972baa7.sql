-- Drop the permissive public policies on user_sessions table
DROP POLICY IF EXISTS "Anyone can read user sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Anyone can create user sessions" ON public.user_sessions;

-- Drop the permissive public policies on daily_quotes table for consistency
DROP POLICY IF EXISTS "Anyone can read daily quotes" ON public.daily_quotes;
DROP POLICY IF EXISTS "Anyone can create daily quotes" ON public.daily_quotes;

-- Note: With no policies, these tables are now completely private.
-- The edge function will continue to work as it uses the service role key which bypasses RLS.