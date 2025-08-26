-- Fix infinite recursion in profiles RLS policies
-- The issue is that admin policies were checking profiles table to determine if user is admin,
-- creating circular dependency

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- Create new policies that don't cause recursion
-- Allow users to view their own profile (this remains the same)
-- Allow users to insert their own profile when signing up
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own profile (already exists, keeping as is)
-- Allow users to update their own profile (already exists, keeping as is)

-- For admin functionality, we'll handle it in the application layer
-- rather than through RLS policies to avoid circular dependencies