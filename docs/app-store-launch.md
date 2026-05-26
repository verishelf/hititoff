# App Store Launch Checklist

HitItOff is build-ready via EAS. Complete these steps to go live on iOS and Android.

## 1. Build & submit

```bash
# iOS production build
npm run build:ios

# Android production build
npm run build:android

# Submit after builds complete
eas submit --platform ios
eas submit --platform android
```

## 2. Store listing copy (short)

**Subtitle:** Better Matches, Closer

**Description (promotional):**
HitItOff is the AI-coached compatibility dating app — built for people who want more than prompts and guesswork. Take a personality quiz, see transparent compatibility scores, set your vibe for the day, and get built-in conversation coaching: temperature scores, profile reviews, reply suggestions with explanations, and date planning. No screenshots. No switching apps. No Hinge + Hitch stack.

**Tagline vs Hinge (optional marketing):**
Hinge helps you start a conversation. HitItOff helps you choose better matches, read the chat, and get to the date.

**Keywords:** dating, compatibility, AI coach, Hinge alternative, local dating, personality quiz, conversation coach, chemistry dating

**Pro highlights:** Unlimited AI coach, practice mode, 50 mi radius, chemistry analytics, video intro

## 3. Website store links

Set these in Vercel (or `.env.local` for the marketing site):

```
NEXT_PUBLIC_IOS_APP_STORE_URL=https://apps.apple.com/app/idXXXXXXXXX
NEXT_PUBLIC_ANDROID_PLAY_STORE_URL=https://play.google.com/store/apps/details?id=com.luvii.app
```

Store badges on [hititoff.vercel.app](https://hititoff.vercel.app) automatically link live when URLs are set.

## 4. Supabase edge functions

Deploy new AI coaching functions:

```bash
supabase functions deploy ai-conversation-coach
supabase functions deploy ai-profile-coach
supabase functions deploy ai-practice-mode
supabase functions deploy verification-webhook
supabase functions deploy ai-moderate
supabase functions deploy ai-date-suggestions
```

Set secrets:

```bash
supabase secrets set OPENAI_API_KEY=sk-xxx
supabase secrets set VERIFICATION_WEBHOOK_SECRET=your-secret
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx  # for verification webhook only
```

## 5. Verification approval (admin)

Approve or reject selfie verification via webhook:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/verification-webhook" \
  -H "Content-Type: application/json" \
  -H "x-verification-secret: $VERIFICATION_WEBHOOK_SECRET" \
  -d '{"user_id":"<uuid>","action":"approve"}'
```

## 6. Post-launch FAQ

Update [website/src/lib/faq-data.ts](../website/src/lib/faq-data.ts) availability answer once live:

> HitItOff is available on iOS and Android. Download from the App Store or Google Play.
