import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Star, Flame } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductCard from '@/components/home/ProductCard';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  images: string[] | null;
  featured: boolean;
  is_highlight: boolean;
}

const Trending = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (data) {
        setFeaturedProducts(data.filter(p => p.featured));
        setAllProducts(data);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-40 pb-20">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-destructive/20 rounded-full text-destructive mb-4">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">Hot Right Now</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              <span className="text-gold-gradient">Trending</span> Products
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover what's popular among our customers
            </p>
          </motion.div>

          {/* Featured Section */}
          {featuredProducts.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
                <Star className="w-6 h-6 text-gold" />
                Featured Products
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProducts.slice(0, 6).map(product => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    category={product.category}
                    price={product.price}
                    image={product.images?.[0] || ''}
                    featured={product.featured}
                    isHighlight={product.is_highlight}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Trending */}
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-gold" />
              Popular Items
            </h2>
            {loading ? (
              <div className="text-center text-gold">Loading...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {allProducts.slice(0, 12).map(product => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    category={product.category}
                    price={product.price}
                    image={product.images?.[0] || ''}
                    featured={product.featured}
                    isHighlight={product.is_highlight}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Trending;
