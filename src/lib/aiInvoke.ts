import { supabase } from '@/integrations/supabase/client';

/**
 * Calls an AI edge function and always surfaces the real error message.
 * `supabase.functions.invoke` hides the JSON error body behind a generic
 * "Edge Function returned a non-2xx status code" message; this unwraps it.
 */
export async function invokeAI<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please sign in as an admin to use the AI tools.');

  const { data, error } = await supabase.functions.invoke<T & { error?: string }>(name, { body });

  if (error) {
    let message = '';
    const ctx = (error as { context?: unknown }).context;
    if (ctx instanceof Response) {
      try {
        const text = await ctx.clone().text();
        try { message = String(JSON.parse(text)?.error ?? ''); } catch { message = text.slice(0, 300); }
      } catch { /* ignore */ }
      if (!message && ctx.status === 404) message = `The "${name}" AI function is not deployed yet.`;
      if (!message && ctx.status === 401) message = 'Admin access required — please sign in again.';
    }
    if (!message && /Failed to fetch|NetworkError|Failed to send/i.test(error.message ?? '')) {
      message = 'Could not reach the AI service. Check your connection and try again.';
    }
    throw new Error(message || error.message || 'AI request failed.');
  }

  if (data && typeof data === 'object' && 'error' in data && data.error) throw new Error(String(data.error));
  if (data == null) throw new Error('The AI returned an empty response.');
  return data as T;
}
