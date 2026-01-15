-- Fix the security definer view and remaining RLS issues

-- 1. Drop the insecure view and recreate with security_invoker
DROP VIEW IF EXISTS public.user_profiles_public;

CREATE VIEW public.user_profiles_public
WITH (security_invoker = on) AS
SELECT 
  id,
  phone_number,
  display_name,
  how_found_us,
  shopping_interests,
  avatar_url,
  created_at,
  updated_at
FROM public.user_profiles;

-- 2. Grant access to the view
GRANT SELECT ON public.user_profiles_public TO anon, authenticated;

-- 3. Drop the admin_users table completely (already tried but may still exist)
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- 4. Add new functions for verify_otp and check_phone_exists if they don't exist
CREATE OR REPLACE FUNCTION public.verify_otp(p_phone text, p_otp text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_valid boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.phone_verifications
    WHERE phone_number = p_phone
      AND otp_code = p_otp
      AND expires_at > now()
      AND verified = false
  ) INTO v_valid;
  
  IF v_valid THEN
    -- Mark as verified
    UPDATE public.phone_verifications
    SET verified = true
    WHERE phone_number = p_phone AND otp_code = p_otp;
    
    -- Clean up old OTPs for this phone
    DELETE FROM public.phone_verifications
    WHERE phone_number = p_phone AND otp_code != p_otp;
  END IF;
  
  RETURN v_valid;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_phone_exists(p_phone text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles WHERE phone_number = p_phone
  );
$$;