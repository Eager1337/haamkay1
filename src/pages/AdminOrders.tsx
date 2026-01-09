import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, FolderOpen, ShoppingCart, BarChart3, Settings, Users,
  Package, LogOut, Eye, Clock, CheckCircle, XCircle, Truck, Layers
} from 'lucide-react';

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

// Mock orders data
const mockOrders = [
  { id: 'ORD-001', customer: 'John Doe', email: 'john@example.com', total: 250000, status: 'pending', date: '2024-01-08' },
  { id: 'ORD-002', customer: 'Jane Smith', email: 'jane@example.com', total: 180000, status: 'processing', date: '2024-01-07' },
  { id: 'ORD-003', customer: 'Mike Johnson', email: 'mike@example.com', total: 320000, status: 'shipped', date: '2024-01-06' },
  { id: 'ORD-004', customer: 'Sarah Williams', email: 'sarah@example.com', total: 150000, status: 'delivered', date: '2024-01-05' },
  { id: 'ORD-005', customer: 'Tom Brown', email: 'tom@example.com', total: 95000, status: 'cancelled', date: '2024-01-04' },
];

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
  processing: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/20' },
  shipped: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-500/20' },
  delivered: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/20' },
  cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/20' },
};

const AdminOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders] = useState(mockOrders);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') !== 'true') {
      navigate('/admin');
      return;
    }
  }, [navigate]);

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

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
          onClick={() => { sessionStorage.removeItem('adminAuth'); navigate('/'); }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">Manage customer orders</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="card-luxury p-4">
            <ShoppingCart className="w-6 h-6 text-gold mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.total}</div>
            <div className="text-muted-foreground text-sm">Total Orders</div>
          </div>
          <div className="card-luxury p-4">
            <Clock className="w-6 h-6 text-yellow-500 mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.pending}</div>
            <div className="text-muted-foreground text-sm">Pending</div>
          </div>
          <div className="card-luxury p-4">
            <Package className="w-6 h-6 text-blue-500 mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.processing}</div>
            <div className="text-muted-foreground text-sm">Processing</div>
          </div>
          <div className="card-luxury p-4">
            <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
            <div className="text-2xl font-bold text-foreground">{stats.delivered}</div>
            <div className="text-muted-foreground text-sm">Delivered</div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                filterStatus === status
                  ? 'bg-gold text-teal-darker'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="card-luxury overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 text-left text-foreground">Order ID</th>
                <th className="p-4 text-left text-foreground">Customer</th>
                <th className="p-4 text-left text-foreground">Total</th>
                <th className="p-4 text-left text-foreground">Status</th>
                <th className="p-4 text-left text-foreground">Date</th>
                <th className="p-4 text-right text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const StatusIcon = statusConfig[order.status as keyof typeof statusConfig].icon;
                return (
                  <tr key={order.id} className="border-t border-border">
                    <td className="p-4 text-gold font-medium">{order.id}</td>
                    <td className="p-4">
                      <div className="text-foreground">{order.customer}</div>
                      <div className="text-sm text-muted-foreground">{order.email}</div>
                    </td>
                    <td className="p-4 text-foreground font-semibold">Le {order.total.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${statusConfig[order.status as keyof typeof statusConfig].bg} ${statusConfig[order.status as keyof typeof statusConfig].color}`}>
                        <StatusIcon className="w-4 h-4" />
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{order.date}</td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-muted-foreground hover:text-gold">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-center text-muted-foreground text-sm">
          <p>This is demo data. Connect to a real order management system for live orders.</p>
        </div>
      </main>
    </div>
  );
};

export default AdminOrders;
