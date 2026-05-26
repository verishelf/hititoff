import type { Metadata } from "next";
import Script from "next/script";

import { APP_NAME, SITE_URL, SUPPORT_EMAIL } from "@/lib/brand";
import { LegalPageFooter } from "@/components/LegalPageFooter";
import {
  breadcrumbJsonLd,
  buildMetadata,
  jsonLdScript,
  webPageJsonLd,
} from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = buildMetadata({
  title: "Privacy Policy",
  description:
    "HitItOff Privacy Policy: how we collect, use, and protect profile data, location, photos, quiz answers, AI features, voice clips, and account information.",
  path: "/privacy",
});

export default function PrivacyPage() {
  const pageMeta = {
    title: "Privacy Policy",
    description:
      "HitItOff Privacy Policy: how we collect, use, and protect profile data, location, photos, quiz answers, AI features, voice clips, and account information.",
    path: "/privacy",
  };

  const jsonLd = [
    webPageJsonLd(pageMeta),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Privacy Policy", path: "/privacy" },
    ]),
  ];

  return (
    <>
      <Script
        id="privacy-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-bold sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-text-muted">Last updated: May 25, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-text-muted [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:mt-2 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">

        <p>
          This Privacy Policy describes how {APP_NAME} (&quot;we&quot;, &quot;us&quot;, or
          &quot;our&quot;) collects, uses, and protects information when you use the {APP_NAME}
          mobile application and website at {SITE_URL.replace("https://", "")}.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>Account information such as email address and authentication data</li>
          <li>Profile information including name, age, gender, bio, interests, and photos</li>
          <li>Quiz answers and profile prompts used to generate compatibility scores</li>
          <li>Mood preferences and chemistry metrics from in-app interactions</li>
          <li>Voice bios, vibe clips, and voice messages you choose to record</li>
          <li>Location data when you grant permission, used for nearby discovery and date suggestions</li>
          <li>Video intro and Instagram profile data you choose to upload or link</li>
          <li>Usage data such as swipes, matches, messages, and in-app preferences</li>
          <li>Subscription and purchase status for HitItOff Pro</li>
        </ul>

        <h2>How we use information</h2>
        <ul>
          <li>Provide matching, discovery, chat, and profile features</li>
          <li>Calculate compatibility scores and show relevant nearby profiles</li>
          <li>Power AI features such as conversation starters, compatibility insights, voice vibe summaries, date suggestions, and message moderation</li>
          <li>Track chemistry and engagement signals to improve your chat experience</li>
          <li>Process subscriptions and provide customer support</li>
          <li>Improve app performance, safety, and product experience</li>
          <li>Send service-related communications such as launch or account notices</li>
        </ul>

        <h2>AI and automated processing</h2>
        <p>
          {APP_NAME} uses automated systems, including third-party AI services, to generate
          compatibility insights, conversation suggestions, voice summaries, date ideas, and
          safety moderation signals. Message and profile content may be processed to deliver
          these features and to detect harmful or abusive behavior. AI outputs are assistive
          suggestions — not guarantees about compatibility or another person&apos;s intent.
        </p>

        <h2>How we store data</h2>
        <p>
          {APP_NAME} uses secure cloud infrastructure, including Supabase, to store account
          and profile data. Photos and media are stored in protected storage buckets with
          access controls.
        </p>

        <h2>Location data</h2>
        <p>
          We use location only with your permission to power local discovery and distance
          scoring. You can control location access through your device settings.
        </p>

        <h2>Sharing</h2>
        <p>
          We do not sell your personal information. We share data only with service
          providers necessary to operate the app (such as hosting, authentication,
          analytics, and payment processors) and when required by law.
        </p>

        <h2>Your choices</h2>
        <ul>
          <li>Update profile details in the app at any time</li>
          <li>Delete your account from the Profile screen</li>
          <li>Contact us to request access or deletion assistance</li>
        </ul>

        <h2>Age requirement</h2>
        <p>
          {APP_NAME} is for users 18 years of age or older. We do not knowingly collect
          information from anyone under 18.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <LegalPageFooter page="privacy" />
        </div>
      </article>
    </>
  );
}
