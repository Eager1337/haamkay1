import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { serviceClient } from '../_shared/admin.ts';

interface IncomingItem {
  product_id?: string | null;
  name?: string;
  price?: number;
  quantity?: number;
  image_url?: string | null;
}

const clean = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;
    const guestToken = clean(body?.guest_token, 100);
    if (!guestToken) return json({ error: 'Missing guest token' }, 400);

    const svc = serviceClient();

    if (action === 'list') {
      const { data: orders, error } = await svc
        .from('orders')
        .select('*, order_items(*)')
        .eq('guest_token', guestToken)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) return json({ error: error.message }, 500);
      return json({ orders: orders ?? [] });
    }

    if (action !== 'create') return json({ error: 'Unknown action' }, 400);

    const customerName = clean(body?.customer_name, 120);
    const phone = clean(body?.phone, 40);
    const address = clean(body?.address, 400);
    const note = clean(body?.note, 500);
    const items: IncomingItem[] = Array.isArray(body?.items) ? body.items.slice(0, 100) : [];

    if (customerName.length < 2) return json({ error: 'Please enter your name' }, 400);
    if (phone.replace(/\D/g, '').length < 6) return json({ error: 'Please enter a valid phone number' }, 400);
    if (!items.length) return json({ error: 'Your order is empty' }, 400);

    const normalized = items.map((i) => ({
      product_id: i.product_id && /^[0-9a-f-]{36}$/i.test(i.product_id) ? i.product_id : null,
      name: clean(i.name, 200) || 'Product',
      price: Number.isFinite(Number(i.price)) ? Math.max(0, Number(i.price)) : 0,
      quantity: Math.min(999, Math.max(1, Math.round(Number(i.quantity) || 1))),
      image_url: clean(i.image_url, 1000) || null,
    }));

    const total = normalized.reduce((s, i) => s + i.price * i.quantity, 0);
    const orderNumber = `HK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

    const { data: order, error: orderErr } = await svc
      .from('orders')
      .insert({
        order_number: orderNumber,
        guest_token: guestToken,
        customer_name: customerName,
        phone,
        address: address || null,
        note: note || null,
        total,
        status: 'pending',
      })
      .select()
      .single();

    if (orderErr) return json({ error: orderErr.message }, 500);

    const { error: itemsErr } = await svc
      .from('order_items')
      .insert(normalized.map((i) => ({ ...i, order_id: order.id })));
    if (itemsErr) return json({ error: itemsErr.message }, 500);

    // Alert the shop in the in-site notification feed
    await svc.from('notifications').insert({
      type: 'order',
      title: `New order ${orderNumber}`,
      body: `${customerName} ordered ${normalized.length} item(s) — Le ${Math.round(total).toLocaleString()}`,
    });

    return json({ order: { ...order, order_items: normalized } });
  } catch (err) {
    console.error('orders function failed:', err);
    return json({ error: (err as Error).message }, 500);
  }
});
