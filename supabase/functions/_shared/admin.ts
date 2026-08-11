import { createClient } from 'npm:@supabase/supabase-js@2';

export function serviceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
}

/** Returns the admin user id, or null when the caller is not an authenticated admin. */
export async function requireAdmin(req: Request): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  const svc = serviceClient();
  const { data: userData, error } = await svc.auth.getUser(token);
  if (error || !userData.user) return null;

  const { data: role } = await svc
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id)
    .eq('role', 'admin')
    .maybeSingle();

  return role ? userData.user.id : null;
}
