import type { Metadata } from "next";
import Script from "next/script";

import { CTASection } from "@/components/CTASection";
import { FREE_FEATURES, HITITOFF_PRO_FEATURES } from "@/lib/brand";
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
    "Explore HitItOff features: personality quiz matching, compatibility scores, local discovery, video intros, advanced filters, and HitItOff Pro upgrades.",
  path: "/features",
  keywords: [
    "HitItOff features",
    "compatibility dating app features",
    "personality quiz dating app",
    "dating app with video intro",
    "HitItOff Pro",
  ],
});

export default function FeaturesPage() {
  const pageMeta = {
    title: "Features",
    description:
      "Explore HitItOff features: personality quiz matching, compatibility scores, local discovery, video intros, advanced filters, and HitItOff Pro upgrades.",
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
          Everything you need for compatibility-first dating — from free local
          discovery to HitItOff Pro with unlimited likes, advanced filters, and
          premium profile tools.
        </p>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <article className="glass-card rounded-2xl p-6">
            <h2 className="text-2xl font-semibold">Free plan</h2>
            <p className="mt-2 text-sm text-text-muted">
              Start matching with core compatibility tools at no cost.
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
              Unlock the full compatibility dating experience.
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
