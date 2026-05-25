import type { Metadata } from "next";
import Script from "next/script";

import { CTASection } from "@/components/CTASection";
import { HowItWorksSteps } from "@/components/HowItWorksSteps";
import {
  breadcrumbJsonLd,
  buildMetadata,
  jsonLdScript,
  webPageJsonLd,
} from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = buildMetadata({
  title: "How It Works",
  description:
    "Learn how HitItOff works: take the compatibility quiz, discover nearby singles, swipe with context, match, chat, and stand out with video intros.",
  path: "/how-it-works",
  keywords: [
    "how HitItOff works",
    "compatibility quiz dating",
    "how to use HitItOff",
    "local dating app guide",
  ],
});

export default function HowItWorksPage() {
  const pageMeta = {
    title: "How It Works",
    description:
      "Learn how HitItOff works: take the compatibility quiz, discover nearby singles, swipe with context, match, chat, and stand out with video intros.",
    path: "/how-it-works",
  };

  const jsonLd = [
    webPageJsonLd(pageMeta),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "How It Works", path: "/how-it-works" },
    ]),
  ];

  return (
    <>
      <Script
        id="how-it-works-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-bold sm:text-5xl">How HitItOff works</h1>
        <p className="mt-4 max-w-3xl text-lg text-text-muted">
          HitItOff is designed to help you meet compatible people nearby with
          transparent scoring and modern dating tools — so every swipe comes with
          context.
        </p>
        <div className="mt-12">
          <HowItWorksSteps />
        </div>

        <article className="glass-card mt-12 rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">How compatibility is calculated</h2>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            HitItOff combines your personality quiz similarity with distance inside
            your selected radius. Quiz answers are compared using vector similarity,
            then blended with a location score that favors closer matches. The result
            is a compatibility percentage that helps you prioritize better fits.
          </p>
        </article>
      </section>
      <CTASection />
    </>
  );
}
