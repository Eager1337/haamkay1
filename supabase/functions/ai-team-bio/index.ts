import { jsonResponse, preflight } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/admin.ts';
import { geminiGenerateText, GeminiError } from '../_shared/gemini.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return preflight();

  try {
    const adminId = await requireAdmin(req);
    if (!adminId) return jsonResponse({ error: 'Admin access required' }, 401);

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('ai-team-bio: GEMINI_API_KEY secret is not set');
      return jsonResponse({ error: 'AI is not configured yet — add a GEMINI_API_KEY secret to this Supabase project.' }, 400);
    }

    const body = await req.json();
    const name = String(body?.name ?? '').slice(0, 120);
    const role = String(body?.role ?? '').slice(0, 120);
    const notes = String(body?.notes ?? '').slice(0, 1000);
    if (!name) return jsonResponse({ error: 'Name is required' }, 400);

    try {
      const bio = await geminiGenerateText(
        apiKey,
        'You write short, warm, professional team bios for Haamkay Enterprises, a luxury retail store in Freetown, Sierra Leone. 2-3 sentences, third person, no placeholders.',
        `Name: ${name}\nRole: ${role || 'Team member'}\nNotes: ${notes || 'none'}\n\nWrite the bio only.`,
      );
      return jsonResponse({ bio });
    } catch (err) {
      if (err instanceof GeminiError) return jsonResponse({ error: err.message }, err.status);
      console.error('ai-team-bio generation failed:', err);
      return jsonResponse({ error: 'The AI could not write a bio right now — please try again.' }, 502);
    }
  } catch (err) {
    console.error('ai-team-bio failed:', err);
    // Do not forward raw exception text to the browser: it can carry upstream detail
    // (request ids, key prefixes) that admins have no way to act on.
    return jsonResponse({ error: 'Service error - please try again' }, 500);
  }
});
