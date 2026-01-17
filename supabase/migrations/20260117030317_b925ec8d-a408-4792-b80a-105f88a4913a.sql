-- Enable crypto helpers for password hashing triggers/functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Remove the public-facing view to avoid any accidental public exposure of customer data
DROP VIEW IF EXISTS public.user_profiles_public;

-- PHONE VERIFICATIONS: lock down sensitive OTP data
-- Remove overly-permissive policies
DROP POLICY IF EXISTS "Read own OTP by phone" ON public.phone_verifications;
DROP POLICY IF EXISTS "Update own OTP" ON public.phone_verifications;
DROP POLICY IF EXISTS "Allow OTP creation" ON public.phone_verifications;

-- Allow creating OTP rows (but validate shape so policy isn't always-true)
CREATE POLICY "Allow OTP creation"
ON public.phone_verifications
FOR INSERT
WITH CHECK (
  phone_number ~ '^[0-9]{8,15}$'
  AND otp_code ~ '^[0-9]{6}$'
  AND expires_at > now()
  AND verified = false
);

-- CART ITEMS: prevent attackers from inserting items into other customers' carts
DROP POLICY IF EXISTS "Users can add to their cart" ON public.cart_items;
CREATE POLICY "Users can add to their cart"
ON public.cart_items
FOR INSERT
WITH CHECK (
  user_phone = ((current_setting('request.jwt.claims'::text, true))::json ->> 'phone'::text)
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- USER PROFILES: remove always-true insert check (still allows signup, but enforces basic validity)
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
CREATE POLICY "Users can create own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (
  phone_number ~ '^[0-9]{8,15}$'
  AND length(display_name) >= 2
  AND length(display_name) <= 80
);