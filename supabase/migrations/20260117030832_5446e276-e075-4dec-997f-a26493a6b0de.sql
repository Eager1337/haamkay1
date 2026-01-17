-- Fix phone_verifications: add explicit SELECT deny policy and UPDATE policy for verification
DROP POLICY IF EXISTS "No public SELECT on phone_verifications" ON public.phone_verifications;
CREATE POLICY "No public SELECT on phone_verifications"
ON public.phone_verifications
FOR SELECT
USING (false);

DROP POLICY IF EXISTS "No public UPDATE on phone_verifications" ON public.phone_verifications;
CREATE POLICY "No public UPDATE on phone_verifications"
ON public.phone_verifications
FOR UPDATE
USING (false);