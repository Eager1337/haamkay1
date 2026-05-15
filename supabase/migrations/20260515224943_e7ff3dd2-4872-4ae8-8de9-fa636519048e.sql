-- Final cleanup of unused customer profile table and explicit role write denies.
DROP TABLE IF EXISTS public.user_profiles;

DROP POLICY IF EXISTS "No direct role inserts" ON public.user_roles;
DROP POLICY IF EXISTS "No direct role updates" ON public.user_roles;
DROP POLICY IF EXISTS "No direct role deletes" ON public.user_roles;

CREATE POLICY "No direct role inserts"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "No direct role updates"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "No direct role deletes"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);