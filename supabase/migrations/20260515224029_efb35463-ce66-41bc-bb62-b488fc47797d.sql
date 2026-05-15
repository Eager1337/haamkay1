-- Guest-only storefront security hardening
-- Remove obsolete phone/password authentication surfaces and lock down unused customer tables.

-- Drop obsolete public profile view if it still exists.
DROP VIEW IF EXISTS public.user_profiles_public;

-- Drop triggers that depended on obsolete password hashing.
DROP TRIGGER IF EXISTS hash_password_trigger ON public.user_profiles;

-- Drop obsolete phone/password authentication helper functions.
DROP FUNCTION IF EXISTS public.check_phone_exists(text);
DROP FUNCTION IF EXISTS public.verify_user_password(text, text);
DROP FUNCTION IF EXISTS public.verify_otp(text, text);
DROP FUNCTION IF EXISTS public.hash_user_password();

-- Remove password hashes from the legacy profiles table.
ALTER TABLE public.user_profiles
DROP COLUMN IF EXISTS password_hash;

-- Remove obsolete phone verification data entirely; the storefront no longer uses phone OTP sign-up.
DROP TABLE IF EXISTS public.phone_verifications;

-- Replace phone-claim based cart policies with admin-only read access for the unused legacy cart table.
DROP POLICY IF EXISTS "Users can view own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can add to their cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can insert own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can manage their cart" ON public.cart_items;
DROP POLICY IF EXISTS "Legacy cart is admin readable only" ON public.cart_items;
DROP POLICY IF EXISTS "Legacy cart is not publicly writable" ON public.cart_items;

CREATE POLICY "Legacy cart is admin readable only"
ON public.cart_items
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Replace phone-claim based profile policies with admin-only read access and no public writes.
DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can read profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can create their profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Legacy profiles are admin readable only" ON public.user_profiles;
DROP POLICY IF EXISTS "Legacy profiles are not publicly writable" ON public.user_profiles;

CREATE POLICY "Legacy profiles are admin readable only"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Add durable database-level validation to remaining legacy profile fields in case admin tools use them later.
ALTER TABLE public.user_profiles
DROP CONSTRAINT IF EXISTS user_profiles_phone_format,
DROP CONSTRAINT IF EXISTS user_profiles_display_name_length,
DROP CONSTRAINT IF EXISTS user_profiles_display_name_no_html;

ALTER TABLE public.user_profiles
ADD CONSTRAINT user_profiles_phone_format CHECK (phone_number ~ '^[0-9]{8,15}$'),
ADD CONSTRAINT user_profiles_display_name_length CHECK (char_length(display_name) BETWEEN 2 AND 100),
ADD CONSTRAINT user_profiles_display_name_no_html CHECK (display_name !~ '<[^>]+>');

-- Restrict product media uploads at the bucket configuration layer.
UPDATE storage.buckets
SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ]::text[]
WHERE id = 'product-media';