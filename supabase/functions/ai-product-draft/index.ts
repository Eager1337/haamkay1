import { jsonResponse, preflight } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/admin.ts';
import { fetchAsInlineData, geminiGenerateJSON, GeminiError } from '../_shared/gemini.ts';

const MAX_IMAGES = 20;
const MAX_CONCURRENT = 3;

const SYSTEM = `You are a product listing assistant for Haamkay Enterprises, a luxury retail store in Freetown, Sierra Leone.
Prices are in Sierra Leonean Leones (Le). You look at a product photo and produce a complete, ready-to-publish listing.
Be concrete and commercial: no placeholders, no "unknown". Estimate a realistic retail price in Leones for the Sierra Leone market.
Include the sizes and colours that are visible or typical for this kind of product.`;

const LISTING_SCHEMA = {
  type: 'OBJECT',
  properties: {
    name: { type: 'STRING' }, category: { type: 'STRING' },
    price: { type: 'NUMBER', description: 'Retail price in Sierra Leonean Leones' },
    description: { type: 'STRING' }, stock: { type: 'NUMBER' },
    sizes: { type: 'ARRAY', items: { type: 'STRING' } },
    colors: { type: 'ARRAY', items: { type: 'STRING' } },
    tags: { type: 'ARRAY', items: { type: 'STRING' } },
    confidence: { type: 'NUMBER' },
  },
  required: ['name', 'category', 'price', 'description'],
};

type RawDraft = Record<string, unknown>;

function normalizeDraft(draft: RawDraft) {
  const list = (value: unknown, max: number) => Array.isArray(value)
    ? value.slice(0, max).map((item) => String(item).trim()).filter(Boolean)
    : [];
  return {
    name: String(draft.name ?? '').slice(0, 200),
    category: String(draft.category ?? '').slice(0, 100),
    price: Number(draft.price) || 0,
    description: String(draft.description ?? '').slice(0, 4000),
    stock: Number.isFinite(Number(draft.stock)) ? Math.max(0, Math.round(Number(draft.stock))) : 1,
    sizes: list(draft.sizes, 12), colors: list(draft.colors, 12), tags: list(draft.tags, 8),
    confidence: Number(draft.confidence) || null,
  };
}

function userPrompt(categories: string[]) {
  return `Create a listing for this product.${categories.length
    ? ` Pick the single best category from this list: ${categories.join(', ')}. If none fit, suggest a new short category name.` : ''}`;
}

async function draftWithGemini(apiKey: string, imageUrl: string, categories: string[]) {
  const inline = await fetchAsInlineData(imageUrl);
  return normalizeDraft(await geminiGenerateJSON<RawDraft>(apiKey, SYSTEM, userPrompt(categories), [inline], LISTING_SCHEMA));
}

async function draftWithOpenAI(apiKey: string, imageUrl: string, categories: string[]) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: [{ type: 'text', text: userPrompt(categories) }, { type: 'image_url', image_url: { url: imageUrl } }] },
      ],
      tools: [{ type: 'function', function: {
        name: 'create_listing', description: 'Return the product listing fields',
        parameters: {
          type: 'object', properties: {
            name: { type: 'string' }, category: { type: 'string' }, price: { type: 'number' },
            description: { type: 'string' }, stock: { type: 'number' },
            sizes: { type: 'array', items: { type: 'string' } }, colors: { type: 'array', items: { type: 'string' } },
            tags: { type: 'array', items: { type: 'string' } }, confidence: { type: 'number' },
          }, required: ['name', 'category', 'price', 'description'], additionalProperties: false,
        },
      } }],
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

async function processOne(url: string, categories: string[], geminiKey?: string, openaiKey?: string) {
  try {
    if (geminiKey) {
      try { return { image: url, draft: await draftWithGemini(geminiKey, url, categories) }; }
      catch (err) {
        if (!openaiKey) throw err;
        console.error('Gemini failed for one image; falling back to OpenAI:', err);
      }
    }
    if (!openaiKey) throw new Error('No AI provider is configured. Add GEMINI_API_KEY or OPENAI_API_KEY.');
    return { image: url, draft: await draftWithOpenAI(openaiKey, url, categories) };
  } catch (err) {
    console.error(`Failed to process image ${url}:`, err);
    const message = err instanceof GeminiError || err instanceof Error ? err.message : 'Processing error — please try again';
    return { image: url, error: message };
  }
}

async function processBatch(urls: string[], categories: string[], geminiKey?: string, openaiKey?: string) {
  const results: Array<{ image: string; draft?: ReturnType<typeof normalizeDraft>; error?: string }> = [];
  let next = 0;
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= urls.length) return;
      results[index] = await processOne(urls[index], categories, geminiKey, openaiKey);
    }
  }
  await Promise.all(Array.from({ length: Math.min(MAX_CONCURRENT, urls.length) }, () => worker()));
  return results;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();
  try {
    const adminId = await requireAdmin(req);
    if (!adminId) return jsonResponse({ error: 'Admin access required' }, 401);

    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    if (!geminiKey && !openaiKey) {
      return jsonResponse({ error: 'AI is not configured yet — add a GEMINI_API_KEY (or OPENAI_API_KEY) secret to this Supabase project.' }, 400);
    }

    const body = await req.json();
    const images: string[] = Array.isArray(body?.images)
      ? body.images.filter((url: unknown): url is string => typeof url === 'string' && /^https?:\/\//.test(url)).slice(0, MAX_IMAGES) : [];
    const categories: string[] = Array.isArray(body?.categories)
      ? body.categories.filter((value: unknown): value is string => typeof value === 'string').slice(0, 100) : [];
    if (!images.length) return jsonResponse({ error: 'No valid image URLs were provided.' }, 400);

    const results = await processBatch(images, categories, geminiKey, openaiKey);
    const successCount = results.filter(r => r.draft).length;
    return jsonResponse({ results, count: results.length, successCount, failedCount: results.length - successCount });
  } catch (err) {
    console.error('ai-product-draft failed:', err);
    // A GeminiError already carries an actionable message ("add the missing secret",
    // "rate limited", ...) — the old blanket 500 hid it from admins and from the logs.
    if (err instanceof GeminiError) return jsonResponse({ error: err.message }, err.status);
    return jsonResponse({ error: 'Service temporarily unavailable. Please try again.' }, 500);
  }
});
