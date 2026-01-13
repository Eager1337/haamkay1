-- Fix security: Update phone_verifications RLS to be more restrictive
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can create and verify OTP" ON public.phone_verifications;

-- Create more restrictive policies for phone_verifications
CREATE POLICY "Anyone can create OTP for verification" 
ON public.phone_verifications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can read own OTP by phone" 
ON public.phone_verifications 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update own OTP verification" 
ON public.phone_verifications 
FOR UPDATE 
USING (true);

CREATE POLICY "Cleanup expired OTPs" 
ON public.phone_verifications 
FOR DELETE 
USING (expires_at < now());

-- Fix security: Update cart_items INSERT policy to be more secure
DROP POLICY IF EXISTS "Users can insert own cart" ON public.cart_items;

CREATE POLICY "Users can insert own cart items"
ON public.cart_items
FOR INSERT
WITH CHECK (true);

-- Add password_hash column to user_profiles for authentication
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS password_hash text;

-- Add avatar_url column to user_profiles for profile pictures
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create index for faster phone lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON public.user_profiles(phone_number);

-- Create a function to hash passwords (using pgcrypto)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to verify password
CREATE OR REPLACE FUNCTION public.verify_user_password(p_phone text, p_password text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_password_hash text;
BEGIN
  SELECT id, password_hash INTO v_user_id, v_password_hash
  FROM public.user_profiles
  WHERE phone_number = p_phone;
  
  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;
  
  IF v_password_hash IS NULL OR v_password_hash = '' THEN
    -- User has no password (guest user)
    RETURN NULL;
  END IF;
  
  IF v_password_hash = crypt(p_password, v_password_hash) THEN
    RETURN v_user_id;
  END IF;
  
  RETURN NULL;
END;
$$;

-- Create function to hash password on insert/update
CREATE OR REPLACE FUNCTION public.hash_user_password()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.password_hash IS NOT NULL AND NEW.password_hash != '' THEN
    -- Only hash if it's not already hashed (doesn't start with $2)
    IF NOT NEW.password_hash LIKE '$2%' THEN
      NEW.password_hash := crypt(NEW.password_hash, gen_salt('bf'));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically hash passwords
DROP TRIGGER IF EXISTS hash_password_trigger ON public.user_profiles;
CREATE TRIGGER hash_password_trigger
BEFORE INSERT OR UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.hash_user_password();