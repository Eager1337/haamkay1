import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Phone, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Categories', path: '/categories' },
  { name: 'Daily Drops', path: '/daily-drops' },
  { name: 'Trending', path: '/trending' },
  { name: 'Our Story', path: '/our-story' },
  { name: 'Contact', path: '/contact' },
];

const Header = () => {
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Top Bar */}
      <div className="bg-teal-darker py-2 text-center">
        <p className="text-sm text-foreground/80">
          Visit us at 53 Malamah Thomas Street, Freetown • Delivery Nationwide
        </p>
      </div>
      
      {/* Main Header */}
      <div className="glass-effect border-b border-border">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gold flex items-center justify-center">
                <span className="text-teal-darker font-serif font-bold text-xl">H</span>
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold text-foreground">Haamkay</h1>
                <span className="text-xs text-gold tracking-widest uppercase">Enterprises</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`relative py-2 text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'text-gold'
                      : 'text-foreground/80 hover:text-gold'
                  }`}
                >
                  {link.name}
                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold"
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 text-foreground/80 hover:text-gold transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
              
              <a
                href="tel:+23276682626"
                className="hidden md:flex items-center gap-2 text-foreground/80 hover:text-gold transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="text-sm">+232 76 682 626</span>
              </a>
              
              <button className="relative p-2 text-foreground/80 hover:text-gold transition-colors">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-teal-darker text-xs rounded-full flex items-center justify-center">
                  0
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Search Overlay */}
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute top-full left-0 right-0 bg-card border-b border-border p-4"
        >
          <div className="container mx-auto">
            <input
              type="text"
              placeholder="Search for products..."
              className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-gold"
              autoFocus
            />
          </div>
        </motion.div>
      )}
    </motion.header>
  );
};

export default Header;
