import { jsonResponse, preflight } from '../_shared/cors.ts';
import { requireAdmin, serviceClient } from '../_shared/admin.ts';
import { fetchAsInlineData, geminiGenerateImage, GeminiError } from '../_shared/gemini.ts';

const ENHANCE_PROMPT =
  'Upscale and enhance this product photo to ultra sharp, high resolution studio quality. Keep the product identical — same shape, colour, branding and details. Remove noise and blur, fix lighting, boost clarity. Perfect for luxury e-commerce.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();

  try {
    const adminId = await requireAdmin(req);
    if (!adminId) return jsonResponse({ error: 'Admin access required' }, 401);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    // A missing secret is a configuration problem, not a transient failure: say so, in the
    // body the admin UI can show, instead of throwing a raw Error that becomes "Service error".
    if (!apiKey) {
      console.error('ai-image-studio: GEMINI_API_KEY secret is not set');
      return jsonResponse({ error: 'AI is not configured yet — add a GEMINI_API_KEY secret to this Supabase project.' }, 400);
    }

    const body = await req.json();
    const imageUrl: string = String(body?.imageUrl ?? '');
    const mode: string = body?.mode === 'edit' ? 'edit' : 'enhance';
    const instruction: string = String(body?.prompt ?? '').slice(0, 2000);

    if (!/^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith('data:image/')) {
      return jsonResponse({ error: 'A valid image is required' }, 400);
    }
    if (mode === 'edit' && !instruction) {
      return jsonResponse({ error: 'Tell the AI what to change' }, 400);
    }

    const prompt = mode === 'enhance'
      ? ENHANCE_PROMPT
      : `${instruction}\n\nKeep the product itself accurate and realistic. Return a clean, high resolution e-commerce ready image.`;

    let result;
    try {
      const source = await fetchAsInlineData(imageUrl);
      result = await geminiGenerateImage(apiKey, source, prompt);
    } catch (err) {
      if (err instanceof GeminiError) return jsonResponse({ error: err.message }, err.status);
      // Anything else (bad image URL, oversized file) is still the user's to act on.
      return jsonResponse({ error: err instanceof Error ? err.message : 'Could not prepare that image for the AI.' }, 400);
    }

    // Persist the generated image to storage so it can be attached to a product.
    try {
      const bytes = Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0));
      const ext = result.mimeType.includes('png') ? 'png' : 'jpg';
      const path = `images/ai-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const svc = serviceClient();
      const { error: upErr } = await svc.storage.from('product-media').upload(path, bytes, { contentType: result.mimeType });
      if (upErr) throw upErr;
      const { data: pub } = svc.storage.from('product-media').getPublicUrl(path);
      await svc.from('media_assets').insert({
        url: pub.publicUrl, path, file_name: path.split('/').pop(), media_type: 'image', size_bytes: bytes.length,
      });

      return jsonResponse({ url: pub.publicUrl, note: result.text });
    } catch (storageErr) {
      console.error('Storage error:', storageErr);
      return jsonResponse({ error: 'Could not save processed image' }, 500);
    }
  } catch (err) {
    console.error('ai-image-studio failed:', err);
    return jsonResponse({ error: 'Service error - please try again' }, 500);
  }
});
