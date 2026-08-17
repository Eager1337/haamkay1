import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { requireAdmin } from '../_shared/admin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const adminId = await requireAdmin(req);
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) throw new Error('LOVABLE_API_KEY is not configured');

    const body = await req.json();
    const name = String(body?.name ?? '').slice(0, 120);
    const role = String(body?.role ?? '').slice(0, 120);
    const notes = String(body?.notes ?? '').slice(0, 1000);
    if (!name) {
      return new Response(JSON.stringify({ error: 'Name is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3.5-flash',
        messages: [
          { role: 'system', content: 'You write short, warm, professional team bios for Haamkay Enterprises, a luxury retail store in Freetown, Sierra Leone. 2-3 sentences, third person, no placeholders.' },
          { role: 'user', content: `Name: ${name}\nRole: ${role || 'Team member'}\nNotes: ${notes || 'none'}\n\nWrite the bio only.` },
        ],
      }),
    });

    if (!res.ok) {
      const details = await res.text();
      return new Response(JSON.stringify({ error: `AI error ${res.status}`, details }), {
        status: res.status === 429 || res.status === 402 ? res.status : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const json = await res.json();
    const bio = json.choices?.[0]?.message?.content ?? '';
    return new Response(JSON.stringify({ bio }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('ai-team-bio failed:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
