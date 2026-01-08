import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ProductCard from './ProductCard';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  images: string[];
  featured: boolean;
  is_highlight: boolean;
}

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('products-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        () => {
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('featured', true)
      .order('created_at', { ascending: false })
      .limit(8);

    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-end justify-between mb-12"
        >
          <div>
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              Curated For You
            </h2>
            <p className="text-muted-foreground text-lg">
              Handpicked favorites from our luxury collection
            </p>
          </div>
          <Link
            to="/categories"
            className="hidden md:flex items-center gap-2 text-gold hover:gap-4 transition-all font-medium"
          >
            View All
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card-luxury animate-pulse">
                <div className="aspect-[3/4] bg-muted rounded-xl mb-4" />
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-6 bg-muted rounded w-2/3 mb-2" />
                <div className="h-6 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
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
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              No featured products yet. Check back soon!
            </p>
          </div>
        )}

        {/* Mobile View All */}
        <div className="md:hidden mt-8 text-center">
          <Link
            to="/categories"
            className="inline-flex items-center gap-2 text-gold font-medium"
          >
            View All Products
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
