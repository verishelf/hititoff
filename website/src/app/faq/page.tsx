import type { Metadata } from "next";
import Script from "next/script";

import { CTASection } from "@/components/CTASection";
import { FAQAccordion } from "@/components/FAQAccordion";
import { FAQ_ITEMS } from "@/lib/faq-data";
import {
  breadcrumbJsonLd,
  buildMetadata,
  faqPageJsonLd,
  jsonLdScript,
  webPageJsonLd,
} from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = buildMetadata({
  title: "FAQ",
  description:
    "HitItOff FAQ: compatibility matching, free vs Pro plans, location usage, video intros, account deletion, launch timing, and support.",
  path: "/faq",
  keywords: [
    "HitItOff FAQ",
    "HitItOff Pro pricing",
    "compatibility dating app questions",
    "HitItOff support",
  ],
});

export default function FAQPage() {
  const pageMeta = {
    title: "FAQ",
    description:
      "HitItOff FAQ: compatibility matching, free vs Pro plans, location usage, video intros, account deletion, launch timing, and support.",
    path: "/faq",
  };

  const jsonLd = [
    webPageJsonLd(pageMeta),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "FAQ", path: "/faq" },
    ]),
    faqPageJsonLd(),
  ];

  return (
    <>
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-bold sm:text-5xl">Frequently asked questions</h1>
        <p className="mt-4 text-lg text-text-muted">
          Answers about HitItOff compatibility matching, subscriptions, safety,
          and launch availability.
        </p>
        <div className="mt-10">
          <FAQAccordion items={FAQ_ITEMS} />
        </div>
      </section>
      <CTASection />
    </>
  );
}
