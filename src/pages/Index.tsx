import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import HighlightSection from '@/components/home/HighlightSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import NewsletterSection from '@/components/home/NewsletterSection';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <FeaturedProducts />
        <HighlightSection />
        <CategoriesSection />
        <NewsletterSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
