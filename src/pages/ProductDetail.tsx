import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, ShieldCheck, Heart, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string | null;
  stock: number;
  images: string[] | null;
  videos: string[] | null;
  featured: boolean;
  is_highlight: boolean;
}

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (data) {
        setProduct(data);
        // Fetch related products
        const { data: related } = await supabase
          .from('products')
          .select('*')
          .eq('category', data.category)
          .neq('id', id)
          .limit(4);
        if (related) setRelatedProducts(related);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-40 flex items-center justify-center">
          <div className="text-gold">Loading...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-40 container mx-auto px-6 text-center">
          <h1 className="text-3xl font-serif text-foreground mb-4">Product Not Found</h1>
          <Link to="/" className="btn-gold inline-block">Back to Home</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-40 pb-20">
        <div className="container mx-auto px-6">
          {/* Breadcrumb */}
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold mb-8">
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image Gallery */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-4">
                <img
                  src={images[currentImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex(i => i === 0 ? images.length - 1 : i - 1)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-gold hover:text-teal-darker transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex(i => i === images.length - 1 ? 0 : i + 1)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center text-foreground hover:bg-gold hover:text-teal-darker transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
                {product.featured && (
                  <span className="absolute top-4 left-4 px-3 py-1 bg-gold text-teal-darker text-sm font-semibold rounded-full flex items-center gap-1">
                    <Star className="w-4 h-4" /> Featured
                  </span>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      i === currentImageIndex ? 'border-gold' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              
              {/* Videos */}
              {product.videos && product.videos.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Product Videos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {product.videos.map((video, i) => (
                      <video key={i} controls className="rounded-lg w-full">
                        <source src={video} type="video/mp4" />
                      </video>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Product Info */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
              <div>
                <span className="text-gold uppercase tracking-wider text-sm">{product.category}</span>
                <h1 className="text-4xl font-serif font-bold text-foreground mt-2">{product.name}</h1>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-gold">Le {product.price.toLocaleString()}</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ShieldCheck className="w-5 h-5 text-gold" />
                  <span className="text-sm">Verified Authentic</span>
                </div>
              </div>

              <p className="text-muted-foreground leading-relaxed">
                {product.description || 'Experience luxury with this premium product from Haamkay Enterprises. Quality guaranteed.'}
              </p>

              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className={`px-3 py-1 rounded-full ${product.stock > 0 ? 'bg-green-500/20 text-green-400' : 'bg-destructive/20 text-destructive'}`}>
                  {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                </span>
              </div>

              <div className="flex gap-4">
                <a
                  href={`https://wa.me/23276682626?text=Hi, I'm interested in ${product.name} (Le ${product.price.toLocaleString()})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-gold flex-1 text-center"
                >
                  Order via WhatsApp
                </a>
                <button className="btn-outline-gold px-4">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="btn-outline-gold px-4">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-20">
              <h2 className="text-2xl font-serif font-bold text-foreground mb-8">Related Products</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map(p => (
                  <Link key={p.id} to={`/product/${p.id}`} className="card-luxury group">
                    <div className="aspect-square rounded-xl overflow-hidden mb-4">
                      <img
                        src={p.images?.[0] || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <span className="text-xs text-gold uppercase">{p.category}</span>
                    <h3 className="text-foreground font-semibold">{p.name}</h3>
                    <p className="text-gold font-bold">Le {p.price.toLocaleString()}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
