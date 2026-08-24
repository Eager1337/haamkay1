import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Clock, Package, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

const mockOrders = [
  { id: 'ORD-001', customer: 'John Doe', email: 'john@example.com', total: 250000, status: 'pending', date: '2024-01-08' },
  { id: 'ORD-002', customer: 'Jane Smith', email: 'jane@example.com', total: 180000, status: 'processing', date: '2024-01-07' },
  { id: 'ORD-003', customer: 'Mike Johnson', email: 'mike@example.com', total: 320000, status: 'shipped', date: '2024-01-06' },
  { id: 'ORD-004', customer: 'Sarah Williams', email: 'sarah@example.com', total: 150000, status: 'delivered', date: '2024-01-05' },
  { id: 'ORD-005', customer: 'Tom Brown', email: 'tom@example.com', total: 95000, status: 'cancelled', date: '2024-01-04' },
];

const statusConfig: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-500/20' },
  processing: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/20' },
  shipped: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-500/20' },
  delivered: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/20' },
  cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/20' },
};

const AdminOrders = () => {
  const [orders] = useState(mockOrders);
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredOrders = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <AdminLayout title="Orders" subtitle="Manage customer orders">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors text-sm ${
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
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 text-left text-foreground text-sm">Order ID</th>
                <th className="p-4 text-left text-foreground text-sm">Customer</th>
                <th className="p-4 text-left text-foreground text-sm">Total</th>
                <th className="p-4 text-left text-foreground text-sm">Status</th>
                <th className="p-4 text-left text-foreground text-sm">Date</th>
                <th className="p-4 text-right text-foreground text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map(order => {
                const cfg = statusConfig[order.status];
                return (
                  <tr key={order.id} className="border-t border-border">
                    <td className="p-4 text-gold font-medium text-sm">{order.id}</td>
                    <td className="p-4">
                      <div className="text-foreground text-sm">{order.customer}</div>
                      <div className="text-xs text-muted-foreground">{order.email}</div>
                    </td>
                    <td className="p-4 text-foreground font-semibold text-sm">Le {order.total.toLocaleString()}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${cfg.bg} ${cfg.color}`}>
                        <cfg.icon className="w-3.5 h-3.5" />
                        {order.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm">{order.date}</td>
                    <td className="p-4 text-right">
                      <button className="p-2 text-muted-foreground hover:text-gold rounded-lg hover:bg-muted">
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-center text-muted-foreground text-xs">
        Order tracking connects to a live checkout system once payments are enabled.
      </p>
    </AdminLayout>
  );
};

export default AdminOrders;
