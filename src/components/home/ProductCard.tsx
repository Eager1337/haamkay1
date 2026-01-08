import { motion } from 'framer-motion';
import { ShieldCheck, Star, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  featured?: boolean;
  isHighlight?: boolean;
}

const ProductCard = ({ 
  id, 
  name, 
  category, 
  price, 
  image, 
  featured, 
  isHighlight 
}: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      className="group relative"
    >
      <Link to={`/product/${id}`} className="block">
        <div className="card-luxury overflow-hidden">
          {/* Image Container */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-xl mb-4">
            <img
              src={image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-teal-darker/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {featured && (
                <span className="px-3 py-1 bg-gold text-teal-darker text-xs font-semibold rounded-full flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Featured
                </span>
              )}
              {isHighlight && (
                <span className="px-3 py-1 bg-destructive text-foreground text-xs font-semibold rounded-full animate-pulse-glow">
                  Today's Highlight
                </span>
              )}
            </div>

            {/* Verified Badge */}
            <div className="absolute top-3 right-3">
              <div className="w-8 h-8 rounded-full bg-teal flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-gold" />
              </div>
            </div>

            {/* Wishlist Button */}
            <button className="absolute bottom-3 right-3 w-10 h-10 rounded-full bg-card/80 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gold hover:text-teal-darker">
              <Heart className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <span className="text-xs text-gold uppercase tracking-wider">
              {category}
            </span>
            <h3 className="font-serif font-semibold text-lg text-foreground line-clamp-1">
              {name}
            </h3>
            <p className="text-xl font-bold text-gold">
              Le {price.toLocaleString()}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
