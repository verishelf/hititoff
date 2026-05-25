import type { Metadata } from "next";
import Script from "next/script";

import { APP_NAME, SUPPORT_EMAIL } from "@/lib/brand";
import { LegalPageFooter } from "@/components/LegalPageFooter";
import {
  breadcrumbJsonLd,
  buildMetadata,
  jsonLdScript,
  webPageJsonLd,
} from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = buildMetadata({
  title: "Terms of Service",
  description:
    "HitItOff Terms of Service: acceptable use, account rules, subscriptions, safety expectations, and legal terms for the dating app.",
  path: "/terms",
});

export default function TermsPage() {
  const pageMeta = {
    title: "Terms of Service",
    description:
      "HitItOff Terms of Service: acceptable use, account rules, subscriptions, safety expectations, and legal terms for the dating app.",
    path: "/terms",
  };

  const jsonLd = [
    webPageJsonLd(pageMeta),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Terms of Service", path: "/terms" },
    ]),
  ];

  return (
    <>
      <Script
        id="terms-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-bold sm:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-text-muted">Last updated: May 24, 2026</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-text-muted [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:mt-2 [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5">

        <p>
          These Terms of Service (&quot;Terms&quot;) govern your use of the {APP_NAME} mobile
          application and website. By creating an account or using {APP_NAME}, you agree to
          these Terms.
        </p>

        <h2>Eligibility</h2>
        <p>
          You must be at least 18 years old and legally able to enter a binding agreement
          to use {APP_NAME}. You are responsible for the accuracy of your profile
          information.
        </p>

        <h2>Acceptable use</h2>
        <ul>
          <li>Be respectful and honest in your profile and messages</li>
          <li>Do not harass, threaten, impersonate, or exploit other users</li>
          <li>Do not upload illegal, hateful, or sexually explicit content involving minors</li>
          <li>Do not scrape, reverse engineer, or interfere with the service</li>
          <li>Do not use {APP_NAME} for spam, fraud, or commercial solicitation</li>
        </ul>

        <h2>Accounts and safety</h2>
        <p>
          You are responsible for maintaining the security of your account. We may suspend
          or terminate accounts that violate these Terms or create safety risks for the
          community.
        </p>

        <h2>Subscriptions</h2>
        <p>
          HitItOff Pro subscriptions are billed through the Apple App Store or Google Play.
          Pricing, renewal, cancellation, and refunds are subject to the policies of the
          platform where you purchased. Subscription features may change over time with
          reasonable notice.
        </p>

        <h2>Content</h2>
        <p>
          You retain ownership of content you upload, but grant {APP_NAME} a license to
          host, display, and process that content to operate the service. You must have
          rights to any photos, videos, or media you upload.
        </p>

        <h2>Disclaimer</h2>
        <p>
          {APP_NAME} is provided &quot;as is&quot; without warranties of any kind. We do not
          guarantee matches, relationship outcomes, or uninterrupted service. Use caution
          when meeting people online or in person.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, {APP_NAME} is not liable for indirect,
          incidental, or consequential damages arising from your use of the service.
        </p>

        <h2>Changes</h2>
        <p>
          We may update these Terms from time to time. Continued use after changes become
          effective constitutes acceptance of the updated Terms.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about these Terms? Email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <LegalPageFooter page="terms" />
        </div>
      </article>
    </>
  );
}
