import { corsHeaders } from '../_shared/cors.ts';
import { requireAdmin, serviceClient } from '../_shared/admin.ts';
import { fetchAsInlineData, geminiGenerateImage, GeminiError } from '../_shared/gemini.ts';

const ENHANCE_PROMPT =
  'Upscale and enhance this product photo to ultra sharp, high resolution studio quality. Keep the product identical — same shape, colour, branding and details. Remove noise and blur, fix lighting, boost clarity. Perfect for luxury e-commerce.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const adminId = await requireAdmin(req);
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const body = await req.json();
    const imageUrl: string = String(body?.imageUrl ?? '');
    const mode: string = body?.mode === 'edit' ? 'edit' : 'enhance';
    const instruction: string = String(body?.prompt ?? '').slice(0, 2000);

    if (!/^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith('data:image/')) {
      return new Response(JSON.stringify({ error: 'A valid image is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (mode === 'edit' && !instruction) {
      return new Response(JSON.stringify({ error: 'Tell the AI what to change' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const prompt = mode === 'enhance'
      ? ENHANCE_PROMPT
      : `${instruction}\n\nKeep the product itself accurate and realistic. Return a clean, high resolution e-commerce ready image.`;

    let result;
    try {
      const source = await fetchAsInlineData(imageUrl);
      result = await geminiGenerateImage(apiKey, source, prompt);
    } catch (err) {
      if (err instanceof GeminiError) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: err.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw err;
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

      return new Response(JSON.stringify({ url: pub.publicUrl, note: result.text }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (storageErr) {
      console.error('Storage error:', storageErr);
      return new Response(JSON.stringify({ error: 'Could not save processed image' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    console.error('ai-image-studio failed:', err);
    return new Response(JSON.stringify({ error: 'Service error - please try again' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
