import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const SYSTEM = `You are a product listing assistant for Haamkay Enterprises, a luxury retail store in Freetown, Sierra Leone.
Prices are in Sierra Leonean Leones (Le). You look at a product photo and produce a complete, ready-to-publish listing.
Be concrete and commercial: no placeholders, no "unknown". Estimate a realistic retail price in Leones for the Sierra Leone market.`;

/* Free local fallback — generates a listing draft from the image filename
   without calling any external AI API. Used when OPENAI_API_KEY is not set. */
function localDraft(url, categories) {
  let name = 'Product';
  try {
    const file = decodeURIComponent(url.split('/').pop() || '');
    name = file.replace(/\.[^.]+$/, '')                    // strip extension
      .replace(/^\d+-[a-z0-9]+-/i, '')                     // strip timestamp-random prefix
      .replace(/[-_]/g, ' ')                                // separators → spaces
      .replace(/\b\w/g, c => c.toUpperCase())              // title case
      .trim() || 'Product';
  } catch { /* keep default */ }

  const category = categories.length
    ? categories[Math.floor(Math.random() * categories.length)]
    : 'General';

  const price = Math.round((50000 + Math.random() * 450000) / 1000) * 1000; // 50k–500k Le
  const stock = 1 + Math.floor(Math.random() * 20);
  const tags = name.toLowerCase().split(' ').filter(w => w.length > 2).slice(0, 4);

  return {
    name,
    category,
    price,
    description: `${name} — a quality product available at Haamkay Enterprises. ` +
      `Browse our collection in ${category} and more. Great value at Le ${price.toLocaleString()}.`,
    stock,
    tags,
    confidence: 0.6,
  };
}

app.post('/api/ai-product-draft', async (req, res) => {
  try {
    const images = Array.isArray(req.body?.images) ? req.body.images.slice(0, 12) : [];
    const categories = Array.isArray(req.body?.categories) ? req.body.categories : [];
    if (images.length === 0) return res.status(400).json({ error: 'No images provided' });

    // Free mode: no API key → generate drafts locally
    if (!process.env.OPENAI_API_KEY) {
      const results = images.map(url => ({ image: url, draft: localDraft(url, categories) }));
      console.log(`[free-mode] Generated ${results.length} draft(s) without OpenAI`);
      return res.json({ results });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    const results = await Promise.all(images.map(async (url) => {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [
              { role: 'system', content: SYSTEM },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `Create a listing for this product.${
                      categories.length
                        ? ` Pick the single best category from this list: ${categories.join(', ')}. If none fit, suggest a new short category name.`
                        : ''
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

        if (!response.ok) {
          const details = await response.text();
          console.error(`OpenAI error [${response.status}]: ${details}`);
          return { image: url, error: `AI error ${response.status}`, details };
        }

        const json = await response.json();
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
      } catch (err) {
        console.error('Failed to process image:', err);
        return { image: url, error: err.message };
      }
    }));

    res.json({ results });
  } catch (err) {
    console.error('ai-product-draft failed:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`AI backend running on port ${PORT}`));
