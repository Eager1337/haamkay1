import { jsonResponse, preflight } from '../_shared/cors.ts';
import { requireAdmin, serviceClient } from '../_shared/admin.ts';
import { fetchAsInlineData, geminiGenerateImage, GeminiError } from '../_shared/gemini.ts';

const UPSCALE_PROMPT =
  'Upscale and enhance this image to the highest possible resolution and clarity. Sharpen fine detail, remove noise, blur and compression artifacts, correct lighting. Keep the exact subject, composition, colours and framing unchanged — do not add, remove or reinterpret anything.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();

  try {
    const adminId = await requireAdmin(req);
    if (!adminId) return jsonResponse({ error: 'Admin access required' }, 401);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('ai-image-upscale: GEMINI_API_KEY secret is not set');
      return jsonResponse({ error: 'AI is not configured yet — add a GEMINI_API_KEY secret to this Supabase project.' }, 400);
    }

    const body = await req.json();
    const imageUrl: string = String(body?.imageUrl ?? '');
    if (!/^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith('data:image/')) {
      return jsonResponse({ error: 'A valid image is required' }, 400);
    }

    let result;
    try {
      const source = await fetchAsInlineData(imageUrl);
      result = await geminiGenerateImage(apiKey, source, UPSCALE_PROMPT);
    } catch (err) {
      if (err instanceof GeminiError) return jsonResponse({ error: err.message }, err.status);
      return jsonResponse({ error: err instanceof Error ? err.message : 'Could not prepare that image for the AI.' }, 400);
    }

    try {
      const bytes = Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0));
      const ext = result.mimeType.includes('png') ? 'png' : 'jpg';
      const path = `images/upscaled-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const svc = serviceClient();
      const { error: upErr } = await svc.storage.from('product-media').upload(path, bytes, { contentType: result.mimeType });
      if (upErr) throw upErr;
      const { data: pub } = svc.storage.from('product-media').getPublicUrl(path);

      // Register it like ai-image-studio does, otherwise the file is invisible in the media
      // library and only the current browser tab ever sees the new URL.
      await svc.from('media_assets').insert({
        url: pub.publicUrl, path, file_name: path.split('/').pop(), media_type: 'image', size_bytes: bytes.length,
      });

      return jsonResponse({ url: pub.publicUrl });
    } catch (storageErr) {
      console.error('Storage error:', storageErr);
      return jsonResponse({ error: 'Could not save the upscaled image' }, 500);
    }
  } catch (err) {
    console.error('ai-image-upscale failed:', err);
    return jsonResponse({ error: 'Service error - please try again' }, 500);
  }
});
