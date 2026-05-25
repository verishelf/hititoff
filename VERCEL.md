# Deploying the marketing site on Vercel

This repo contains two apps:

| Path | App |
|------|-----|
| `/` | Expo mobile app (React Native) |
| `/website` | Next.js marketing site ← **deploy this** |

## Option A — Recommended (simplest)

1. Vercel project → **Settings** → **General**
2. **Root Directory** → **Edit** → type `website` → **Save**
3. **Deployments** → **Redeploy**

Vercel will use `website/package.json` and `website/vercel.json` automatically.

## Option B — Build from repo root

If Root Directory is left as `.`, the repo includes a root [`vercel.json`](vercel.json) that:

- Installs dependencies in `website/`
- Runs `npm run build --prefix website`
- Uses `next` in root `devDependencies` so Vercel detects the framework version

After pulling latest, **Redeploy** without changing settings.

## If you still see "No Next.js version detected"

1. Confirm the latest commit is deployed (includes root `vercel.json`)
2. Go to **Settings** → **General** → **Framework Preset** → set to **Next.js**
3. Go to **Settings** → **Build & Deployment** and verify:
   - **Install Command:** `npm install --prefix website` (or leave empty if Root Directory is `website`)
   - **Build Command:** `npm run build --prefix website` (or leave empty if Root Directory is `website`)
4. **Redeploy**

## Environment variables

```
NEXT_PUBLIC_SITE_URL=https://hititoff.app
NEXT_PUBLIC_SUPPORT_EMAIL=support@hititoff.app
NEXT_PUBLIC_WAITLIST_FORM_ENDPOINT=
NEXT_PUBLIC_IOS_APP_STORE_URL=
NEXT_PUBLIC_ANDROID_PLAY_STORE_URL=
```

## Domain

Add `hititoff.app` under **Settings** → **Domains**.
