# Deploying the marketing site on Vercel

This repo has an Expo app at `/` and a Next.js site at `/website`.

## Fix: "No Next.js version detected"

Vercel must build the **website** folder, not the Expo app at the repo root.

### Step 1 — Set Root Directory (required)

1. Open [vercel.com](https://vercel.com) → your **hititoff** project
2. **Settings** → **General**
3. Scroll to **Root Directory** → click **Edit**
4. Type exactly: `website`
5. Click **Save**

### Step 2 — Clear build overrides (if set)

1. **Settings** → **Build and Deployment**
2. Under **Framework Settings**, turn **OFF** any overrides for:
   - Framework Preset (should be **Next.js**)
   - Install Command (leave empty — uses `website/package.json`)
   - Build Command (leave empty — uses `npm run build` in `website/`)
   - Output Directory (leave empty)
3. Click **Save**

### Step 3 — Redeploy

1. **Deployments** tab
2. Click **⋯** on the latest deployment → **Redeploy**
3. Check **Use existing Build Cache** is OFF for the first retry

### What a successful build looks like

```
Detected Next.js version: 16.2.6
Running "npm run build"
Route (app) ... /, /faq, /features, ...
```

Install should show ~360 packages (website only), **not** ~691 (Expo root).

## Environment variables

Set in **Settings** → **Environment Variables**:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SITE_URL` | `https://hititoff.vercel.app` |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | `support@hititoff.app` |

## Domain

Default Vercel URL: **https://hititoff.vercel.app**

When you add a custom domain later (e.g. `hititoff.app`), update `NEXT_PUBLIC_SITE_URL` in Vercel and redeploy.

## Fallback (repo root build)

If you cannot set Root Directory, the root [`vercel.json`](vercel.json) and `next` in root `devDependencies` allow building from the repo root. This is less reliable — **prefer Root Directory = `website`**.
