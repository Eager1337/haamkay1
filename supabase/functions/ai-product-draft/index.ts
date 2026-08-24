import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { requireAdmin } from '../_shared/admin.ts';

const MODEL = 'google/gemini-3.5-flash';

const SYSTEM = `You are a product listing assistant for Haamkay Enterprises, a luxury retail store in Freetown, Sierra Leone.
Prices are in Sierra Leonean Leones (Le). You look at a product photo and produce a complete, ready-to-publish listing.
Be concrete and commercial: no placeholders, no "unknown". Estimate a realistic retail price in Leones for the Sierra Leone market.`;

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

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

    const body = await req.json();
    const images: string[] = Array.isArray(body?.images) ? body.images.slice(0, 12) : [];
    const categories: string[] = Array.isArray(body?.categories) ? body.categories : [];
    if (images.length === 0) {
      return new Response(JSON.stringify({ error: 'No images provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = await Promise.all(images.map(async (url) => {
      const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: SYSTEM },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Create a listing for this product.${
                    categories.length ? ` Pick the single best category from this list: ${categories.join(', ')}. If none fit, suggest a new short category name.` : ''
                  }`,
                },
                { type: 'image_url', image_url: { url } },
              ],
            },
          ],
          tools: [{
            type: 'function',
            function: {
              name: 'create_listing',
              description: 'Return the product listing fields',
              parameters: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  category: { type: 'string' },
                  price: { type: 'number', description: 'Retail price in Sierra Leonean Leones' },
                  description: { type: 'string' },
                  stock: { type: 'number' },
                  tags: { type: 'array', items: { type: 'string' } },
                  confidence: { type: 'number' },
                },
                required: ['name', 'category', 'price', 'description'],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: 'function', function: { name: 'create_listing' } },
        }),
      });

      if (!res.ok) {
        const details = await res.text();
        console.error(`AI gateway error [${res.status}]: ${details}`);
        return { image: url, error: `AI error ${res.status}`, details };
      }

      const json = await res.json();
      const call = json.choices?.[0]?.message?.tool_calls?.[0];
      if (!call) return { image: url, error: 'No listing returned' };
      const draft = JSON.parse(call.function.arguments);
      return {
        image: url,
        draft: {
          name: String(draft.name ?? '').slice(0, 200),
          category: String(draft.category ?? '').slice(0, 100),
          price: Number(draft.price) || 0,
          description: String(draft.description ?? '').slice(0, 4000),
          stock: Number.isFinite(draft.stock) ? Math.max(0, Math.round(draft.stock)) : 1,
          tags: Array.isArray(draft.tags) ? draft.tags.slice(0, 8).map(String) : [],
          confidence: Number(draft.confidence) || null,
        },
      };
    }));

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
