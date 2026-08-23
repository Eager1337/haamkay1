import { useRef, useState } from 'react';
import { Upload, Download, Loader2, ImageIcon, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';

const TARGET_WIDTH = 7680; // 8K

const AdminImageUpscaler = () => {
  const [sourceUrl, setSourceUrl] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [originalDims, setOriginalDims] = useState<{ w: number; h: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Please upload an image file');
    setSourceUrl(URL.createObjectURL(file));
    setResultUrl('');

    const img = new Image();
    img.onload = () => setOriginalDims({ w: img.naturalWidth, h: img.naturalHeight });
    img.src = URL.createObjectURL(file);
  };

  const upscale = async () => {
    if (!sourceUrl) return toast.error('Upload an image first');
    setBusy(true);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = sourceUrl;
      });

      const scale = Math.min(TARGET_WIDTH / img.naturalWidth, TARGET_WIDTH / img.naturalHeight);
      const w = Math.round(img.naturalWidth * scale);
      const h = Math.round(img.naturalHeight * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, 'image/png', 1));
      if (!blob) throw new Error('Failed to generate image');
      setResultUrl(URL.createObjectURL(blob));
      toast.success(`Upscaled to ${w}×${h}px`);
    } catch (e) {
      toast.error((e as Error).message || 'Upscale failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout title="Image Upscaler" subtitle="Free 8K upscaling — no API key, runs in your browser">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Source */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Source Image</label>
              {originalDims && (
                <span className="text-xs text-muted-foreground">
                  {originalDims.w}×{originalDims.h}px
                </span>
              )}
            </div>

            <label className="flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border border-dashed border-gold/40 text-gold cursor-pointer hover:bg-gold/10 transition-colors">
              <Upload className="w-6 h-6" />
              <span className="text-sm">Click to upload</span>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFile(e.target.files?.[0])}
              />
            </label>

            {sourceUrl && (
              <div className="relative rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
                <img src={sourceUrl} alt="Source" className="max-w-full max-h-full object-contain" />
              </div>
            )}
          </div>

          <button
            onClick={upscale}
            disabled={!sourceUrl || busy}
            className="btn-gold w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {busy ? 'Upscaling…' : 'Upscale to 8K'}
          </button>
        </div>

        {/* Result */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-border bg-card space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Upscaled Result</label>
              {resultUrl && <span className="text-xs text-gold font-medium">8K Ready</span>}
            </div>

            {resultUrl ? (
              <div className="relative rounded-lg overflow-hidden bg-muted aspect-video flex items-center justify-center">
                <img src={resultUrl} alt="Upscaled" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ImageIcon className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">Your upscaled image will appear here</p>
              </div>
            )}
          </div>

          {resultUrl && (
            <a
              href={resultUrl}
              download="haamkay-upscaled-8k.png"
              className="btn-outline-gold w-full flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download 8K Image
            </a>
          )}
        </div>
      </div>

      <div className="mt-6 p-4 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">How it works</p>
        <p>• Upscaling runs entirely in your browser using high-quality canvas interpolation — no server, no cost.</p>
        <p>• Images are scaled up to 8K (7680px) resolution with premium smoothing.</p>
        <p>• Nothing is uploaded — your images stay private on your device.</p>
      </div>
    </AdminLayout>
  );
};

export default AdminImageUpscaler;
