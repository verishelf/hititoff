# HitItOff Website Deployment

The marketing site lives in `website/` and is a standalone Next.js app.

## Badge assets

Official store badges are vendored in `public/badges/`:

- Apple: [Download on the App Store](https://developer.apple.com/app-store/marketing/guidelines/) (`download-on-the-app-store.svg`)
- Google Play: [Get it on Google Play](https://play.google.com/intl/en_us/badges/) (`google-play.png`)

Do not modify badge artwork per each platform's brand guidelines.

## Local development

```bash
npm run website:dev
```

Or from the `website/` directory:

```bash
npm run dev
```

## Build

```bash
npm run website:build
```

## Vercel deployment

**Root Directory must be `website`.** If you see `No Next.js version detected`, Vercel is building the Expo app at the repo root instead of this Next.js app. Fix: Settings → General → Root Directory → `website` → Save → Redeploy.

See [`../VERCEL.md`](../VERCEL.md) for full steps.

1. Import the repository in [Vercel](https://vercel.com)
2. Set **Root Directory** to `website` (required)
3. Add environment variables from `.env.example`
4. Connect custom domain `hititoff.app` and redirect `www` to apex

## Post-deploy SEO checklist

- Submit `https://hititoff.app/sitemap.xml` in Google Search Console
- Validate structured data at https://search.google.com/test/rich-results
- Test Open Graph previews (home page uses generated OG image)
- Add property in Bing Webmaster Tools
- When App Store / Play Store listings go live, set `NEXT_PUBLIC_IOS_APP_STORE_URL` and `NEXT_PUBLIC_ANDROID_PLAY_STORE_URL`
