import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, FolderOpen, ShoppingCart, BarChart3, Settings, Users,
  Package, LogOut, Plus, Edit, Trash2, Layers
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

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

const AdminCategories = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') !== 'true') {
      navigate('/admin');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from('categories').select('*').order('name'),
      supabase.from('products').select('category')
    ]);
    if (cats) setCategories(cats);
    if (prods) {
      const counts: Record<string, number> = {};
      prods.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
      setProductCounts(counts);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      await supabase.from('categories').update(form).eq('id', editingCategory.id);
      toast.success('Category updated!');
    } else {
      await supabase.from('categories').insert(form);
      toast.success('Category added!');
    }
    setForm({ name: '', description: '' });
    setEditingCategory(null);
    setShowForm(false);
    fetchData();
  };

  const handleDelete = async (id: string, name: string) => {
    if (productCounts[name] > 0) {
      toast.error(`Cannot delete: ${productCounts[name]} products use this category`);
      return;
    }
    if (!confirm('Delete this category?')) return;
    await supabase.from('categories').delete().eq('id', id);
    toast.success('Category deleted!');
    fetchData();
  };

  const startEdit = (cat: Category) => {
    setForm({ name: cat.name, description: cat.description || '' });
    setEditingCategory(cat);
    setShowForm(true);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-gold">Loading...</div></div>;

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground">Manage product categories</p>
          </div>
          <button onClick={() => { setShowForm(true); setEditingCategory(null); setForm({ name: '', description: '' }); }} className="btn-gold flex items-center gap-2 !py-2 !px-4">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="card-luxury p-6 w-full max-w-md">
              <h2 className="text-xl font-serif font-bold text-foreground mb-4">{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  placeholder="Category Name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground"
                  required
                />
                <textarea
                  placeholder="Description (optional)"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground h-24"
                />
                <div className="flex gap-4">
                  <button type="submit" className="btn-gold flex-1">{editingCategory ? 'Update' : 'Add'}</button>
                  <button type="button" onClick={() => { setShowForm(false); setEditingCategory(null); }} className="btn-outline-gold">Cancel</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Categories Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map(cat => (
            <div key={cat.id} className="card-luxury">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-gold" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(cat)} className="p-2 text-muted-foreground hover:text-gold">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(cat.id, cat.name)} className="p-2 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-serif font-semibold text-foreground mb-2">{cat.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{cat.description || 'No description'}</p>
              <div className="text-sm text-gold">{productCounts[cat.name] || 0} products</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AdminCategories;
