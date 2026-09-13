// Direct Google Gemini API client (no third-party gateway).
// Requires a GEMINI_API_KEY secret from https://aistudio.google.com/app/apikey

export const GEMINI_TEXT_MODEL = 'gemini-3.8-flash';
export const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image';

/**
 * Models tried in order for text/vision work. If Google retires a model the API
 * answers 404 NOT_FOUND, so we fall through to the next one instead of failing.
 */
export const GEMINI_TEXT_MODEL_FALLBACKS = [
  GEMINI_TEXT_MODEL,
  'gemini-2.5-flash',
  'gemini-flash-latest',
];

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function friendlyStatus(status: number): { status: number; message: string } {
  if (status === 429) return { status: 429, message: 'Rate limit reached — try again shortly.' };
  if (status === 400) return { status: 400, message: 'The AI could not process that request.' };
  if (status === 403) return { status: 403, message: 'Gemini API key is invalid or missing permissions.' };
  return { status: 502, message: 'AI service unavailable — please try again shortly.' };
}

/** Fetches an http(s) or data: URL and returns it as base64 + mime type, ready for Gemini inline_data. */
export async function fetchAsInlineData(url: string): Promise<{ data: string; mimeType: string }> {
  if (url.startsWith('data:')) {
    const [header, data] = url.slice(5).split(',');
    const mimeType = header.split(';')[0] || 'image/png';
    return { data, mimeType };
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not fetch source image (${res.status})`);
  const mimeType = res.headers.get('content-type') || 'image/png';
  const bytes = new Uint8Array(await res.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return { data: btoa(binary), mimeType };
}

/** Calls Gemini's image-capable model to generate or edit an image, returning the output image + any text note. */
export async function geminiGenerateImage(
  apiKey: string,
  source: { data: string; mimeType: string },
  prompt: string,
): Promise<{ data: string; mimeType: string; text: string }> {
  const res = await fetch(`${BASE_URL}/${GEMINI_IMAGE_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType: source.mimeType, data: source.data } },
        ],
      }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    console.error(`Gemini image error [${res.status}]: ${details}`);
    const { status, message } = friendlyStatus(res.status);
    throw new GeminiError(status, message);
  }

  const json = await res.json();
  const parts: Array<Record<string, unknown>> = json.candidates?.[0]?.content?.parts ?? [];
  let text = '';
  for (const part of parts) {
    const inline = (part.inlineData ?? part.inline_data) as { data?: string; mimeType?: string; mime_type?: string } | undefined;
    if (inline?.data) {
      return { data: inline.data, mimeType: inline.mimeType ?? inline.mime_type ?? 'image/png', text };
    }
    if (typeof part.text === 'string') text += part.text;
  }

  throw new GeminiError(502, 'The AI did not return an image — please try again.');
}

/** Calls Gemini's text model for plain text generation. */
export async function geminiGenerateText(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/${GEMINI_TEXT_MODEL}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    console.error(`Gemini text error [${res.status}]: ${details}`);
    const { status, message } = friendlyStatus(res.status);
    throw new GeminiError(status, message);
  }

  const json = await res.json();
  const parts: Array<{ text?: string }> = json.candidates?.[0]?.content?.parts ?? [];
  return parts.map((p) => p.text ?? '').join('').trim();
}


/**
 * Calls Gemini with a prompt plus optional images and returns parsed JSON matching
 * `responseSchema`. Retries the next model in GEMINI_TEXT_MODEL_FALLBACKS on 404
 * (model retired / unavailable to this key).
 */
export async function geminiGenerateJSON<T>(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  images: Array<{ data: string; mimeType: string }>,
  responseSchema: Record<string, unknown>,
): Promise<T> {
  const parts: Array<Record<string, unknown>> = [{ text: userPrompt }];
  for (const image of images) {
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  }

  let lastError: GeminiError | null = null;

  for (const model of GEMINI_TEXT_MODEL_FALLBACKS) {
    const res = await fetch(`${BASE_URL}/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema,
        },
      }),
    });

    if (res.status === 404) {
      const details = await res.text();
      console.error(`Gemini model ${model} unavailable [404]: ${details}`);
      lastError = new GeminiError(502, 'AI model unavailable — trying an alternative.');
      continue;
    }

    if (!res.ok) {
      const details = await res.text();
      console.error(`Gemini JSON error [${res.status}] on ${model}: ${details}`);
      const { status, message } = friendlyStatus(res.status);
      throw new GeminiError(status, message);
    }

    const json = await res.json();
    const text = (json.candidates?.[0]?.content?.parts ?? [])
      .map((part: { text?: string }) => part.text ?? '')
      .join('')
      .trim();

    if (!text) throw new GeminiError(502, 'The AI returned an empty response — please try again.');

    try {
      return JSON.parse(text) as T;
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]) as T;
      throw new GeminiError(502, 'The AI response could not be read — please try again.');
    }
  }

  throw lastError ?? new GeminiError(502, 'AI service unavailable — please try again shortly.');
}
