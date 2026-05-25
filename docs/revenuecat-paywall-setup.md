# RevenueCat Paywall Setup for HitItOff Pro

This guide configures the HitItOff Pro subscription paywall in RevenueCat with three plans matching the app theme.

## Product configuration

| Plan | Price | Store product ID | RevenueCat package ID |
|------|-------|------------------|------------------------|
| Weekly | $5.99/wk | `com.luvii.app.weekly` | `weekly` |
| Monthly | $29.99/mo | `com.luvii.app.monthly` | `monthly` |
| Yearly | $119.99/yr | `com.luvii.app.yearly` | `yearly` |

**Entitlement:** `HitItOff Pro` (must match `HITITOFF_PRO_ENTITLEMENT` in `app/utils/constants.ts`)

**Pro features (12 items — keep paywall in sync with `HITITOFF_PRO_FEATURES` in constants):**
Unlimited likes, unlimited messages, 50 mi radius, see who liked you, all photos, compatibility scores, super likes, video intro, boosts, age/compatibility/interest filters, video & Instagram filters, no ads.

**Yearly badge copy:** Best Value — Save 67% (~$9.99/mo vs $29.99/mo)

---

## Step 1: App Store Connect (iOS)

1. Open [App Store Connect](https://appstoreconnect.apple.com) → your app (`com.luvii.app`) → **Subscriptions**.
2. Create a subscription group (e.g. "HitItOff Pro").
3. Add three auto-renewable subscriptions:

   | Reference name | Product ID | Duration | Price |
   |----------------|------------|----------|-------|
   | HitItOff Pro Weekly | `com.luvii.app.weekly` | 1 week | $5.99 |
   | HitItOff Pro Monthly | `com.luvii.app.monthly` | 1 month | $29.99 |
   | HitItOff Pro Yearly | `com.luvii.app.yearly` | 1 year | $119.99 |

4. Submit products for review (or use StoreKit sandbox for testing).

## Step 2: Google Play Console (Android)

1. Open [Google Play Console](https://play.google.com/console) → your app → **Monetize → Subscriptions**.
2. Create three subscriptions with the same product IDs and prices as iOS.

## Step 3: RevenueCat dashboard

1. Go to [RevenueCat](https://app.revenuecat.com) → your HitItOff project.
2. **Products:** Import or add all three store product IDs for iOS and Android.
3. **Entitlements:** Ensure entitlement `HitItOff Pro` is linked to all three products.
4. **Offerings:** In your default offering, add packages:
   - `$rc_weekly` → identifier `weekly` → `com.luvii.app.weekly`
   - `$rc_monthly` → identifier `monthly` → `com.luvii.app.monthly`
   - `$rc_annual` → identifier `yearly` → `com.luvii.app.yearly`

---

## Step 4: Generate paywall with AI

1. RevenueCat dashboard → **Paywalls** → **+ New Paywall**.
2. Select your default offering.
3. Choose **Generate with AI**.
4. Paste the full contents of [`revenuecat-ai-paywall-prompt.txt`](./revenuecat-ai-paywall-prompt.txt).

---

## Step 5: Post-generation tweaks

Run these follow-up prompts in the RevenueCat AI Editor:

1. `Make yearly the default selected package with a 'Best Value — Save 67%' badge. Add a pink border to the yearly card.`
2. `Tighten the feature list spacing. Use green checkmark icons instead of bullet dots.`
3. `Ensure all text meets WCAG contrast on the dark background. Muted text should be #b8a0ad, not gray.`
4. `Add sticky footer with Terms, Privacy, and Restore links.`

Then **Publish** the paywall and attach it to your default offering.

---

## How it connects to the app

The app renders the published paywall remotely via `RevenueCatUI.Paywall` in `app/screens/PaywallScreen.tsx` and `presentHitItOffProPaywall()` in `app/services/revenuecat.ts`. No app rebuild is needed after publishing dashboard changes.

Required env keys (see `.env.example`):

- `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`
- `EXPO_PUBLIC_REVENUECAT_API_KEY` (optional test key)

---

## Checklist

- [ ] iOS subscriptions created in App Store Connect
- [ ] Android subscriptions created in Play Console
- [ ] Products imported into RevenueCat
- [ ] `HitItOff Pro` entitlement linked to all products
- [ ] Offering packages mapped: `weekly`, `monthly`, `yearly`
- [ ] AI paywall generated from prompt file
- [ ] Post-generation tweaks applied
- [ ] Paywall published to default offering
- [ ] Sandbox purchase tested on device
