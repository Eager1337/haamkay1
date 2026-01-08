import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Star, Sparkles, Upload, LogOut, Package, Image, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  description: string;
  stock: number;
  images: string[];
  videos: string[];
  featured: boolean;
  is_highlight: boolean;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dailyUploads, setDailyUploads] = useState(0);

  const [form, setForm] = useState({
    name: '', category: '', price: 0, description: '', stock: 0,
    images: [] as string[], videos: [] as string[], featured: false, is_highlight: false
  });

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') !== 'true') {
      navigate('/admin');
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    const [{ data: prods }, { data: cats }, { data: uploads }] = await Promise.all([
      supabase.from('products').select('*').order('created_at', { ascending: false }),
      supabase.from('categories').select('name'),
      supabase.from('daily_uploads').select('count').eq('upload_date', new Date().toISOString().split('T')[0]).maybeSingle()
    ]);
    if (prods) setProducts(prods);
    if (cats) setCategories(cats.map(c => c.name));
    if (uploads) setDailyUploads(uploads.count);
    setLoading(false);
  };

  const handleFileUpload = useCallback(async (files: FileList, type: 'images' | 'videos') => {
    setUploading(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${type}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('product-media').upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from('product-media').getPublicUrl(path);
        urls.push(data.publicUrl);
      }
    }
    setForm(f => ({ ...f, [type]: [...f[type], ...urls] }));
    
    // Update daily uploads
    await supabase.from('daily_uploads').upsert({ 
      upload_date: new Date().toISOString().split('T')[0], 
      count: dailyUploads + urls.length 
    }, { onConflict: 'upload_date' });
    setDailyUploads(d => d + urls.length);
    setUploading(false);
    toast.success(`${urls.length} ${type} uploaded!`);
  }, [dailyUploads]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const productData = { ...form, price: Number(form.price), stock: Number(form.stock) };
    
    if (editingProduct) {
      await supabase.from('products').update(productData).eq('id', editingProduct.id);
      toast.success('Product updated!');
    } else {
      await supabase.from('products').insert(productData);
      toast.success('Product added!');
    }
    resetForm();
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    toast.success('Product deleted!');
    fetchData();
  };

  const toggleHighlight = async (id: string, current: boolean) => {
    if (!current) await supabase.from('products').update({ is_highlight: false }).neq('id', id);
    await supabase.from('products').update({ is_highlight: !current }).eq('id', id);
    fetchData();
  };

  const resetForm = () => {
    setForm({ name: '', category: '', price: 0, description: '', stock: 0, images: [], videos: [], featured: false, is_highlight: false });
    setEditingProduct(null);
    setShowForm(false);
  };

  const startEdit = (p: Product) => {
    setForm({ name: p.name, category: p.category, price: p.price, description: p.description || '', stock: p.stock, images: p.images || [], videos: p.videos || [], featured: p.featured, is_highlight: p.is_highlight });
    setEditingProduct(p);
    setShowForm(true);
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="text-gold">Loading...</div></div>;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Today's uploads: {dailyUploads}</p>
          </div>
          <div className="flex gap-4">
            <button onClick={() => { setShowForm(true); setEditingProduct(null); }} className="btn-gold flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add Product
            </button>
            <button onClick={() => { sessionStorage.removeItem('adminAuth'); navigate('/'); }} className="btn-outline-gold flex items-center gap-2">
              <LogOut className="w-5 h-5" /> Logout
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card-luxury p-4"><Package className="w-6 h-6 text-gold mb-2" /><div className="text-2xl font-bold text-foreground">{products.length}</div><div className="text-muted-foreground text-sm">Products</div></div>
          <div className="card-luxury p-4"><Star className="w-6 h-6 text-gold mb-2" /><div className="text-2xl font-bold text-foreground">{products.filter(p => p.featured).length}</div><div className="text-muted-foreground text-sm">Featured</div></div>
          <div className="card-luxury p-4"><Upload className="w-6 h-6 text-gold mb-2" /><div className="text-2xl font-bold text-foreground">{dailyUploads}</div><div className="text-muted-foreground text-sm">Uploads Today</div></div>
        </div>

        {/* Product Form Modal */}
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-auto">
            <div className="card-luxury p-6 w-full max-w-2xl max-h-[90vh] overflow-auto">
              <h2 className="text-xl font-serif font-bold text-foreground mb-4">{editingProduct ? 'Edit Product' : 'Add Product'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input placeholder="Product Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-muted border border-border rounded-lg px-4 py-3 text-foreground" required />
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="bg-muted border border-border rounded-lg px-4 py-3 text-foreground" required>
                    <option value="">Select Category</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" placeholder="Price" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="bg-muted border border-border rounded-lg px-4 py-3 text-foreground" required />
                  <input type="number" placeholder="Stock" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} className="bg-muted border border-border rounded-lg px-4 py-3 text-foreground" required />
                </div>
                <textarea placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full bg-muted border border-border rounded-lg px-4 py-3 text-foreground h-24" />
                
                {/* Bulk Upload */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-foreground mb-2"><Image className="w-4 h-4 inline mr-1" />Images (bulk)</label>
                    <input type="file" multiple accept="image/*" onChange={e => e.target.files && handleFileUpload(e.target.files, 'images')} className="w-full text-sm text-muted-foreground file:btn-gold file:mr-2" disabled={uploading} />
                    <div className="flex flex-wrap gap-2 mt-2">{form.images.map((img, i) => <img key={i} src={img} className="w-12 h-12 object-cover rounded" />)}</div>
                  </div>
                  <div>
                    <label className="block text-sm text-foreground mb-2"><Video className="w-4 h-4 inline mr-1" />Videos (bulk)</label>
                    <input type="file" multiple accept="video/*" onChange={e => e.target.files && handleFileUpload(e.target.files, 'videos')} className="w-full text-sm text-muted-foreground file:btn-gold file:mr-2" disabled={uploading} />
                    <div className="text-xs text-muted-foreground mt-1">{form.videos.length} videos uploaded</div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-foreground"><input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))} className="accent-gold" /> Featured</label>
                  <label className="flex items-center gap-2 text-foreground"><input type="checkbox" checked={form.is_highlight} onChange={e => setForm(f => ({ ...f, is_highlight: e.target.checked }))} className="accent-gold" /> Today's Highlight</label>
                </div>

                <div className="flex gap-4">
                  <button type="submit" className="btn-gold flex-1" disabled={uploading}>{uploading ? 'Uploading...' : editingProduct ? 'Update' : 'Add'}</button>
                  <button type="button" onClick={resetForm} className="btn-outline-gold">Cancel</button>
                </div>
              </form>
            </div>
          </motion.div>
        )}

        {/* Products Table */}
        <div className="card-luxury overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr><th className="p-4 text-left text-foreground">Product</th><th className="p-4 text-left text-foreground">Category</th><th className="p-4 text-left text-foreground">Price</th><th className="p-4 text-left text-foreground">Stock</th><th className="p-4 text-left text-foreground">Status</th><th className="p-4 text-right text-foreground">Actions</th></tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-4 flex items-center gap-3"><img src={p.images?.[0] || '/placeholder.svg'} className="w-12 h-12 rounded object-cover" /><span className="text-foreground">{p.name}</span></td>
                  <td className="p-4 text-muted-foreground">{p.category}</td>
                  <td className="p-4 text-gold font-semibold">Le {p.price.toLocaleString()}</td>
                  <td className="p-4 text-muted-foreground">{p.stock}</td>
                  <td className="p-4"><div className="flex gap-2">{p.featured && <span className="px-2 py-1 bg-gold/20 text-gold text-xs rounded">Featured</span>}{p.is_highlight && <span className="px-2 py-1 bg-destructive/20 text-destructive text-xs rounded">Highlight</span>}</div></td>
                  <td className="p-4 text-right">
                    <button onClick={() => toggleHighlight(p.id, p.is_highlight)} className="p-2 text-muted-foreground hover:text-gold"><Sparkles className="w-4 h-4" /></button>
                    <button onClick={() => startEdit(p)} className="p-2 text-muted-foreground hover:text-gold"><Edit className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
