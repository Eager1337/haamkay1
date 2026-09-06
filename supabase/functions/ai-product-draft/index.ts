import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { requireAdmin } from '../_shared/admin.ts';

const GATEWAY_MODEL = 'google/gemini-3.5-flash';
const GEMINI_MODEL = 'gemini-2.5-flash';
const MAX_IMAGES = 20;

const SYSTEM = `You are a product listing assistant for Haamkay Enterprises, a luxury retail store in Freetown, Sierra Leone.
Prices are in Sierra Leonean Leones (Le). You look at a product photo and produce a complete, ready-to-publish listing.
Be concrete and commercial: no placeholders, never say "unknown". Always estimate a realistic retail price in Leones for the
Sierra Leone market, always give a marketing-quality description of at least 40 words, and always guess likely sizes and colours
from what you can see (e.g. clothing => S, M, L, XL; shoes => 38-45; single-size items => "One Size").`;

const LISTING_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    category: { type: 'string' },
    price: { type: 'number', description: 'Retail price in Sierra Leonean Leones' },
    description: { type: 'string' },
    stock: { type: 'number' },
    sizes: { type: 'array', items: { type: 'string' } },
    colors: { type: 'array', items: { type: 'string' } },
    tags: { type: 'array', items: { type: 'string' } },
    confidence: { type: 'number' },
  },
  required: ['name', 'category', 'price', 'description', 'sizes', 'colors'],
  additionalProperties: false,
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function normalise(raw: Record<string, unknown>) {
  const arr = (v: unknown, max: number) =>
    Array.isArray(v) ? v.slice(0, max).map((x) => String(x).slice(0, 40)).filter(Boolean) : [];
  return {
    name: String(raw.name ?? '').slice(0, 200) || 'New Product',
    category: String(raw.category ?? '').slice(0, 100) || 'General',
    price: Number(raw.price) > 0 ? Number(raw.price) : 0,
    description: String(raw.description ?? '').slice(0, 4000),
    stock: Number.isFinite(Number(raw.stock)) ? Math.max(0, Math.round(Number(raw.stock))) : 1,
    sizes: arr(raw.sizes, 12),
    colors: arr(raw.colors, 12),
    tags: arr(raw.tags, 8),
    confidence: Number(raw.confidence) || null,
  };
}

function userPrompt(categories: string[]) {
  return `Create a complete listing for this product.${
    categories.length
      ? ` Pick the single best category from this list: ${categories.join(', ')}. If none fit, suggest a short new category name.`
      : ''
  } Always include sizes and colours.`;
}

/** Direct Google Gemini call using the store owner's own API key. */
async function viaGemini(key: string, url: string, categories: string[]) {
  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error(`Could not read image (${imgRes.status})`);
  const bytes = new Uint8Array(await imgRes.arrayBuffer());
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  const b64 = btoa(bin);
  const mime = imgRes.headers.get('content-type')?.split(';')[0] || 'image/jpeg';

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt(categories) }, { inline_data: { mime_type: mime, data: b64 } }],
          },
        ],
        generationConfig: { responseMimeType: 'application/json', responseSchema: LISTING_SCHEMA },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '';
  if (!text) throw new Error('Gemini returned no listing');
  return normalise(JSON.parse(text));
}

/** Lovable AI Gateway fallback so a listing never fails. */
async function viaGateway(key: string, url: string, categories: string[]) {
  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GATEWAY_MODEL,
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt(categories) },
            { type: 'image_url', image_url: { url } },
          ],
        },
      ],
      tools: [
        {
          type: 'function',
          function: { name: 'create_listing', description: 'Return the product listing fields', parameters: LISTING_SCHEMA },
        },
      ],
      tool_choice: { type: 'function', function: { name: 'create_listing' } },
    }),
  });
  if (!res.ok) throw new Error(`Gateway ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const json = await res.json();
  const call = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) throw new Error('Gateway returned no listing');
  return normalise(JSON.parse(call.function.arguments));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const adminId = await requireAdmin(req);
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const gatewayKey = Deno.env.get('LOVABLE_API_KEY');
    if (!geminiKey && !gatewayKey) throw new Error('No AI key configured');

    const body = await req.json();
    const images: string[] = Array.isArray(body?.images) ? body.images.slice(0, MAX_IMAGES) : [];
    const categories: string[] = Array.isArray(body?.categories) ? body.categories.map(String) : [];
    if (images.length === 0) {
      return new Response(JSON.stringify({ error: 'No images provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const runOne = async (url: string) => {
      const attempts: Array<() => Promise<ReturnType<typeof normalise>>> = [];
      if (geminiKey) attempts.push(() => viaGemini(geminiKey, url, categories));
      if (gatewayKey) attempts.push(() => viaGateway(gatewayKey, url, categories));
      if (geminiKey) attempts.push(() => viaGemini(geminiKey, url, categories));

      let lastError = 'Unknown error';
      for (let i = 0; i < attempts.length; i++) {
        try {
          return { image: url, draft: await attempts[i]() };
        } catch (err) {
          lastError = (err as Error).message;
          console.error(`listing attempt ${i + 1} failed for ${url}: ${lastError}`);
          await sleep(500 * (i + 1));
        }
      }
      return { image: url, error: lastError };
    };

    // Small concurrency so 20 images never trip provider rate limits.
    const results: Array<Awaited<ReturnType<typeof runOne>>> = [];
    const batchSize = 4;
    for (let i = 0; i < images.length; i += batchSize) {
      results.push(...(await Promise.all(images.slice(i, i + batchSize).map(runOne))));
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ai-product-draft failed:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
