import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { requireAdmin, serviceClient } from '../_shared/admin.ts';

const MODELS = ['google/gemini-3-pro-image', 'google/gemini-3.1-flash-image', 'google/gemini-2.5-flash-image'];

const ENHANCE_PROMPT =
  'Upscale and enhance this product photo to ultra sharp 8K studio quality. Keep the product identical — same shape, colour, branding and details. Remove noise and blur, fix lighting, boost clarity and micro-detail, clean the background, and produce a premium e-commerce catalogue image.';

async function callGateway(apiKey: string, imageUrl: string, prompt: string) {
  let lastError = '';
  for (const model of MODELS) {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        modalities: ['image', 'text'],
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: imageUrl } },
            ],
          },
        ],
      }),
    });

    if (res.status === 429 || res.status === 402) {
      return { status: res.status, error: res.status === 429 ? 'Rate limit reached — try again shortly.' : 'AI credits exhausted. Please top up to continue.' };
    }

    if (!res.ok) {
      lastError = `${model}: ${res.status} ${await res.text()}`;
      continue;
    }

    const json = await res.json();
    const message = json.choices?.[0]?.message;
    const dataUrl: string | undefined = message?.images?.[0]?.image_url?.url;
    if (!dataUrl) {
      lastError = `${model}: no image returned`;
      continue;
    }
    return { dataUrl, text: typeof message?.content === 'string' ? message.content : '' };
  }
  return { status: 502, error: lastError || 'Image model unavailable' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const adminId = await requireAdmin(req);
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY is not configured');

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

    const result = await callGateway(apiKey, imageUrl, prompt);
    if ('error' in result) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: result.status ?? 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Persist the generated image to storage so it can be attached to a product.
    const base64 = result.dataUrl.split(',')[1] ?? '';
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const path = `images/ai-${Date.now()}-${crypto.randomUUID().slice(0, 8)}.png`;
    const svc = serviceClient();
    const { error: upErr } = await svc.storage.from('product-media').upload(path, bytes, { contentType: 'image/png' });
    if (upErr) throw upErr;
    const { data: pub } = svc.storage.from('product-media').getPublicUrl(path);
    await svc.from('media_assets').insert({
      url: pub.publicUrl, path, file_name: path.split('/').pop(), media_type: 'image', size_bytes: bytes.length,
    });

    return new Response(JSON.stringify({ url: pub.publicUrl, note: result.text ?? '' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ai-image-studio failed:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
