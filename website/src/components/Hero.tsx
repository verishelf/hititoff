import Image from "next/image";
import Link from "next/link";

import { APP_NAME, APP_SLOGAN } from "@/lib/brand";
import { StoreBadges } from "./StoreBadges";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-glow absolute inset-0 pointer-events-none" aria-hidden="true" />
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-20"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/splash.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-background/70" aria-hidden="true" />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            {APP_SLOGAN}
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            The compatibility dating app for{" "}
            <span className="gradient-text">better matches, closer</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-text-muted">
            HitItOff uses a personality quiz, compatibility scores, and local discovery
            to help you meet singles who actually fit — not just another endless swipe
            deck.
          </p>
          <div className="mt-8">
            <StoreBadges />
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="#waitlist"
              className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Join the waitlist
            </Link>
            <Link
              href="/how-it-works"
              className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition hover:border-primary/60"
            >
              See how it works
            </Link>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div className="glass-card relative rounded-3xl p-6 sm:p-8">
            <Image
              src="/logo.png"
              alt={`${APP_NAME} — compatibility dating app logo`}
              width={320}
              height={320}
              className="mx-auto rounded-3xl"
              priority
            />
            <ul className="mt-6 space-y-3 text-sm text-text-muted">
              <li>✓ Personality quiz compatibility scoring</li>
              <li>✓ Local discovery with smart radius filters</li>
              <li>✓ Video intros and Instagram profile support</li>
              <li>✓ Match, chat, and upgrade to HitItOff Pro</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
