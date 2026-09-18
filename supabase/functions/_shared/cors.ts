/**
 * Shared HTTP helpers for every Supabase Edge Function in this project.
 *
 * Why this file exists: the functions used to import `corsHeaders` from
 * `npm:@supabase/supabase-js@2/cors`. That subpath export was only added in
 * @supabase/supabase-js 2.95.0, while this repo pins ^2.90.0 (lockfile: 2.90.0).
 * Any bundler that resolves npm: specifiers against the project's node_modules then
 * dies at load time with:
 *
 *   ERR_PACKAGE_PATH_NOT_EXPORTED: Package subpath './cors' is not defined by "exports"
 *
 * ...which shows up in the admin UI as a dead AI button. A plain local module has no
 * version trap, and keeps every function answering preflight with identical headers.
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-retry-count',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Max-Age': '86400',
};

/** JSON response with CORS headers attached. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** The preflight reply, factored out so no function forgets the OPTIONS branch. */
export function preflight(): Response {
  return new Response('ok', { status: 200, headers: corsHeaders });
}
