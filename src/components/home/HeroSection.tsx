import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import FloatingDiamonds from '../3d/FloatingDiamonds';

const HeroSection = () => {
  return (
    <section className="relative min-h-[85vh] md:min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2000&auto=format&fit=crop"
          alt="Fashion Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* Floating Elements - Hidden on mobile for performance */}
      <div className="hidden md:block">
        <FloatingDiamonds />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 md:px-6 relative z-10 pt-24 md:pt-32">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="inline-block px-3 py-1.5 md:px-4 md:py-2 bg-gold/20 border border-gold/40 rounded-full text-gold text-xs md:text-sm font-medium mb-4 md:mb-6">
              New Collection 2024
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-serif font-bold leading-tight mb-4 md:mb-6"
          >
            Elegance{' '}
            <span className="text-gold-gradient italic">Redefined</span>
            <br />
            For Modern Life.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-sm md:text-lg text-foreground/80 mb-6 md:mb-8 max-w-lg"
          >
            Discover the finest selection of luxury dresses, wedding essentials, 
            and premium accessories in Freetown.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 md:gap-4"
          >
            <Link to="/daily-drops" className="btn-gold flex items-center justify-center gap-2 text-sm md:text-base py-3 md:py-4">
              Shop Daily Drops
              <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
            </Link>
            <Link to="/categories" className="btn-outline-gold text-center text-sm md:text-base py-3 md:py-4">
              Explore Collections
            </Link>
          </motion.div>
        </div>

        {/* Stats - Repositioned for mobile */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-8 md:mt-0 md:absolute md:right-6 md:bottom-32 bg-card/80 backdrop-blur-xl rounded-xl md:rounded-2xl p-4 md:p-6 border border-border"
        >
          <div className="flex md:flex-col gap-6 md:gap-4 justify-center">
            <div className="flex items-center gap-3 md:gap-4">
              <span className="text-2xl md:text-4xl font-bold text-gold">10k+</span>
              <div className="text-xs md:text-sm text-foreground/60">
                <div className="font-medium text-foreground">Satisfied</div>
                Fashionistas
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <span className="text-2xl md:text-4xl font-bold text-gold">24/7</span>
              <div className="text-xs md:text-sm text-foreground/60">
                <div className="font-medium text-foreground">Live Market</div>
                Updates
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
