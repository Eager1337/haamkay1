import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import webpush from 'npm:web-push@3.6.7';
import { requireAdmin, serviceClient } from '../_shared/admin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const adminId = await requireAdmin(req);
    if (!adminId) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const publicKey = Deno.env.get('VAPID_PUBLIC_KEY');
    const privateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const subject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@haamkay.app';
    if (!publicKey || !privateKey) throw new Error('VAPID keys are not configured');
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const { title, body, url, image } = await req.json();
    if (!title) {
      return new Response(JSON.stringify({ error: 'title is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const svc = serviceClient();
    const { data: subs, error } = await svc.from('push_subscribers').select('*');
    if (error) throw error;

    const payload = JSON.stringify({
      title: String(title).slice(0, 120),
      body: String(body ?? '').slice(0, 300),
      url: url ?? '/',
      image: image ?? null,
    });

    let sent = 0;
    const stale: string[] = [];
    await Promise.all((subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) stale.push(s.endpoint);
      }
    }));

    if (stale.length) await svc.from('push_subscribers').delete().in('endpoint', stale);

    return new Response(JSON.stringify({ sent, removed: stale.length, total: subs?.length ?? 0 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-push failed:', err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
