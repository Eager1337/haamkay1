import { corsHeaders } from '../_shared/cors.ts';
import { requireAdmin, serviceClient } from '../_shared/admin.ts';
import { fetchAsInlineData, geminiGenerateImage, GeminiError } from '../_shared/gemini.ts';

const UPSCALE_PROMPT =
  'Upscale and enhance this image to the highest possible resolution and clarity. Sharpen fine detail, remove noise, blur and compression artifacts, correct lighting. Keep the exact subject, composition, colours and framing unchanged — do not add, remove or reinterpret anything.';

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
    if (!/^https?:\/\//i.test(imageUrl) && !imageUrl.startsWith('data:image/')) {
      return new Response(JSON.stringify({ error: 'A valid image is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let result;
    try {
      const source = await fetchAsInlineData(imageUrl);
      result = await geminiGenerateImage(apiKey, source, UPSCALE_PROMPT);
    } catch (err) {
      if (err instanceof GeminiError) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: err.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw err;
    }

    try {
      const bytes = Uint8Array.from(atob(result.data), (c) => c.charCodeAt(0));
      const ext = result.mimeType.includes('png') ? 'png' : 'jpg';
      const path = `images/upscaled-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
      const svc = serviceClient();
      const { error: upErr } = await svc.storage.from('product-media').upload(path, bytes, { contentType: result.mimeType });
      if (upErr) throw upErr;
      const { data: pub } = svc.storage.from('product-media').getPublicUrl(path);

      return new Response(JSON.stringify({ url: pub.publicUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (storageErr) {
      console.error('Storage error:', storageErr);
      return new Response(JSON.stringify({ error: 'Could not save the upscaled image' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (err) {
    console.error('ai-image-upscale failed:', err);
    return new Response(JSON.stringify({ error: 'Service error - please try again' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
