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
    "Learn how HitItOff works: take the compatibility quiz, set your mood, discover nearby singles with AI scores, match, chat with AI openers, and plan real dates.",
  path: "/how-it-works",
  keywords: [
    "how HitItOff works",
    "AI compatibility dating",
    "mood based matching",
    "how to use HitItOff",
    "local dating app guide",
  ],
});

export default function HowItWorksPage() {
  const pageMeta = {
    title: "How It Works",
    description:
      "Learn how HitItOff works: take the compatibility quiz, set your mood, discover nearby singles with AI scores, match, chat with AI openers, and plan real dates.",
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
          transparent scoring, AI-powered insights, and modern dating tools — so
          every swipe and every conversation comes with context.
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
            is a compatibility percentage on every profile.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            Our AI compatibility engine goes further — analyzing quiz answers, profile
            prompts, interests, bio, and humor style to produce multi-dimensional
            scores for chemistry, emotional resonance, communication fit, and humor
            alignment. Pro members see the full breakdown; everyone gets the overall
            score.
          </p>
        </article>

        <article className="glass-card mt-8 rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold">Chemistry grows as you chat</h2>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            After you match, HitItOff tracks your spark meter based on response speed,
            engagement quality, conversation depth, humor alignment, and mutual energy.
            A chemistry timeline shows how your connection evolves over time — so you
            can tell when a conversation is heating up or needs a nudge.
          </p>
        </article>
      </section>
      <CTASection />
    </>
  );
}
