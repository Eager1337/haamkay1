// Direct Google Gemini API client (no third-party gateway).
// Requires a GEMINI_API_KEY secret from https://aistudio.google.com/app/apikey

// Current stable production models for multimodal listing/image work.
// gemini-2.5-flash was retired for new users (Google returns 404 pointing at
// gemini-3.6-flash), so the 3.x generation leads every list below.
export const GEMINI_TEXT_MODEL = 'gemini-3.6-flash';
export const GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image';

// Models are tried in order until one answers. Google retires model ids and keys are not
// enrolled in every model, so a hard single-model dependency turns into an opaque
// "AI service unavailable" for the admin. Keep the first entry the preferred model.
export const GEMINI_TEXT_MODEL_FALLBACKS = [
  GEMINI_TEXT_MODEL,
  'gemini-3.1-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.0-flash',
];

// Image generation uses only current image-capable model ids. Retired 2.5 ids are
// intentionally excluded so admin image tools do not waste requests on known 404s.
export const GEMINI_IMAGE_MODEL_FALLBACKS = [
  GEMINI_IMAGE_MODEL,
  'gemini-3.1-flash-image-preview',
];

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

// The admin UI caps uploads at 10MB; give the AI client a little headroom so an oversized
// object fails with a clear message instead of stalling the function while base64-encoding
// (batch runs hold several images in memory at once).
export const MAX_SOURCE_BYTES = 12 * 1024 * 1024;

// Source images live in Supabase storage; a hung fetch would otherwise burn the whole
// function wall-clock budget and take the rest of the batch with it.
const SOURCE_FETCH_TIMEOUT_MS = 20_000;

const RETRY_DELAY_MS = 1200;

// Production deployment: this shared client is deployed with ai-product-draft to the frontend's Supabase project.
export class GeminiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
  }
}

function friendlyStatus(status: number): { status: number; message: string } {
  if (status === 401) return { status, message: 'Gemini API key is invalid or expired. Update the GEMINI_API_KEY secret.' };
  if (status === 403) return { status, message: 'The Gemini API key does not have permission to use this model.' };
  if (status === 404) return { status: 502, message: 'The AI model requested by this function no longer exists. Try again in a moment.' };
  if (status === 429) return { status: 429, message: 'Gemini rate limit reached. Please wait a moment and try again.' };
  if (status === 400) return { status: 400, message: 'The AI could not process that image. Try a clear JPG or PNG under 10MB.' };
  return { status: 502, message: 'AI service unavailable. Please try again shortly.' };
}

/**
 * Statuses that mean "this model, not this request" — worth trying the next fallback
 * instead of failing the whole call.
 */
function isModelMismatch(status: number): boolean {
  return status === 403 || status === 404;
}

/**
 * Transient upstream problems worth one retry on the same model.
 */
function isTransient(status: number): boolean {
  return status === 400 || status === 408 || status === 429 || status >= 500;
}

/**
 * The key travels in a header, never in the query string: `?key=…` ends up verbatim in
 * Supabase function logs, proxy access logs and any error text that echoes the request URL.
 */
function geminiHeaders(apiKey: string): Record<string, string> {
  return { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey };
}

function callGemini(apiKey: string, model: string, payload: Record<string, unknown>): Promise<Response> {
  return fetch(`${BASE_URL}/${model}:generateContent`, {
    method: 'POST',
    headers: geminiHeaders(apiKey),
    body: JSON.stringify(payload),
  });
}

