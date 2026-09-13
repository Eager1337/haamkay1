import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Bell, Box, CheckCircle2, CircleDollarSign, PackagePlus,
  RefreshCw, Search, ShoppingBag, SlidersHorizontal, TriangleAlert,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';

type ActivityKind = 'order' | 'catalog' | 'alert';

interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  timestamp: string;
  status?: string;
  value?: number;
}

const kindConfig = {
  order: { label: 'Orders', icon: ShoppingBag, classes: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20' },
  catalog: { label: 'Catalog', icon: PackagePlus, classes: 'bg-amber-300/10 text-amber-200 border-amber-300/20' },
  alert: { label: 'Alerts', icon: Bell, classes: 'bg-sky-400/10 text-sky-300 border-sky-400/20' },
};

const relativeTime = (value: string) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
};

const AdminActivity = () => {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | ActivityKind>('all');

  const loadActivity = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [orders, products, notifications] = await Promise.all([
      supabase.from('orders').select('id, order_number, customer_name, total, status, created_at').order('created_at', { ascending: false }).limit(30),
      supabase.from('products').select('id, name, category, stock, created_at').order('created_at', { ascending: false }).limit(30),
      supabase.from('notifications').select('id, title, type, created_at').order('created_at', { ascending: false }).limit(30),
    ]);

    const firstError = orders.error ?? products.error ?? notifications.error;
    if (firstError) {
      setError('Recent activity could not be loaded. Check your connection and try again.');
      setLoading(false);
      return;
    }

    const merged: ActivityItem[] = [
      ...(orders.data ?? []).map(order => ({
        id: `order-${order.id}`,
        kind: 'order' as const,
        title: `Order ${order.order_number}`,
        detail: `${order.customer_name} placed an order`,
        timestamp: order.created_at,
        status: order.status,
        value: Number(order.total),
      })),
      ...(products.data ?? []).map(product => ({
        id: `product-${product.id}`,
        kind: 'catalog' as const,
        title: product.name,
        detail: `${product.category} · ${product.stock} in stock`,
        timestamp: product.created_at,
      })),
      ...(notifications.data ?? []).map(notification => ({
        id: `alert-${notification.id}`,
        kind: 'alert' as const,
        title: notification.title,
        detail: `${notification.type.replaceAll('_', ' ')} notification sent`,
        timestamp: notification.created_at,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    setItems(merged.slice(0, 60));
    setLoading(false);
  }, []);

  useEffect(() => { loadActivity(); }, [loadActivity]);

  const visibleItems = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items.filter(item =>
      (filter === 'all' || item.kind === filter) &&
      (!needle || `${item.title} ${item.detail} ${item.status ?? ''}`.toLowerCase().includes(needle)),
    );
  }, [filter, items, query]);

  const todayCount = items.filter(item => Date.now() - new Date(item.timestamp).getTime() < 86400000).length;
  const orderValue = items.filter(item => item.kind === 'order').reduce((sum, item) => sum + (item.value ?? 0), 0);

  return (
    <AdminLayout
      title="Activity Log"
      subtitle="A live pulse of orders, catalog additions and customer alerts."
      actions={
        <button onClick={loadActivity} disabled={loading} className="btn-outline-gold !px-4 !py-2 inline-flex items-center gap-2 disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      }
    >
      <section className="relative overflow-hidden rounded-3xl border border-gold/20 bg-gradient-card p-5 sm:p-7 mb-6">
        <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">
              <Activity className="h-3.5 w-3.5" /> Store pulse
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted-foreground">Track the moments that move the store, without jumping between admin tools.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <p className="text-2xl font-semibold text-foreground">{todayCount}</p>
              <p className="text-xs text-muted-foreground">events in 24 hours</p>
            </div>
            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <p className="text-2xl font-semibold text-gold">Le {Math.round(orderValue).toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">recent order value</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <span className="sr-only">Search activity</span>
          <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search activity…" className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm outline-none transition focus:border-gold/60 focus:ring-2 focus:ring-gold/10" />
        </label>
        <div className="flex items-center gap-2 overflow-x-auto" aria-label="Filter activity">
          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
          {(['all', 'order', 'catalog', 'alert'] as const).map(value => (
            <button key={value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm capitalize transition ${filter === value ? 'bg-gold text-teal-darker' : 'bg-card text-muted-foreground hover:text-foreground'}`}>
              {value === 'all' ? 'All events' : kindConfig[value].label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3" aria-label="Loading activity">
          {[0, 1, 2, 3].map(index => <div key={index} className="h-24 animate-pulse rounded-2xl border border-border bg-card/70" />)}
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center">
          <TriangleAlert className="mx-auto mb-3 h-7 w-7 text-destructive" />
          <p className="mb-4 text-sm text-muted-foreground">{error}</p>
          <button onClick={loadActivity} className="btn-outline-gold !px-4 !py-2">Try again</button>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <Box className="mx-auto mb-3 h-8 w-8 text-gold/70" />
          <h2 className="text-lg font-semibold">No matching activity</h2>
          <p className="mt-1 text-sm text-muted-foreground">Try a different search or event filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card/50">
          {visibleItems.map((item, index) => {
            const config = kindConfig[item.kind];
            const Icon = config.icon;
            return (
              <motion.article key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.025, 0.3) }} className="group grid grid-cols-[auto_1fr] gap-3 border-b border-border p-4 last:border-0 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-4 sm:p-5">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${config.classes}`}><Icon className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-semibold text-foreground">{item.title}</h2>
                    {item.status && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{item.status}</span>}
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <div className="col-start-2 flex items-center gap-3 sm:col-auto sm:text-right">
                  {item.value !== undefined && <span className="inline-flex items-center gap-1 text-xs font-medium text-gold"><CircleDollarSign className="h-3.5 w-3.5" /> Le {Math.round(item.value).toLocaleString()}</span>}
                  <time className="text-xs text-muted-foreground" dateTime={item.timestamp} title={new Date(item.timestamp).toLocaleString()}>{relativeTime(item.timestamp)}</time>
                  <CheckCircle2 className="hidden h-4 w-4 text-gold/0 transition group-hover:text-gold/50 sm:block" />
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminActivity;
