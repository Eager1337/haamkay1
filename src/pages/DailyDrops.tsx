import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Sparkles } from 'lucide-react';
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
  created_at: string;
}

const DailyDrops = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      // Get products from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data } = await supabase
        .from('products')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false });
      
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

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
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/20 rounded-full text-gold mb-4">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Fresh Arrivals</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Daily <span className="text-gold-gradient">Drops</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto flex items-center justify-center gap-2">
              <Clock className="w-4 h-4" />
              New products added every day • {today}
            </p>
          </motion.div>

          {/* Today's Highlights */}
          {products.some(p => p.is_highlight) && (
            <div className="mb-16">
              <h2 className="text-2xl font-serif font-bold text-foreground mb-6 flex items-center gap-2">
                <span className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
                Today's Highlight
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.filter(p => p.is_highlight).map(product => (
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

          {/* Recent Drops */}
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-6">
              This Week's Drops ({products.length} products)
            </h2>
            {loading ? (
              <div className="text-center text-gold">Loading...</div>
            ) : products.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p>No new products this week. Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map(product => (
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

export default DailyDrops;
