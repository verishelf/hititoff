# RevenueCat Paywall Setup for HitItOff Pro

This guide configures the HitItOff Pro subscription paywall in RevenueCat with three plans matching the app theme.

## Product configuration

| Plan | Price | Store product ID | RevenueCat package ID |
|------|-------|------------------|------------------------|
| Weekly | $5.99/wk | `com.luvii.app.weekly` | `weekly` |
| Monthly | $29.99/mo | `com.luvii.app.monthly` | `monthly` |
| Yearly | $119.99/yr | `com.luvii.app.yearly` | `yearly` |

**Entitlement:** `Luvi Pro` (must match `HITITOFF_PRO_ENTITLEMENT` in `app/utils/constants.ts`)

**REST API entitlement id:** `entlc32c4bb31f` (stored as `REVENUECAT_LUVI_PRO_ENTITLEMENT_REST_ID` — for RevenueCat HTTP API / webhooks only; the mobile SDK uses `Luvi Pro`, not the `entl…` id)

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
3. **Entitlements:** Ensure entitlement `Luvi Pro` is linked to all three products.
4. **Offerings:** Create or use offering identifier **`flikr-pro`** with packages:
   - `$rc_weekly` → identifier `weekly` → `com.luvii.app.weekly`
   - `$rc_monthly` → identifier `monthly` → `com.luvii.app.monthly`
   - `$rc_annual` → identifier `yearly` → `com.luvii.app.yearly`
5. Attach your published paywall to the **`flikr-pro`** offering (the app uses this offering, not the dashboard default).

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

- `EXPO_PUBLIC_REVENUECAT_IOS_KEY` — must start with `appl_…` (iOS public API key)
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` — must start with `goog_…` (Android public API key)
- `EXPO_PUBLIC_REVENUECAT_API_KEY` — optional **dev-only** fallback; do not let this override iOS/Android keys in TestFlight/production

---

## Troubleshooting Error 23

**Error 23 (CONFIGURATION_ERROR)** means StoreKit could not fetch subscription products on the device. Products can still appear in the RevenueCat dashboard (synced from App Store Connect) while the device fails — those are separate checks.

### 1. Verify EAS env vars and rebuild

`EXPO_PUBLIC_*` values are baked in at **build time**, not read from `.env` on the device.

```bash
eas env:list --environment production
```

Required for TestFlight (`production` profile):

- `EXPO_PUBLIC_REVENUECAT_IOS_KEY` — must start with `appl_…` (iOS public key from RevenueCat → your iOS app)
- Do **not** set `EXPO_PUBLIC_REVENUECAT_API_KEY=test_…` in production — it is dev-only

After changing env vars, create a **new** build:

```bash
eas build --platform ios --profile production
```

Preview and production use **different** iOS keys in this project — TestFlight must use the `production` profile.

### 2. RevenueCat iOS app ↔ bundle ID

In RevenueCat → **Apps** → iOS app:

- Bundle ID must be **`com.luvii.app`** (matches `app.json`)
- Public API key must match the `appl_…` key in EAS production env

### 3. Offering `flikr-pro`

The app loads offering identifier **`flikr-pro`** (not the dashboard default). Confirm:

- Offering exists with identifier exactly `flikr-pro`
- Packages `weekly`, `monthly`, `yearly` map to **iOS** products:
  - `com.luvii.app.weekly`
  - `com.luvii.app.monthly`
  - `com.luvii.app.yearly`
- Entitlement **`Luvi Pro`** is linked to all three
- A paywall is published and attached to `flikr-pro`

### 4. App Store Connect (most common device-side cause)

Even when RevenueCat shows products, TestFlight needs ASC setup complete:

1. Subscriptions under app **`com.luvii.app`** — status **Ready to Submit** (not Missing Metadata)
2. **Paid Apps Agreement** active in Agreements, Tax, and Banking
3. Subscriptions **attached to the app version** you submitted to TestFlight
4. Test on a **physical device** signed into a **Sandbox Apple ID** (Settings → App Store → Sandbox Account)

### 5. On-device diagnostics

The paywall error screen now shows build diagnostics (masked API key prefix, offering, product IDs, price count). Check Xcode device logs for `[RevenueCat] diagnostics` JSON after opening the paywall.

### Quick decision tree

| Diagnostic | Likely fix |
|------------|------------|
| Key: `MISSING` | Add `EXPO_PUBLIC_REVENUECAT_IOS_KEY` to EAS production, rebuild |
| Key starts with `test_` or `goog_` on iOS | Use `appl_…` iOS key in EAS production |
| Offering not found | Create/link offering `flikr-pro` in RevenueCat |
| Packages: 3, with prices: 0 | App Store Connect products not fetchable — metadata, agreement, attach to version |
| Wrong store product IDs | Align ASC ↔ RevenueCat ↔ `STORE_PRODUCT_IDS` in constants |

Common causes (summary):

1. **Wrong or missing API key in the TestFlight build** — iOS must use `appl_…` from the RevenueCat iOS app for `com.luvii.app`
2. **Product ID mismatch** — must exactly match `com.luvii.app.weekly`, `.monthly`, `.yearly`
3. **Offering `flikr-pro` missing or empty** — packages must map to iOS store products
4. **App Store Connect incomplete** — metadata, Paid Apps agreement, subscriptions on app version
5. **Bundle ID mismatch** — RevenueCat iOS app must use `com.luvii.app`
6. **Sandbox testing** — physical device + Sandbox Apple ID

---

## Checklist

- [ ] iOS subscriptions created in App Store Connect
- [ ] Android subscriptions created in Play Console
- [ ] Products imported into RevenueCat
- [ ] `Luvi Pro` entitlement linked to all products
- [ ] Offering packages mapped: `weekly`, `monthly`, `yearly`
- [ ] AI paywall generated from prompt file
- [ ] Post-generation tweaks applied
- [ ] Paywall published and attached to offering **`flikr-pro`**
- [ ] Sandbox purchase tested on device
