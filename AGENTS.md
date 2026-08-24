# Base44 Dev Environment

## Stack
- **Frontend**: Vite + React + TypeScript + shadcn-ui + Tailwind CSS
- **Backend**: Remote hosted Supabase instance (not run locally)
- **AI Backend** (dev only): Small Express service (`server/`) that proxies AI calls to OpenAI, so the AI Listing Studio works in the preview without deploying edge functions
- **Package manager**: npm

## Running
```sh
docker compose -f docker-compose.base44.yml up -d
```
- **web** (Vite dev server): container port 8080 → host port 3000. Source bind-mounted; edits hot-reload via Vite HMR.
- **backend** (Express): container port 3001 (internal only). Vite proxies `/api/*` to `http://backend:3001`.
- Dependencies installed at startup (`npm install`).

## Environment / Secrets
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are committed in `.env` (public anon key — safe for frontend).
- `OPENAI_API_KEY` — required for the AI Listing Studio. Delivered via `/run/base44/app.env`; wired into both the `backend` service (dev) and the edge function (production).
- `/run/base44/app.env` is wired as `env_file` in both services.

## AI Listing Studio
- In **dev** (preview): `src/lib/ai-api.ts` calls `/api/ai-product-draft` → Vite proxy → `backend` service → OpenAI API (`gpt-4o`).
- In **production**: falls back to `supabase.functions.invoke('ai-product-draft')`. The edge function (`supabase/functions/ai-product-draft/index.ts`) also uses OpenAI directly — deploy it and set `OPENAI_API_KEY` as a Supabase secret.

## PWA / Download
- `public/manifest.json` + `public/icon.svg` make the app installable as a PWA.
- `public/sw.js` has install/activate/fetch handlers (PWA installability) + push notification handlers.
- `src/lib/pwa-install.ts` captures `beforeinstallprompt`; download buttons in `DownloadSection.tsx` trigger the install prompt.
- Service worker registered in `src/main.tsx`.

## Verification
- `curl -sf -H "Host: external-preview.example.com" http://localhost:3000/` returns the app HTML.
- Vite config has `allowedHosts: true` so the preview proxy hostname is accepted.
- Backend health: `curl -sf http://localhost:3000/api/ai-product-draft -X POST -H 'Content-Type: application/json' -d '{"images":[]}'` returns 400 (expected — no images).

## Notes
- Supabase edge functions live in `supabase/functions/` but run on the hosted Supabase project, not locally.
- `src/index.css`: the Google Fonts `@import` must come before `@tailwind` directives (CSS spec requires `@import` first).
