import type { Metadata } from "next";
import Script from "next/script";

import { SupportForm } from "@/components/SupportForm";
import { APP_NAME, SUPPORT_EMAIL } from "@/lib/brand";
import {
  breadcrumbJsonLd,
  buildMetadata,
  jsonLdScript,
  webPageJsonLd,
} from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = buildMetadata({
  title: "Support",
  description:
    "Contact HitItOff support for help with accounts, billing, safety, and app questions. Email support@hititoff.app.",
  path: "/support",
});

export default function SupportPage() {
  const pageMeta = {
    title: "Support",
    description:
      "Contact HitItOff support for help with accounts, billing, safety, and app questions. Email support@hititoff.app.",
    path: "/support",
  };

  const jsonLd = [
    webPageJsonLd(pageMeta),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Support", path: "/support" },
    ]),
  ];

  return (
    <>
      <Script
        id="support-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-bold sm:text-5xl">{APP_NAME} support</h1>
        <p className="mt-4 text-lg text-text-muted">
          Need help with your account, billing, safety, or the waitlist? We are here to
          help.
        </p>
        <p className="mt-4 text-text-muted">
          Email us directly at{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-primary">
            {SUPPORT_EMAIL}
          </a>
          .
        </p>
        <SupportForm />
      </section>
    </>
  );
}
