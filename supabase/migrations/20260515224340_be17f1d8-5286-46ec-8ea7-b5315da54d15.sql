-- Fix public bucket listing and exposed SECURITY DEFINER execute grants.

DROP POLICY IF EXISTS "Product media is publicly accessible" ON storage.objects;

-- The product-media bucket remains public for direct product image/video URLs, but removing
-- the broad object read policy prevents anonymous listing through the storage API.

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO postgres;