/** Explains an empty or refused completion instead of reporting a vague "no image" error. */
function refusalReason(json: any, kind: 'image' | 'text'): string {
  const feedback = json?.promptFeedback ?? json?.prompt_feedback;
  const blocked = feedback?.blockReason ?? feedback?.block_reason;
  if (blocked) {
    const reason = String(blocked).toLowerCase().replace(/_/g, ' ');
    return `The AI declined this request (safety: ${reason}). Try a clearer photo or different wording.`;
  }
  const candidate = json?.candidates?.[0];
  const finish = candidate?.finishReason ?? candidate?.finish_reason;
  if (finish && finish !== 'STOP') return `The AI stopped before answering (${String(finish).toLowerCase().replace(/_/g, ' ')}). Please try again.`;
  if (!json?.candidates?.length) return 'The AI did not return a result. Please try again.';
  return kind === 'image'
    ? 'The AI did not return an image — please try again.'
    : 'The AI returned an empty response — please try again.';
}

/** Reads the `{ error: ... }` body Google returns, for logs only. */
async function readErrorBody(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 2000);
  } catch {
    return '<unreadable response body>';
  }
}

export async function fetchAsInlineData(url: string): Promise<{ data: string; mimeType: string }> {
  if (url.startsWith('data:')) {
    const [header, data] = url.slice(5).split(',');
    const [mimeType, ...params] = (header ?? '').split(';');
    if (!params.includes('base64')) throw new Error('Inline images must be base64-encoded data URLs.');
    if (!mimeType?.startsWith('image/')) throw new Error('The uploaded file is not a supported image.');
    // 4 base64 chars ≈ 3 bytes; guard the payload the same way as a fetched object.
    if (Math.floor(data.length / 4) * 3 > MAX_SOURCE_BYTES) {
      throw new Error('That image is too large for the AI (max 12MB). Use a smaller JPG or PNG.');
    }
    return { data, mimeType };
  }

  const res = await fetch(url, { signal: AbortSignal.timeout(SOURCE_FETCH_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`Could not fetch source image (${res.status})`);
  const mimeType = (res.headers.get('content-type') || 'image/png').split(';')[0];
  if (!mimeType.startsWith('image/')) throw new Error('The uploaded file is not a supported image.');
  const declared = Number(res.headers.get('content-length') ?? 0);
  if (declared > MAX_SOURCE_BYTES) throw new Error('That image is too large for the AI (max 12MB). Use a smaller JPG or PNG.');

  const bytes = new Uint8Array(await res.arrayBuffer());
  if (bytes.byteLength > MAX_SOURCE_BYTES) throw new Error('That image is too large for the AI (max 12MB). Use a smaller JPG or PNG.');
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { data: btoa(binary), mimeType };
}

export async function geminiGenerateImage(
  apiKey: string,
  source: { data: string; mimeType: string },
  prompt: string,
): Promise<{ data: string; mimeType: string; text: string }> {
  let lastError: GeminiError | null = null;

  for (const model of GEMINI_IMAGE_MODEL_FALLBACKS) {
    const res = await callGemini(apiKey, model, {
      contents: [{ role: 'user', parts: [{ text: prompt }, { inlineData: { mimeType: source.mimeType, data: source.data } }] }],
      generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
    });

    if (res.status === 401) {
      console.error(`Gemini auth rejected while calling ${model}: ${await readErrorBody(res)}`);
      throw new GeminiError(401, friendlyStatus(401).message);
    }
    if (isModelMismatch(res.status)) {
      console.error(`Gemini image model ${model} unavailable [${res.status}]: ${await readErrorBody(res)}`);
      lastError = new GeminiError(502, friendlyStatus(res.status).message);
      continue; // try the next fallback model
    }
    if (!res.ok) {
      console.error(`Gemini image error [${res.status}] on ${model}: ${await readErrorBody(res)}`);
      const { status, message } = friendlyStatus(res.status);
      throw new GeminiError(status, message);
    }

    const json = await res.json();
    const parts: Array<Record<string, unknown>> = json.candidates?.[0]?.content?.parts ?? [];
    let text = '';
    for (const part of parts) {
      const inline = (part.inlineData ?? part.inline_data) as { data?: string; mimeType?: string; mime_type?: string } | undefined;
      if (inline?.data) return { data: inline.data, mimeType: inline.mimeType ?? inline.mime_type ?? 'image/png', text };
      if (typeof part.text === 'string') text += part.text;
    }
    // We reached the model and it answered without an image — a second model would refuse
    // the same way, so surface the actual reason instead of retrying and burning quota.
    throw new GeminiError(502, refusalReason(json, 'image'));
  }

  throw lastError ?? new GeminiError(502, 'No supported Gemini image model is available for this API key.');
}

export async function geminiGenerateText(apiKey: string, systemPrompt: string, userPrompt: string): Promise<string> {
  let lastError: GeminiError | null = null;

  for (const model of GEMINI_TEXT_MODEL_FALLBACKS) {
    const res = await callGemini(apiKey, model, {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    });

    if (res.status === 401) {
      console.error(`Gemini auth rejected while calling ${model}: ${await readErrorBody(res)}`);
      throw new GeminiError(401, friendlyStatus(401).message);
    }
    if (isModelMismatch(res.status)) {
      console.error(`Gemini text model ${model} unavailable [${res.status}]: ${await readErrorBody(res)}`);
      lastError = new GeminiError(502, friendlyStatus(res.status).message);
      continue;
    }
    if (!res.ok) {
      console.error(`Gemini text error [${res.status}] on ${model}: ${await readErrorBody(res)}`);
      const { status, message } = friendlyStatus(res.status);
      throw new GeminiError(status, message);
    }

    const json = await res.json();
    const text = (json.candidates?.[0]?.content?.parts ?? [])
      .map((p: { text?: string }) => p.text ?? '')
      .join('')
      .trim();
    // An empty string used to be returned as a success, which rendered a blank AI bio.
    if (!text) throw new GeminiError(502, refusalReason(json, 'text'));
    return text;
  }

  throw lastError ?? new GeminiError(502, 'No supported Gemini text model is available for this API key.');
}

export async function geminiGenerateJSON<T>(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string,
  images: Array<{ data: string; mimeType: string }>,
  responseSchema: Record<string, unknown>,
): Promise<T> {
  const parts: Array<Record<string, unknown>> = [{ text: userPrompt }];
  for (const image of images) parts.push({ inlineData: { mimeType: image.mimeType, data: image.data } });
  let lastError: GeminiError | null = null;

  for (const model of GEMINI_TEXT_MODEL_FALLBACKS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const res = await callGemini(apiKey, model, {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json', responseSchema },
      });

      if (res.status === 401) {
        console.error(`Gemini auth rejected while calling ${model}: ${await readErrorBody(res)}`);
        throw new GeminiError(401, friendlyStatus(401).message);
      }
      if (isModelMismatch(res.status)) {
        console.error(`Gemini JSON model ${model} unavailable [${res.status}]: ${await readErrorBody(res)}`);
        lastError = new GeminiError(502, friendlyStatus(res.status).message);
        break; // next model — a model mismatch will not fix itself on a retry
      }
      if (isTransient(res.status)) {
        const details = await readErrorBody(res);
        console.error(`Gemini temporary error [${res.status}] on ${model}: ${details}`);
        lastError = new GeminiError(res.status, friendlyStatus(res.status).message);
        if (attempt === 0) await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        continue;
      }
      if (!res.ok) {
        console.error(`Gemini JSON error [${res.status}] on ${model}: ${await readErrorBody(res)}`);
        const { status, message } = friendlyStatus(res.status);
        throw new GeminiError(status, message);
      }

      const json = await res.json();
      const text = (json.candidates?.[0]?.content?.parts ?? [])
        .map((part: { text?: string }) => part.text ?? '')
        .join('')
        .trim();
      if (!text) throw new GeminiError(502, refusalReason(json, 'text'));
      try {
        return JSON.parse(text) as T;
      } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]) as T;
        throw new GeminiError(502, 'The AI response could not be read — please try again.');
      }
    }
  }

  throw lastError ?? new GeminiError(502, 'AI service unavailable — please try again shortly.');
}
