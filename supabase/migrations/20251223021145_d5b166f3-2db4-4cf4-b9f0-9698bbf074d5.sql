-- Allow authenticated users to view all user stats for leaderboard
CREATE POLICY "Authenticated users can view all stats for leaderboard"
ON public.user_stats
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to view all profiles for leaderboard display names
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Drop the restrictive policies that only allow viewing own data
DROP POLICY IF EXISTS "Users can view own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;