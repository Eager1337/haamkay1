import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { requireAdmin } from '../_shared/admin.ts';

/**
 * Posts a message to the team Slack channel.
 * Configure the SLACK_WEBHOOK_URL secret with an incoming-webhook URL.
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const adminId = await requireAdmin(req);
    if (!adminId) return json({ error: 'Admin access required' }, 401);

    const webhook = Deno.env.get('SLACK_WEBHOOK_URL');
    if (!webhook) return json({ skipped: true, reason: 'Slack is not configured yet' });

    const body = await req.json().catch(() => ({}));
    const event = String(body?.event ?? 'update').slice(0, 60);
    const title = String(body?.title ?? 'Haamkay store update').slice(0, 200);
    const detail = String(body?.detail ?? '').slice(0, 1000);
    const link = typeof body?.link === 'string' ? body.link.slice(0, 500) : '';

    const emoji = event === 'duplicate_flagged' ? ':warning:' : ':package:';
    const text = `${emoji} *${title}*${detail ? `\n${detail}` : ''}${link ? `\n<${link}|Open in store>` : ''}`;

    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return json({ error: `Slack ${res.status}: ${(await res.text()).slice(0, 200)}` }, 502);

    return json({ ok: true });
  } catch (err) {
    console.error('slack-notify failed:', err);
    return json({ error: (err as Error).message }, 500);
  }
});
