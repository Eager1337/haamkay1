import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Phone, ShoppingBag, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      {/* Top Bar - Hidden on mobile for cleaner look */}
      <div className="bg-teal-darker py-1.5 md:py-2 text-center">
        <p className="text-xs md:text-sm text-foreground/80 px-4 truncate">
          📍 53 Malamah Thomas Street, Freetown
        </p>
      </div>
      
      {/* Main Header */}
      <div className="glass-effect border-b border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-14 md:h-20">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 text-foreground/80 hover:text-gold transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gold flex items-center justify-center">
                <span className="text-teal-darker font-serif font-bold text-lg md:text-xl">H</span>
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-serif font-bold text-foreground">Haamkay</h1>
                <span className="text-[10px] md:text-xs text-gold tracking-widest uppercase hidden sm:block">Enterprises</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
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
            <div className="flex items-center gap-2 md:gap-4">
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-card border-b border-border overflow-hidden"
          >
            <nav className="container mx-auto px-4 py-4">
              <div className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`py-3 px-4 rounded-lg text-base font-medium transition-colors ${
                      location.pathname === link.path
                        ? 'bg-gold/20 text-gold'
                        : 'text-foreground/80 hover:bg-muted'
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              
              {/* Mobile Phone */}
              <a
                href="tel:+23276682626"
                className="flex items-center gap-3 mt-4 pt-4 border-t border-border text-gold"
              >
                <Phone className="w-5 h-5" />
                <span className="font-medium">+232 76 682 626</span>
              </a>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Overlay */}
      <AnimatePresence>
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
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
