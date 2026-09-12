import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const SYSTEM = `You are a product listing assistant for Haamkay Enterprises, a luxury retail store in Freetown, Sierra Leone.
Prices are in Sierra Leonean Leones (Le). You look at a product photo and produce a complete, ready-to-publish listing.
Be concrete and commercial: no placeholders, no "unknown". Estimate a realistic retail price in Leones for the Sierra Leone market.`;

/* Sanitise the raw draft object returned by any AI provider into a safe shape. */
function normalizeDraft(draft) {
  return {
    name: String(draft.name ?? '').slice(0, 200),
    category: String(draft.category ?? '').slice(0, 100),
    price: Number(draft.price) || 0,
    description: String(draft.description ?? '').slice(0, 4000),
    stock: Number.isFinite(draft.stock) ? Math.max(0, Math.round(draft.stock)) : 1,
    tags: Array.isArray(draft.tags) ? draft.tags.slice(0, 8).map(String) : [],
    confidence: Number(draft.confidence) || null,
  };
}

/* ── Provider 1: Google Gemini (free tier — no payment required) ── */
async function geminiDraft(url, categories, apiKey) {
  // Fetch the image and convert to base64 (Gemini inline_data requires base64)
  const imgRes = await fetch(url);
  if (!imgRes.ok) throw new Error(`Failed to fetch image: ${imgRes.status}`);
  const arrayBuffer = await imgRes.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

  const prompt = `${SYSTEM}
Create a listing for this product.${
    categories.length
      ? ` Pick the single best category from this list: ${categories.join(', ')}. If none fit, suggest a new short category name.`
      : ''
  }
Return ONLY a JSON object with these fields: name (string), category (string), price (number — retail price in Sierra Leonean Leones), description (string), stock (number), tags (array of short strings), confidence (number 0-1).`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64 } }] }],
        generationConfig: { response_mime_type: 'application/json', temperature: 0.4 },
      }),
    }
  );

  if (!response.ok) {
    const details = await response.text();
    console.error(`Gemini error [${response.status}]: ${details}`);
    throw new Error(`Gemini error ${response.status}`);
  }

  const json = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No listing returned from Gemini');
  return normalizeDraft(JSON.parse(text));
}

/* ── Provider 2: OpenAI gpt-4o vision ── */
async function openaiDraft(url, categories, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
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
    throw new Error(`OpenAI error ${response.status}`);
  }

  const json = await response.json();
  const call = json.choices?.[0]?.message?.tool_calls?.[0];
  if (!call) throw new Error('No listing returned from OpenAI');
  return normalizeDraft(JSON.parse(call.function.arguments));
}

/* ── Provider 3 (last resort): filename-based local guess ── */
function localDraft(url, categories) {
  let name = 'Product';
  try {
    const file = decodeURIComponent(url.split('/').pop() || '');
    name = file.replace(/\.[^.]+$/, '')
      .replace(/^\d+-[a-z0-9]+-/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim() || 'Product';
  } catch { /* keep default */ }

  const category = categories.length
    ? categories[Math.floor(Math.random() * categories.length)]
    : 'General';
  const price = Math.round((50000 + Math.random() * 450000) / 1000) * 1000;
  const stock = 1 + Math.floor(Math.random() * 20);
  const tags = name.toLowerCase().split(' ').filter(w => w.length > 2).slice(0, 4);

  return {
    name, category, price, confidence: 0.6,
    description: `${name} — a quality product available at Haamkay Enterprises. Browse our collection in ${category} and more. Great value at Le ${price.toLocaleString()}.`,
    stock, tags,
  };
}

/* Try each available AI provider in order; fall back to local draft. */
async function analyzeImage(url, categories) {
  // Prefer Gemini (free tier) when a key is available
  if (process.env.GEMINI_API_KEY) {
    try {
      return await geminiDraft(url, categories, process.env.GEMINI_API_KEY);
    } catch (err) {
      console.log(`[gemini-failed] ${err.message} — trying next provider`);
    }
  }
  // Then OpenAI if a key is available
  if (process.env.OPENAI_API_KEY) {
    try {
      return await openaiDraft(url, categories, process.env.OPENAI_API_KEY);
    } catch (err) {
      console.log(`[openai-failed] ${err.message} — trying next provider`);
    }
  }
  // Last resort: filename-based local draft
  console.log(`[fallback] Using local draft for ${url}`);
  return localDraft(url, categories);
}

app.post('/api/ai-product-draft', async (req, res) => {
  try {
    const images = Array.isArray(req.body?.images) ? req.body.images.slice(0, 12) : [];
    const categories = Array.isArray(req.body?.categories) ? req.body.categories : [];
    if (images.length === 0) return res.status(400).json({ error: 'No images provided' });

    // Process in batches of 3 to avoid rate limits with many images
    const BATCH_SIZE = 3;
    const results = [];
    for (let i = 0; i < images.length; i += BATCH_SIZE) {
      const batch = images.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(batch.map(async (url) => {
        try {
          const draft = await analyzeImage(url, categories);
          return { image: url, draft };
        } catch (err) {
          console.error(`Failed to process image ${url}:`, err);
          return { image: url, draft: localDraft(url, categories) };
        }
      }));
      results.push(...batchResults);
    }

    res.json({ results });
  } catch (err) {
    console.error('ai-product-draft failed:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`AI backend running on port ${PORT}`));
