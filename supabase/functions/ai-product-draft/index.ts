import { requireAdmin } from '../_shared/admin.ts';
import { fetchAsInlineData, geminiGenerateJSON, GeminiError } from '../_shared/gemini.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

const MAX_IMAGES = 20;

const SYSTEM = `You are a product listing assistant for Haamkay Enterprises, a luxury retail store in Freetown, Sierra Leone.
Prices are in Sierra Leonean Leones (Le). You look at a product photo and produce a complete, ready-to-publish listing.
Be concrete and commercial: no placeholders, no "unknown". Estimate a realistic retail price in Leones for the Sierra Leone market.
Include the sizes and colours that are visible or typical for this kind of product.`;

const LISTING_SCHEMA = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' },
    category: { type: 'STRING' },
    price: { type: 'NUMBER', description: 'Retail price in Sierra Leonean Leones' },
    description: { type: 'STRING' },
    stock: { type: 'NUMBER' },
    sizes: { type: 'ARRAY', items: { type: 'STRING' } },
    colors: { type: 'ARRAY', items: { type: 'STRING' } },
    tags: { type: 'ARRAY', items: { type: 'STRING' } },
    confidence: { type: 'NUMBER' },
  },
  required: ['name', 'category', 'price', 'description'],
};

type RawDraft = Record<string, unknown>;

function normalizeDraft(draft: RawDraft) {
  const list = (value: unknown, max: number) =>
    Array.isArray(value) ? value.slice(0, max).map((item) => String(item).trim()).filter(Boolean) : [];

  return {
    name: String(draft.name ?? '').slice(0, 200),
    category: String(draft.category ?? '').slice(0, 100),
    price: Number(draft.price) || 0,
    description: String(draft.description ?? '').slice(0, 4000),
    stock: Number.isFinite(Number(draft.stock)) ? Math.max(0, Math.round(Number(draft.stock))) : 1,
    sizes: list(draft.sizes, 12),
    colors: list(draft.colors, 12),
    tags: list(draft.tags, 8),
    confidence: Number(draft.confidence) || null,
  };
}

function userPrompt(categories: string[]) {
  return `Create a listing for this product.${
    categories.length
      ? ` Pick the single best category from this list: ${categories.join(', ')}. If none fit, suggest a new short category name.`
      : ''
  }`;
}

async function draftWithGemini(apiKey: string, imageUrl: string, categories: string[]) {
  const inline = await fetchAsInlineData(imageUrl);
  const draft = await geminiGenerateJSON<RawDraft>(apiKey, SYSTEM, userPrompt(categories), [inline], LISTING_SCHEMA);
  return normalizeDraft(draft);
}

async function draftWithOpenAI(apiKey: string, imageUrl: string, categories: string[]) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt(categories) },
            { type: 'image_url', image_url: { url: imageUrl } },
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
              sizes: { type: 'array', items: { type: 'string' } },
              colors: { type: 'array', items: { type: 'string' } },
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
    console.error(`OpenAI error [${res.status}]: ${details}`);
    throw new Error('AI service unavailable. Please try again in a moment.');
  }

  const json = await res.json();
  const call = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) throw new Error('The AI could not read this photo — try a clearer image.');
  return normalizeDraft(JSON.parse(call.function.arguments));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 200, headers: corsHeaders });

  try {
    const adminId = await requireAdmin(req);
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!geminiKey && !openaiKey) {
      return new Response(
        JSON.stringify({ error: 'AI is not configured yet — add a GEMINI_API_KEY (or OPENAI_API_KEY) secret.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const body = await req.json();
    const images: string[] = Array.isArray(body?.images) ? body.images.slice(0, MAX_IMAGES) : [];
    const categories: string[] = Array.isArray(body?.categories) ? body.categories : [];
    if (images.length === 0) {
      return new Response(JSON.stringify({ error: 'No images provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = await Promise.all(images.map(async (url) => {
      try {
        if (geminiKey) {
          try {
            return { image: url, draft: await draftWithGemini(geminiKey, url, categories) };
          } catch (err) {
            if (!openaiKey) throw err;
            console.error('Gemini draft failed, falling back to OpenAI:', err);
          }
        }
        return { image: url, draft: await draftWithOpenAI(openaiKey!, url, categories) };
      } catch (err) {
        console.error(`Failed to process image ${url}:`, err);
        const message = err instanceof GeminiError || err instanceof Error ? err.message : 'Processing error - please try again';
        return { image: url, error: message };
      }
    }));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ai-product-draft failed:', err);
    return new Response(JSON.stringify({ error: 'Service temporarily unavailable' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
