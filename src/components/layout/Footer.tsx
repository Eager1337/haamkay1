import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Settings, MapPin, Phone, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-teal-darker border-t border-border">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-gold flex items-center justify-center">
                <span className="text-teal-darker font-serif font-bold text-xl">H</span>
              </div>
              <div>
                <h3 className="text-xl font-serif font-bold text-foreground">Haamkay</h3>
                <span className="text-xs text-gold tracking-widest uppercase">Enterprises</span>
              </div>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              Your premier destination for luxury fashion in Sierra Leone. We bring the finest 
              dresses, wedding essentials, and accessories to Freetown.
            </p>
            <div className="flex gap-4">
              <a
                href="https://www.tiktok.com/@haamkay?_r=1&_t=ZM-92tNIZyUYsi"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground/60 hover:bg-gold hover:text-teal-darker transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground/60 hover:bg-gold hover:text-teal-darker transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground/60 hover:bg-gold hover:text-teal-darker transition-all"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground/60 hover:bg-gold hover:text-teal-darker transition-all"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-serif font-semibold text-foreground mb-6">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/categories" className="text-muted-foreground hover:text-gold transition-colors text-sm">
                  All Categories
                </Link>
              </li>
              <li>
                <Link to="/daily-drops" className="text-muted-foreground hover:text-gold transition-colors text-sm">
                  Daily Drops
                </Link>
              </li>
              <li>
                <Link to="/trending" className="text-muted-foreground hover:text-gold transition-colors text-sm">
                  Trending Now
                </Link>
              </li>
              <li>
                <Link to="/our-story" className="text-muted-foreground hover:text-gold transition-colors text-sm">
                  Our Story
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-lg font-serif font-semibold text-foreground mb-6">Customer Service</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-gold transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-gold transition-colors text-sm">
                  Shipping Info
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-gold transition-colors text-sm">
                  Returns & Exchanges
                </a>
              </li>
              <li>
                <a href="#" className="text-muted-foreground hover:text-gold transition-colors text-sm">
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-serif font-semibold text-foreground mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                <span className="text-muted-foreground text-sm">
                  53 Malamah Thomas Street,<br />Freetown, Sierra Leone
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold flex-shrink-0" />
                <a href="tel:+23276682626" className="text-muted-foreground hover:text-gold text-sm transition-colors">
                  +232 76 682 626
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold flex-shrink-0" />
                <a href="mailto:info@haamkay.com" className="text-muted-foreground hover:text-gold text-sm transition-colors">
                  info@haamkay.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-muted-foreground text-sm">
            © 2024 Haamkay Enterprises. All rights reserved.
          </p>
          
          <div className="flex items-center gap-6">
            <a href="#" className="text-muted-foreground hover:text-gold text-sm transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-muted-foreground hover:text-gold text-sm transition-colors">
              Terms of Service
            </a>
            
            {/* Hidden Admin Icon */}
            <Link
              to="/admin"
              className="p-2 text-muted-foreground/30 hover:text-gold transition-colors"
              title="Admin"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
