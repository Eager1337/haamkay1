import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext";
import { CartProvider } from "./contexts/CartContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Cart from "./pages/Cart";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCategories from "./pages/AdminCategories";
import AdminBulkUpload from "./pages/AdminBulkUpload";
import AdminOrders from "./pages/AdminOrders";
import AdminAnalytics from "./pages/AdminAnalytics";
import AdminCustomers from "./pages/AdminCustomers";
import AdminSettings from "./pages/AdminSettings";
import AdminProducts from "./pages/AdminProducts";
import AdminAIListing from "./pages/AdminAIListing";
import AdminInventory from "./pages/AdminInventory";
import AdminNotifications from "./pages/AdminNotifications";
import AdminMedia from "./pages/AdminMedia";
import AdminSchedule from "./pages/AdminSchedule";
import AdminAIQueue from "./pages/AdminAIQueue";
import AdminCsvImport from "./pages/AdminCsvImport";
import AdminPriceHistory from "./pages/AdminPriceHistory";
import AdminTikTok from "./pages/AdminTikTok";
import AdminSiteContent from "./pages/AdminSiteContent";
import AdminImageUpscaler from "./pages/AdminImageUpscaler";
import AdminDuplicateProducts from "./pages/AdminDuplicateProducts";
import AdminImageStudio from "./pages/AdminImageStudio";
import AdminScheduledAlerts from "./pages/AdminScheduledAlerts";
import AdminTeam from "./pages/AdminTeam";
import NotificationToaster from "./components/NotificationToaster";
import AnalyticsProvider from "./components/AnalyticsProvider";
import ScrollToTop from "./components/ScrollToTop";

import ProductDetail from "./pages/ProductDetail";
import Categories from "./pages/Categories";
import DailyDrops from "./pages/DailyDrops";
import Trending from "./pages/Trending";
import OurStory from "./pages/OurStory";
import Contact from "./pages/Contact";
import Wishlist from "./pages/Wishlist";
import MyOrders from "./pages/MyOrders";
import CategoryLanding from "./components/seo/CategoryLanding";
import { landingConfigs } from "./pages/landing/landingConfigs";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AdminAuthProvider>
          <UserProvider>
            <CartProvider>
              <ScrollToTop />
              <NotificationToaster />
              <AnalyticsProvider />
              <Routes>
                {/* Public Pages */}
                <Route path="/" element={<Index />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/daily-drops" element={<DailyDrops />} />
                <Route path="/trending" element={<Trending />} />
                <Route path="/our-story" element={<OurStory />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/my-orders" element={<MyOrders />} />

                {/* SEO landing pages */}
                {landingConfigs.map(config => (
                  <Route
                    key={config.slug}
                    path={`/${config.slug}`}
                    element={<CategoryLanding config={config} />}
                  />
                ))}

                {/* Admin Pages */}
                <Route path="/admin" element={<AdminLogin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<AdminProducts />} />
                <Route path="/admin/ai-listing" element={<AdminAIListing />} />
                <Route path="/admin/inventory" element={<AdminInventory />} />
                <Route path="/admin/notifications" element={<AdminNotifications />} />
                <Route path="/admin/media" element={<AdminMedia />} />
                <Route path="/admin/schedule" element={<AdminSchedule />} />
                <Route path="/admin/ai-queue" element={<AdminAIQueue />} />
                <Route path="/admin/csv-import" element={<AdminCsvImport />} />
                <Route path="/admin/price-history" element={<AdminPriceHistory />} />
                <Route path="/admin/tiktok" element={<AdminTikTok />} />
                <Route path="/admin/site-content" element={<AdminSiteContent />} />
                <Route path="/admin/image-upscaler" element={<AdminImageUpscaler />} />
                <Route path="/admin/image-studio" element={<AdminImageStudio />} />
                <Route path="/admin/scheduled-alerts" element={<AdminScheduledAlerts />} />
                <Route path="/admin/team" element={<AdminTeam />} />
                <Route path="/admin/duplicate-products" element={<AdminDuplicateProducts />} />

                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/bulk-upload" element={<AdminBulkUpload />} />
                <Route path="/admin/orders" element={<AdminOrders />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/customers" element={<AdminCustomers />} />
                <Route path="/admin/settings" element={<AdminSettings />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </CartProvider>
          </UserProvider>
        </AdminAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
