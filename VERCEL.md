# Deploying the marketing site on Vercel

This repo contains two apps:

| Path | App |
|------|-----|
| `/` | Expo mobile app (React Native) — **not** a Vercel project |
| `/website` | Next.js marketing site — **deploy this on Vercel** |

## Required: set Root Directory

If Vercel shows **"No Next.js version detected"**, the project Root Directory is wrong.

1. Open your Vercel project → **Settings** → **General**
2. Find **Root Directory** → click **Edit**
3. Enter: `website`
4. Click **Save**
5. Go to **Deployments** → **Redeploy** the latest deployment

Vercel must use `website/package.json` (which includes `next`), not the Expo `package.json` at the repo root.

## Environment variables

Set these in Vercel → **Settings** → **Environment Variables**:

```
NEXT_PUBLIC_SITE_URL=https://hititoff.app
NEXT_PUBLIC_SUPPORT_EMAIL=support@hititoff.app
NEXT_PUBLIC_WAITLIST_FORM_ENDPOINT=
NEXT_PUBLIC_IOS_APP_STORE_URL=
NEXT_PUBLIC_ANDROID_PLAY_STORE_URL=
```

## Domain

Add `hititoff.app` under **Settings** → **Domains** and redirect `www` to the apex domain.
