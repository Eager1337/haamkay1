import { requireAdmin } from '../_shared/admin.ts';
import { fetchAsInlineData, geminiGenerateJsonFromImage, GeminiError } from '../_shared/gemini.ts';
import { corsHeaders } from '../_shared/cors.ts';

const SYSTEM = `You are a product listing assistant for Haamkay Enterprises, a luxury retail store in Freetown, Sierra Leone.
Prices are in Sierra Leonean Leones (Le). You look at a product photo and produce a complete, ready-to-publish listing.
Be concrete and commercial: no placeholders, no "unknown". Estimate a realistic retail price in Leones for the Sierra Leone market.`;

function normalizeDraft(draft: Record<string, unknown>) {
  return {
    name: String(draft.name ?? '').slice(0, 200),
    category: String(draft.category ?? '').slice(0, 100),
    price: Number(draft.price) || 0,
    description: String(draft.description ?? '').slice(0, 4000),
    stock: Number.isFinite(draft.stock) ? Math.max(0, Math.round(draft.stock as number)) : 1,
    tags: Array.isArray(draft.tags) ? draft.tags.slice(0, 8).map(String) : [],
    confidence: Number(draft.confidence) || null,
  };
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

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'AI service is not configured' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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
      try {
        const source = await fetchAsInlineData(url);
        const draft = await geminiGenerateJsonFromImage(
          apiKey,
          source,
          SYSTEM,
          `Create a listing for this product.${
            categories.length ? ` Pick the single best category from this list: ${categories.join(', ')}. If none fit, suggest a new short category name.` : ''
          } Return one JSON object with name, category, price, description, stock, tags, and confidence.`,
        );
        return { image: url, draft: normalizeDraft(draft) };
      } catch (err) {
        console.error(`Failed to process image ${url}:`, err);
        return { image: url, error: err instanceof GeminiError ? err.message : 'Could not process this image' };
      }
    }));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ai-product-draft failed:', err);
    return new Response(JSON.stringify({ error: err instanceof GeminiError ? err.message : 'Service temporarily unavailable' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
