import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Upload, Check, Trash2, Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { validateMediaFile } from '@/lib/fileValidation';
import { invokeAIProductDraft } from '@/lib/ai-api';

interface Draft {
  image: string;
  path: string;
  name: string;
  category: string;
  price: number;
  description: string;
  stock: number;
  status: 'pending' | 'analyzing' | 'ready' | 'published' | 'error';
  error?: string;
}

const AdminAIListing = () => {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('name').then(({ data }) => {
      if (data) setCategories(data.map(c => c.name));
    });
  }, []);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const added: Draft[] = [];

    for (const file of Array.from(files)) {
      const validation = validateMediaFile(file, 'images');
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }
      const ext = file.name.split('.').pop()?.toLowerCase();
      const path = `images/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('product-media').upload(path, file, { contentType: file.type });
      if (error) {
        toast.error(`Upload failed for ${file.name}`);
        continue;
      }
      const { data } = supabase.storage.from('product-media').getPublicUrl(path);
      await supabase.from('media_assets').insert({
        url: data.publicUrl, path, file_name: file.name, media_type: 'image', size_bytes: file.size,
      });
      added.push({
        image: data.publicUrl, path, name: '', category: '', price: 0, description: '',
        stock: 1, status: 'pending',
      });
    }

    setDrafts(prev => [...prev, ...added]);
    setUploading(false);
    if (added.length) toast.success(`${added.length} photo(s) uploaded. Run the AI to build listings.`);
  };

  const runAI = async () => {
    const pending = drafts.filter(d => d.status === 'pending' || d.status === 'error');
    if (!pending.length) {
      toast.info('Nothing to analyze — upload some photos first.');
      return;
    }
    setAnalyzing(true);
    setDrafts(prev => prev.map(d => (d.status === 'pending' || d.status === 'error' ? { ...d, status: 'analyzing' } : d)));

    let data, error;
    try {
      data = await invokeAIProductDraft({ images: pending.map(d => d.image), categories });
    } catch (e) {
      error = e as Error;
    }

    setAnalyzing(false);

    if (error) {
      toast.error('AI analysis failed. Please try again.');
      setDrafts(prev => prev.map(d => (d.status === 'analyzing' ? { ...d, status: 'error', error: 'AI failed' } : d)));
      return;
    }

    const results = (data?.results ?? []) as Array<{ image: string; draft?: Draft; error?: string }>;
    setDrafts(prev => prev.map(d => {
      const match = results.find(r => r.image === d.image);
      if (!match) return d.status === 'analyzing' ? { ...d, status: 'pending' } : d;
      if (!match.draft) return { ...d, status: 'error', error: match.error ?? 'No result' };
      return { ...d, ...match.draft, status: 'ready' };
    }));
    toast.success('AI listings ready — review and send to the approval queue.');
  };

  const update = (index: number, patch: Partial<Draft>) =>
    setDrafts(prev => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));

  const remove = (index: number) => setDrafts(prev => prev.filter((_, i) => i !== index));

  const publish = async (index: number) => {
    const d = drafts[index];
    if (!d.name || !d.category || d.price <= 0) {
      toast.error('Name, category and a price above zero are required.');
      return;
    }

    const { error } = await supabase.from('ai_drafts').insert({
      name: d.name,
      category: d.category,
      price: d.price,
      description: d.description,
      stock: d.stock,
      images: [d.image],
      status: 'pending',
    });

    if (error) {
      toast.error(`Could not send to queue: ${error.message}`);
      return;
    }

    update(index, { status: 'published' });
    toast.success('Sent to the AI approval queue for review.');
  };

  const publishAll = async () => {
    for (let i = 0; i < drafts.length; i++) {
      if (drafts[i].status === 'ready') await publish(i);
    }
  };

  return (
    <AdminLayout
      title="AI Listing Studio"
      subtitle="Upload photos — AI drafts the listing, then approve it in the AI queue"
      actions={
        <>
          <button onClick={runAI} disabled={analyzing} className="btn-gold flex items-center gap-2 !py-2 !px-4 text-sm">
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {analyzing ? 'Analyzing…' : 'Run AI'}
          </button>
          <button onClick={publishAll} className="px-4 py-2 rounded-lg border border-gold text-gold text-sm hover:bg-gold/10">
            Send all to queue
          </button>
        </>
      }
    >
      <label className="block card-luxury p-6 sm:p-10 text-center border-2 border-dashed border-gold/40 cursor-pointer hover:border-gold transition-colors mb-6">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => handleUpload(e.target.files)}
        />
        <Upload className="w-8 h-8 text-gold mx-auto mb-3" />
        <p className="text-foreground font-medium">{uploading ? 'Uploading…' : 'Tap to upload product photos'}</p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP or GIF · up to 10MB each</p>
      </label>

      {drafts.length === 0 ? (
        <div className="card-luxury p-10 text-center">
          <Sparkles className="w-10 h-10 text-gold mx-auto mb-3" />
          <p className="text-muted-foreground">Your AI drafts will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {drafts.map((d, i) => (
            <motion.div key={d.image} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card-luxury p-4 space-y-3">
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                <img src={d.image} alt={d.name || 'Product photo'} className="w-full h-full object-cover" />
                {d.status === 'analyzing' && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-gold animate-spin" />
                  </div>
                )}
                {d.status === 'published' && (
                  <div className="absolute top-2 right-2 px-2 py-1 rounded-full bg-gold text-teal-darker text-xs font-semibold">In queue</div>
                )}
              </div>

              <input
                value={d.name}
                onChange={e => update(i, { name: e.target.value })}
                placeholder="Product name"
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={d.category}
                  onChange={e => update(i, { category: e.target.value })}
                  placeholder="Category"
                  list="admin-categories"
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
                <input
                  type="number"
                  value={d.price}
                  onChange={e => update(i, { price: Number(e.target.value) })}
                  placeholder="Price (Le)"
                  className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
              </div>
              <textarea
                value={d.description}
                onChange={e => update(i, { description: e.target.value })}
                placeholder="Description"
                rows={3}
                className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={d.stock}
                  onChange={e => update(i, { stock: Number(e.target.value) })}
                  className="w-20 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground"
                />
                <button
                  onClick={() => publish(i)}
                  disabled={d.status === 'published'}
                  className="flex-1 btn-gold !py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Send to queue
                </button>
                <button onClick={() => remove(i)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              {d.error && <p className="text-xs text-destructive">{d.error}</p>}
            </motion.div>
          ))}
        </div>
      )}

      <datalist id="admin-categories">
        {categories.map(c => <option key={c} value={c} />)}
      </datalist>
    </AdminLayout>
  );
};

export default AdminAIListing;
