import type { Metadata } from "next";
import Script from "next/script";

import { CTASection } from "@/components/CTASection";
import {
  AI_FEATURES,
  FREE_FEATURES,
  HITITOFF_PRO_FEATURES,
} from "@/lib/brand";
import {
  breadcrumbJsonLd,
  buildMetadata,
  jsonLdScript,
  webPageJsonLd,
} from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = buildMetadata({
  title: "Features",
  description:
    "Explore HitItOff features: AI compatibility scoring, mood-based matching, conversation starters, chemistry tracking, voice bios, date ideas, safety tools, and HitItOff Pro.",
  path: "/features",
  keywords: [
    "HitItOff features",
    "AI dating app features",
    "compatibility dating app features",
    "AI conversation starters dating",
    "mood based dating app",
    "chemistry dating app",
    "HitItOff Pro",
  ],
});

export default function FeaturesPage() {
  const pageMeta = {
    title: "Features",
    description:
      "Explore HitItOff features: AI compatibility scoring, mood-based matching, conversation starters, chemistry tracking, voice bios, date ideas, safety tools, and HitItOff Pro.",
    path: "/features",
  };

  const jsonLd = [
    webPageJsonLd(pageMeta),
    breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Features", path: "/features" },
    ]),
  ];

  return (
    <>
      <Script
        id="features-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdScript(jsonLd)}
      />
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="text-4xl font-bold sm:text-5xl">HitItOff features</h1>
        <p className="mt-4 max-w-3xl text-lg text-text-muted">
          Everything you need for AI-powered, compatibility-first dating — from free
          local discovery and mood matching to HitItOff Pro with unlimited AI tools,
          advanced chemistry analytics, and premium profile features.
        </p>

        <div className="mt-16">
          <h2 className="text-2xl font-semibold">AI-powered features</h2>
          <p className="mt-2 max-w-3xl text-sm text-text-muted">
            Built into the same swipe, match, and chat experience you know — no
            separate app, no redesign required.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {AI_FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="glass-card rounded-2xl border border-primary/20 p-6"
              >
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-2">
          <article className="glass-card rounded-2xl p-6">
            <h2 className="text-2xl font-semibold">Free plan</h2>
            <p className="mt-2 text-sm text-text-muted">
              Start matching with core compatibility and AI tools at no cost.
            </p>
            <ul className="mt-6 space-y-3">
              {FREE_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm">
                  <span className="text-primary">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="glass-card rounded-2xl border border-primary/30 p-6">
            <h2 className="text-2xl font-semibold">HitItOff Pro</h2>
            <p className="mt-2 text-sm text-text-muted">
              Unlock the full AI compatibility dating experience.
            </p>
            <ul className="mt-6 space-y-3">
              {HITITOFF_PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex gap-3 text-sm">
                  <span className="text-primary">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
      <CTASection />
    </>
  );
}
