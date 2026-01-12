import { useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, FolderOpen, ShoppingCart, BarChart3, Settings, Users,
  Package, LogOut, Layers
} from 'lucide-react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Products', path: '/admin/products', icon: Package },
  { name: 'Categories', path: '/admin/categories', icon: FolderOpen },
  { name: 'Bulk Upload', path: '/admin/bulk-upload', icon: Layers },
  { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { name: 'Customers', path: '/admin/customers', icon: Users },
  { name: 'Settings', path: '/admin/settings', icon: Settings },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const AdminLayout = ({ children, title, subtitle, actions }: AdminLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isLoading, signOut } = useAdminAuth();

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/admin');
    }
  }, [isAdmin, isLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-gold">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border p-6 flex flex-col">
        <div className="mb-8">
          <h1 className="text-xl font-serif font-bold text-gold">Haamkay Admin</h1>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-gold/20 text-gold'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">{title}</h1>
            {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-3">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
