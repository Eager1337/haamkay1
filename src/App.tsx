import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import { CartProvider } from "./contexts/CartContext";
import { AdminAuthProvider } from "./contexts/AdminAuthContext";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
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
import ProductDetail from "./pages/ProductDetail";
import Categories from "./pages/Categories";
import DailyDrops from "./pages/DailyDrops";
import Trending from "./pages/Trending";
import OurStory from "./pages/OurStory";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { isOnboarded, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-lg bg-gold flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-teal-darker font-serif font-bold text-2xl">H</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding for new users (except admin routes, login, and signup)
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  const isAuthRoute = window.location.pathname === '/login' || window.location.pathname === '/signup';
  
  if (!isOnboarded && !isAdminRoute && !isAuthRoute) {
    return <Onboarding />;
  }

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Onboarding />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/product/:id" element={<ProductDetail />} />
      <Route path="/categories" element={<Categories />} />
      <Route path="/daily-drops" element={<DailyDrops />} />
      <Route path="/trending" element={<Trending />} />
      <Route path="/our-story" element={<OurStory />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/cart" element={<Cart />} />
      
      {/* Admin Pages */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/products" element={<AdminProducts />} />
      <Route path="/admin/categories" element={<AdminCategories />} />
      <Route path="/admin/bulk-upload" element={<AdminBulkUpload />} />
      <Route path="/admin/orders" element={<AdminOrders />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
      <Route path="/admin/customers" element={<AdminCustomers />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AdminAuthProvider>
          <UserProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </UserProvider>
        </AdminAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
