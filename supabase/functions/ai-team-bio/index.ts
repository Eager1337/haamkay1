import { corsHeaders } from '../_shared/cors.ts';
import { requireAdmin } from '../_shared/admin.ts';
import { geminiGenerateText, GeminiError } from '../_shared/gemini.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const adminId = await requireAdmin(req);
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const body = await req.json();
    const name = String(body?.name ?? '').slice(0, 120);
    const role = String(body?.role ?? '').slice(0, 120);
    const notes = String(body?.notes ?? '').slice(0, 1000);
    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const bio = await geminiGenerateText(
        apiKey,
        'You write short, warm, professional team bios for Haamkay Enterprises, a luxury retail store in Freetown, Sierra Leone. 2-3 sentences, third person, no placeholders.',
        `Name: ${name}\nRole: ${role || 'Team member'}\nNotes: ${notes || 'none'}\n\nWrite the bio only.`,
      );
      return new Response(JSON.stringify({ bio }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      if (err instanceof GeminiError) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: err.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw err;
    }
  } catch (err) {
    console.error('ai-team-bio failed:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
