import { useEffect, useState } from 'react';
import { Sparkles, Wand2, Upload, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { validateMediaFile } from '@/lib/fileValidation';

interface Product {
  id: string;
  name: string;
  images: string[] | null;
}

const AdminImageStudio = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const [attachTo, setAttachTo] = useState<string>('');

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name, images')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data }) => setProducts((data as Product[]) ?? []));
  }, []);

  const uploadLocal = async (file: File | undefined) => {
    if (!file) return;
    const check = validateMediaFile(file, 'images');
    if (!check.valid) return toast.error(check.error);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const path = `images/studio-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('product-media').upload(path, file, { contentType: file.type });
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from('product-media').getPublicUrl(path);
    setSourceUrl(data.publicUrl);
    setResultUrl('');
  };

  const run = async (mode: 'enhance' | 'edit') => {
    if (!sourceUrl) return toast.error('Pick or upload an image first');
    if (mode === 'edit' && !prompt.trim()) return toast.error('Describe the edit you want');
    setBusy(true);
    const { data, error } = await supabase.functions.invoke('ai-image-studio', {
      body: { imageUrl: sourceUrl, mode, prompt },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    if ((data as { error?: string })?.error) return toast.error((data as { error: string }).error);
    setResultUrl((data as { url: string }).url);
    toast.success(mode === 'enhance' ? 'Enhanced to studio quality' : 'Edit applied');
  };

  const attach = async () => {
    if (!resultUrl || !attachTo) return toast.error('Pick a product to attach to');
    const product = products.find(p => p.id === attachTo);
    const images = [...(product?.images ?? []), resultUrl];
    const { error } = await supabase.from('products').update({ images }).eq('id', attachTo);
    if (error) return toast.error(error.message);
    toast.success('Image added to product');
  };

  return (
    <AdminLayout title="AI Image Studio" subtitle="One-click 8K upscale, or chat to edit backgrounds and details">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <label className="text-sm text-muted-foreground">Upload an image</label>
            <label className="flex items-center justify-center gap-2 px-4 py-6 rounded-xl border border-dashed border-gold/40 text-gold cursor-pointer hover:bg-gold/10">
              <Upload className="w-4 h-4" /> Choose photo
              <input type="file" accept="image/*" className="hidden" onChange={e => uploadLocal(e.target.files?.[0])} />
            </label>

            <label className="text-sm text-muted-foreground">…or pick an existing product image</label>
            <select
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
              onChange={e => { setSourceUrl(e.target.value); setResultUrl(''); }}
              value={sourceUrl}
            >
              <option value="">Select image</option>
              {products.flatMap(p => (p.images ?? []).map((img, i) => (
                <option key={`${p.id}-${i}`} value={img}>{p.name} — image {i + 1}</option>
              )))}
            </select>
          </div>

          {sourceUrl && (
            <img src={sourceUrl} alt="Selected product" className="w-full rounded-xl border border-border object-contain max-h-80 bg-muted" />
          )}

          <button
            onClick={() => run('enhance')}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gold text-teal-darker font-semibold disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Enhance to 8K quality
          </button>

          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <label className="text-sm text-muted-foreground">Chat edit — tell the AI what to change</label>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              rows={3}
              placeholder="Remove the background and place it on a clean white studio backdrop, boost sharpness"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
            />
            <button
              onClick={() => run('edit')}
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gold/50 text-gold font-medium disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              Apply edit
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card min-h-64 flex items-center justify-center">
            {resultUrl
              ? <img src={resultUrl} alt="AI enhanced result" className="w-full rounded-lg object-contain max-h-[28rem]" />
              : <p className="text-sm text-muted-foreground">The AI result appears here.</p>}
          </div>

          {resultUrl && (
            <div className="p-4 rounded-xl border border-border bg-card space-y-3">
              <select
                value={attachTo}
                onChange={e => setAttachTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
              >
                <option value="">Attach to product…</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button onClick={attach} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gold text-teal-darker font-semibold">
                <Check className="w-4 h-4" /> Save to product
              </button>
              <a href={resultUrl} target="_blank" rel="noreferrer" className="block text-center text-xs text-muted-foreground underline">Open full size</a>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminImageStudio;
