-- 1. Restore execute permission on the admin-check helper (root cause of upload failures)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;

-- 2. Products: hide unpublished from the public
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.products;
CREATE POLICY "Published products are viewable by everyone"
  ON public.products FOR SELECT USING (published = true);
CREATE POLICY "Admins can view all products"
  ON public.products FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tiktok_url text;

-- 3. Price history
CREATE TABLE public.price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  old_price numeric,
  new_price numeric NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  note text
);
GRANT SELECT ON public.price_history TO anon, authenticated;
GRANT ALL ON public.price_history TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.price_history TO authenticated;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Price history viewable by everyone" ON public.price_history FOR SELECT USING (true);
CREATE POLICY "Admins manage price history" ON public.price_history FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.log_price_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.price_history(product_id, old_price, new_price) VALUES (NEW.id, NULL, NEW.price);
  ELSIF NEW.price IS DISTINCT FROM OLD.price THEN
    INSERT INTO public.price_history(product_id, old_price, new_price) VALUES (NEW.id, OLD.price, NEW.price);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.log_price_change() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER products_price_history
AFTER INSERT OR UPDATE OF price ON public.products
FOR EACH ROW EXECUTE FUNCTION public.log_price_change();

INSERT INTO public.price_history(product_id, old_price, new_price, changed_at, note)
SELECT id, NULL, price, created_at, 'Initial price' FROM public.products;

-- 4. AI draft approval queue
CREATE TABLE public.ai_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  category text,
  price numeric NOT NULL DEFAULT 0,
  description text,
  stock integer NOT NULL DEFAULT 1,
  images text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  error text,
  published_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_drafts TO authenticated;
GRANT ALL ON public.ai_drafts TO service_role;
ALTER TABLE public.ai_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage ai drafts" ON public.ai_drafts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER ai_drafts_updated_at BEFORE UPDATE ON public.ai_drafts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Site settings (TikTok page etc.)
CREATE TABLE public.site_settings (
  key text PRIMARY KEY,
  value text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings viewable by everyone" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage settings" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER site_settings_updated_at BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.site_settings(key, value) VALUES ('tiktok_url', 'https://www.tiktok.com/@haamkay');