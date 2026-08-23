# Base44 Dev Environment

## Stack
- **Frontend only**: Vite + React + TypeScript + shadcn-ui + Tailwind CSS
- **Backend**: Remote hosted Supabase instance (not run locally)
- **Package manager**: npm (both `package-lock.json` and `bun.lock` exist; npm is used in compose)

## Running
```sh
docker compose -f docker-compose.base44.yml up -d
```
- Vite dev server runs on container port 8080, mapped to host port 3000.
- Source is bind-mounted; edits hot-reload via Vite HMR.
- Dependencies are installed at container startup (`npm install`).

## Environment / Secrets
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are committed in `.env` (public anon key — safe for frontend).
- No external secrets required to boot. `/run/base44/app.env` is wired as a fallback env_file in case additional secrets are added later.

## Verification
- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` returns the app HTML.
- Vite config has `allowedHosts: true` so the preview proxy hostname is accepted.

## Notes
- Supabase edge functions live in `supabase/functions/` but run on the hosted Supabase project, not locally.
- `src/index.css`: the Google Fonts `@import` must come before `@tailwind` directives (CSS spec requires `@import` first).
