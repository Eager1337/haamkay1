-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'general',
  title text NOT NULL,
  body text,
  image_url text,
  link text,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notifications viewable by everyone" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Admins insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update notifications" ON public.notifications FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete notifications" ON public.notifications FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- PUSH SUBSCRIBERS
CREATE TABLE public.push_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.push_subscribers TO anon;
GRANT SELECT, INSERT, DELETE ON public.push_subscribers TO authenticated;
GRANT ALL ON public.push_subscribers TO service_role;
ALTER TABLE public.push_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can subscribe" ON public.push_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins view subscribers" ON public.push_subscribers FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins delete subscribers" ON public.push_subscribers FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- MEDIA LIBRARY
CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  path text NOT NULL,
  file_name text,
  media_type text NOT NULL DEFAULT 'image',
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage media" ON public.media_assets FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- SCHEDULED CHANGES
CREATE TABLE public.scheduled_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  change_type text NOT NULL DEFAULT 'price',
  new_price numeric,
  release_at timestamptz NOT NULL,
  applied boolean NOT NULL DEFAULT false,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scheduled_changes TO authenticated;
GRANT ALL ON public.scheduled_changes TO service_role;
ALTER TABLE public.scheduled_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage scheduled changes" ON public.scheduled_changes FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER update_scheduled_changes_updated_at BEFORE UPDATE ON public.scheduled_changes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- PRODUCT EXTRAS
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold integer NOT NULL DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT true;

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;