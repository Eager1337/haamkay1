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
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <Link to={`/product/${id}`} className="block">
        <div className="card-luxury overflow-hidden p-3 md:p-6">
          {/* Image Container */}
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg md:rounded-xl mb-3 md:mb-4">
            <img
              src={image || 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400'}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-teal-darker/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Badges */}
            <div className="absolute top-2 md:top-3 left-2 md:left-3 flex flex-col gap-1 md:gap-2">
              {featured && (
                <span className="px-2 py-0.5 md:px-3 md:py-1 bg-gold text-teal-darker text-[10px] md:text-xs font-semibold rounded-full flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 md:w-3 md:h-3" />
                  Featured
                </span>
              )}
              {isHighlight && (
                <span className="px-2 py-0.5 md:px-3 md:py-1 bg-destructive text-foreground text-[10px] md:text-xs font-semibold rounded-full animate-pulse-glow">
                  Today's Pick
                </span>
              )}
            </div>

            {/* Verified Badge */}
            <div className="absolute top-2 md:top-3 right-2 md:right-3">
              <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-teal flex items-center justify-center">
                <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 text-gold" />
              </div>
            </div>

            {/* Wishlist Button - Hidden on mobile for cleaner look */}
            <button className="hidden md:flex absolute bottom-3 right-3 w-10 h-10 rounded-full bg-card/80 backdrop-blur items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gold hover:text-teal-darker">
              <Heart className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-1 md:space-y-2">
            <span className="text-[10px] md:text-xs text-gold uppercase tracking-wider">
              {category}
            </span>
            <h3 className="font-serif font-semibold text-sm md:text-lg text-foreground line-clamp-1">
              {name}
            </h3>
            <p className="text-base md:text-xl font-bold text-gold">
              Le {price.toLocaleString()}
            </p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
