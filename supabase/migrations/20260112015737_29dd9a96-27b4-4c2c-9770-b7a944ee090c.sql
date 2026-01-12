
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for proper RBAC
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles - only admins can read roles, users can see their own
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix admin_users table - restrict read access
DROP POLICY IF EXISTS "Admin users can be read" ON public.admin_users;
CREATE POLICY "Only admins can read admin_users"
ON public.admin_users
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Fix products table - admin only for write operations
DROP POLICY IF EXISTS "Allow insert for authenticated products" ON public.products;
DROP POLICY IF EXISTS "Allow update for authenticated products" ON public.products;
DROP POLICY IF EXISTS "Allow delete for authenticated products" ON public.products;

CREATE POLICY "Admin only insert products"
ON public.products
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin only update products"
ON public.products
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin only delete products"
ON public.products
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Fix categories table - admin only for write operations
DROP POLICY IF EXISTS "Allow insert for authenticated" ON public.categories;
DROP POLICY IF EXISTS "Allow update for authenticated" ON public.categories;
DROP POLICY IF EXISTS "Allow delete for authenticated" ON public.categories;

CREATE POLICY "Admin only insert categories"
ON public.categories
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin only update categories"
ON public.categories
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin only delete categories"
ON public.categories
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Fix daily_uploads table - admin only
DROP POLICY IF EXISTS "Daily uploads can be inserted" ON public.daily_uploads;
DROP POLICY IF EXISTS "Daily uploads can be updated" ON public.daily_uploads;

CREATE POLICY "Admin only insert daily_uploads"
ON public.daily_uploads
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin only update daily_uploads"
ON public.daily_uploads
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Fix user_profiles table - users can only see/manage their own profile
DROP POLICY IF EXISTS "Users can read profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Anyone can create their profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;

CREATE POLICY "Users can read own profile"
ON public.user_profiles
FOR SELECT
USING (phone_number = current_setting('request.jwt.claims', true)::json->>'phone' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create own profile"
ON public.user_profiles
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own profile"
ON public.user_profiles
FOR UPDATE
USING (phone_number = current_setting('request.jwt.claims', true)::json->>'phone' OR public.has_role(auth.uid(), 'admin'));

-- Fix cart_items table - users can only manage their own cart
DROP POLICY IF EXISTS "Users can manage their cart" ON public.cart_items;

CREATE POLICY "Users can view own cart"
ON public.cart_items
FOR SELECT
USING (user_phone = current_setting('request.jwt.claims', true)::json->>'phone' OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own cart"
ON public.cart_items
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own cart"
ON public.cart_items
FOR UPDATE
USING (user_phone = current_setting('request.jwt.claims', true)::json->>'phone');

CREATE POLICY "Users can delete own cart"
ON public.cart_items
FOR DELETE
USING (user_phone = current_setting('request.jwt.claims', true)::json->>'phone');

-- Fix storage policies - admin only for product-media bucket
DROP POLICY IF EXISTS "Anyone can upload product media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update product media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete product media" ON storage.objects;

CREATE POLICY "Admin only upload product media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin only update product media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin only delete product media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'product-media' AND public.has_role(auth.uid(), 'admin'));

-- Add database constraints for input validation
ALTER TABLE public.products ADD CONSTRAINT price_positive CHECK (price >= 0);
ALTER TABLE public.products ADD CONSTRAINT price_reasonable CHECK (price <= 10000000);
ALTER TABLE public.products ADD CONSTRAINT stock_positive CHECK (stock >= 0);
ALTER TABLE public.products ADD CONSTRAINT stock_reasonable CHECK (stock <= 1000000);
ALTER TABLE public.products ADD CONSTRAINT name_not_empty CHECK (length(name) >= 1);
ALTER TABLE public.products ADD CONSTRAINT name_reasonable CHECK (length(name) <= 500);
