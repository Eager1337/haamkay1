import { useState, useEffect } from 'react';
import { Package, FolderOpen, DollarSign, Eye, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';

const AdminAnalytics = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    featuredProducts: 0,
    totalStock: 0,
    avgPrice: 0,
    lowStock: 0,
    outOfStock: 0,
    categoryBreakdown: [] as { name: string; count: number }[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const [{ data: products }, { data: categories }] = await Promise.all([
      supabase.from('products').select('*'),
      supabase.from('categories').select('name'),
    ]);

    if (products && categories) {
      const categoryBreakdown = categories
        .map(c => ({ name: c.name, count: products.filter(p => p.category === c.name).length }))
        .sort((a, b) => b.count - a.count);

      setStats({
        totalProducts: products.length,
        totalCategories: categories.length,
        featuredProducts: products.filter(p => p.featured).length,
        totalStock: products.reduce((sum, p) => sum + p.stock, 0),
        avgPrice: products.length > 0 ? products.reduce((sum, p) => sum + p.price, 0) / products.length : 0,
        lowStock: products.filter(p => p.stock > 0 && p.stock <= 5).length,
        outOfStock: products.filter(p => p.stock === 0).length,
        categoryBreakdown,
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <AdminLayout title="Analytics" subtitle="Store performance insights">
        <div className="card-luxury p-10 text-center text-muted-foreground">Loading analytics…</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics" subtitle="Store performance insights">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card-luxury p-5">
          <div className="flex items-center justify-between mb-3">
            <Package className="w-7 h-7 text-gold" />
            <span className="flex items-center gap-1 text-green-500 text-xs">
              <TrendingUp className="w-3 h-3" /> +12%
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground">{stats.totalProducts}</div>
          <div className="text-muted-foreground text-sm">Total Products</div>
        </div>
        <div className="card-luxury p-5">
          <div className="flex items-center justify-between mb-3">
            <FolderOpen className="w-7 h-7 text-gold" />
            <span className="flex items-center gap-1 text-green-500 text-xs">
              <TrendingUp className="w-3 h-3" /> +5%
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground">{stats.totalCategories}</div>
          <div className="text-muted-foreground text-sm">Categories</div>
        </div>
        <div className="card-luxury p-5">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-7 h-7 text-gold" />
          </div>
          <div className="text-3xl font-bold text-foreground">Le {Math.round(stats.avgPrice).toLocaleString()}</div>
          <div className="text-muted-foreground text-sm">Avg. Price</div>
        </div>
        <div className="card-luxury p-5">
          <div className="flex items-center justify-between mb-3">
            <Eye className="w-7 h-7 text-gold" />
            <span className="flex items-center gap-1 text-red-500 text-xs">
              <TrendingDown className="w-3 h-3" /> -3%
            </span>
          </div>
          <div className="text-3xl font-bold text-foreground">{stats.totalStock}</div>
          <div className="text-muted-foreground text-sm">Total Stock</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="card-luxury p-6">
          <h2 className="text-lg font-serif font-bold text-foreground mb-6">Products by Category</h2>
          <div className="space-y-4">
            {stats.categoryBreakdown.map(cat => (
              <div key={cat.name}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-foreground">{cat.name}</span>
                  <span className="text-muted-foreground">{cat.count} products</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all"
                    style={{ width: `${stats.totalProducts > 0 ? (cat.count / stats.totalProducts) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
            {stats.categoryBreakdown.length === 0 && (
              <p className="text-muted-foreground text-sm text-center py-4">No categories yet.</p>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card-luxury p-6">
          <h2 className="text-lg font-serif font-bold text-foreground mb-6">Quick Stats</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-foreground text-sm">Featured Products</span>
              <span className="text-gold font-bold">{stats.featuredProducts}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-foreground text-sm">Low Stock Items (≤5)</span>
              <span className="text-yellow-500 font-bold">{stats.lowStock}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-foreground text-sm">Out of Stock</span>
              <span className="text-destructive font-bold">{stats.outOfStock}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <span className="text-foreground text-sm">Avg. Products / Category</span>
              <span className="text-gold font-bold">
                {stats.totalCategories > 0 ? Math.round(stats.totalProducts / stats.totalCategories) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
