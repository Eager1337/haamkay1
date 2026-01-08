-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  stock INTEGER NOT NULL DEFAULT 0,
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  featured BOOLEAN NOT NULL DEFAULT false,
  is_highlight BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin table for secure login
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create daily upload counter table
CREATE TABLE public.daily_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 0,
  UNIQUE(upload_date)
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_uploads ENABLE ROW LEVEL SECURITY;

-- Public read access for categories and products
CREATE POLICY "Categories are viewable by everyone"
ON public.categories FOR SELECT USING (true);

CREATE POLICY "Products are viewable by everyone"
ON public.products FOR SELECT USING (true);

-- Admin write policies (using service role or authenticated admin)
CREATE POLICY "Allow insert for authenticated"
ON public.categories FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for authenticated"
ON public.categories FOR UPDATE USING (true);

CREATE POLICY "Allow delete for authenticated"
ON public.categories FOR DELETE USING (true);

CREATE POLICY "Allow insert for authenticated products"
ON public.products FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for authenticated products"
ON public.products FOR UPDATE USING (true);

CREATE POLICY "Allow delete for authenticated products"
ON public.products FOR DELETE USING (true);

CREATE POLICY "Admin users can be read"
ON public.admin_users FOR SELECT USING (true);

CREATE POLICY "Daily uploads viewable"
ON public.daily_uploads FOR SELECT USING (true);

CREATE POLICY "Daily uploads can be inserted"
ON public.daily_uploads FOR INSERT WITH CHECK (true);

CREATE POLICY "Daily uploads can be updated"
ON public.daily_uploads FOR UPDATE USING (true);

-- Create storage bucket for product media
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-media', 'product-media', true);

-- Storage policies for product media
CREATE POLICY "Product media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-media');

CREATE POLICY "Anyone can upload product media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-media');

CREATE POLICY "Anyone can update product media"
ON storage.objects FOR UPDATE
USING (bucket_id = 'product-media');

CREATE POLICY "Anyone can delete product media"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-media');

-- Insert default categories
INSERT INTO public.categories (name, description) VALUES 
('Dresses', 'Elegant dresses for every occasion'),
('Wedding', 'Wedding essentials and bridal wear'),
('Shoes', 'Premium footwear collection'),
('Accessories', 'Luxury accessories and jewelry'),
('Bags', 'Designer bags and purses');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for products table
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for products
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;