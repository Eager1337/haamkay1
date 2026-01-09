import { motion } from 'framer-motion';
import { Diamond, Heart, ShieldCheck, Truck, Award, Users } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

const stats = [
  { number: '5+', label: 'Years of Excellence' },
  { number: '10K+', label: 'Happy Customers' },
  { number: '500+', label: 'Premium Products' },
  { number: '24/7', label: 'Customer Support' },
];

const values = [
  { icon: Diamond, title: 'Quality First', description: 'We source only the finest products, ensuring every item meets our strict quality standards.' },
  { icon: Heart, title: 'Customer Love', description: 'Your satisfaction is our priority. We go above and beyond to make you happy.' },
  { icon: ShieldCheck, title: 'Authenticity', description: 'Every product is verified authentic. No compromises on genuineness.' },
  { icon: Truck, title: 'Fast Delivery', description: 'Nationwide delivery with careful handling and tracking.' },
];

const OurStory = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-40 pb-20">
        {/* Hero Section */}
        <section className="container mx-auto px-6 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground mb-6">
              Our <span className="text-gold-gradient">Story</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Haamkay Enterprises was founded with a simple mission: to bring premium, 
              authentic products to Sierra Leone. What started as a small venture has 
              grown into one of the most trusted names in luxury retail.
            </p>
          </motion.div>
        </section>

        {/* Stats */}
        <section className="bg-gradient-card py-16 mb-20">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="text-center"
                >
                  <div className="text-4xl md:text-5xl font-serif font-bold text-gold mb-2">
                    {stat.number}
                  </div>
                  <div className="text-muted-foreground">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Our Journey */}
        <section className="container mx-auto px-6 mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-serif font-bold text-foreground mb-6">
                From Humble Beginnings to <span className="text-gold">Excellence</span>
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  Founded in Freetown, Haamkay Enterprises emerged from a passion for 
                  bringing quality products to our community. Our founder recognized a 
                  gap in the market for authentic, premium goods.
                </p>
                <p>
                  Today, we operate from our flagship store at 53 Malamah Thomas Street, 
                  serving thousands of satisfied customers across Sierra Leone. Our 
                  commitment to quality and authenticity remains unchanged.
                </p>
                <p>
                  We believe everyone deserves access to genuine, high-quality products. 
                  That's why we work directly with trusted suppliers to ensure every 
                  item we sell meets the highest standards.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600"
                  alt="Our Store"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gold rounded-2xl flex items-center justify-center">
                <Award className="w-12 h-12 text-teal-darker" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* Our Values */}
        <section className="container mx-auto px-6 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
              Our <span className="text-gold">Values</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card-luxury text-center"
              >
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-serif font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {value.description}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Team */}
        <section className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="card-luxury text-center py-16"
          >
            <Users className="w-16 h-16 text-gold mx-auto mb-6" />
            <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
              Meet Our Team
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Our dedicated team works tirelessly to bring you the best shopping experience. 
              From sourcing products to customer service, we're here for you every step of the way.
            </p>
            <a href="/contact" className="btn-gold inline-block">
              Get in Touch
            </a>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default OurStory;
