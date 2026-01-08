import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import FloatingDiamonds from '../3d/FloatingDiamonds';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2000&auto=format&fit=crop"
          alt="Fashion Hero"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-hero" />
      </div>

      {/* 3D Floating Elements */}
      <FloatingDiamonds />

      {/* Content */}
      <div className="container mx-auto px-6 relative z-10 pt-32">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="inline-block px-4 py-2 bg-gold/20 border border-gold/40 rounded-full text-gold text-sm font-medium mb-6">
              New Collection 2024
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-5xl md:text-7xl font-serif font-bold leading-tight mb-6"
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
            className="text-lg text-foreground/80 mb-8 max-w-lg"
          >
            Discover the finest selection of luxury dresses, wedding essentials, 
            and premium accessories in Freetown.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-wrap gap-4"
          >
            <Link to="/daily-drops" className="btn-gold flex items-center gap-2">
              Shop Daily Drops
              <ChevronRight className="w-5 h-5" />
            </Link>
            <Link to="/categories" className="btn-outline-gold">
              Explore Collections
            </Link>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="absolute right-6 bottom-32 bg-card/80 backdrop-blur-xl rounded-2xl p-6 border border-border"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-gold">10k+</span>
              <div className="text-sm text-foreground/60">
                <div className="font-medium text-foreground">Satisfied</div>
                Fashionistas
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-bold text-gold">24/7</span>
              <div className="text-sm text-foreground/60">
                <div className="font-medium text-foreground">Live Market</div>
                Updates
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
