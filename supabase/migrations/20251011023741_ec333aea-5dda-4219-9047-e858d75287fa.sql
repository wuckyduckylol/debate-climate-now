-- Make user_id optional in debates table
ALTER TABLE public.debates ALTER COLUMN user_id DROP NOT NULL;

-- Update RLS policies to allow anonymous access
DROP POLICY IF EXISTS "Users can create their own debates" ON public.debates;
DROP POLICY IF EXISTS "Users can update their own debates" ON public.debates;
DROP POLICY IF EXISTS "Users can view their own debates" ON public.debates;

CREATE POLICY "Anyone can create debates"
ON public.debates
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update debates"
ON public.debates
FOR UPDATE
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can view debates"
ON public.debates
FOR SELECT
TO anon, authenticated
USING (true);

-- Update messages table RLS policies
DROP POLICY IF EXISTS "Users can create messages in their debates" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their debates" ON public.messages;

CREATE POLICY "Anyone can create messages"
ON public.messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view messages"
ON public.messages
FOR SELECT
TO anon, authenticated
USING (true);