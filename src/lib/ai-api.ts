import { supabase } from '@/integrations/supabase/client';

/**
 * Calls the AI product-draft endpoint.
 * In dev (Vite preview) it hits the local backend via the /api proxy.
 * In production it calls the Supabase edge function.
 */
export async function invokeAIProductDraft(body: { images: string[]; categories: string[] }) {
  if (import.meta.env.DEV) {
    const res = await fetch('/api/ai-product-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(err.error || `AI error ${res.status}`);
    }
    return res.json();
  }
  const { data, error } = await supabase.functions.invoke('ai-product-draft', { body });
  if (error) throw error;
  return data;
}
