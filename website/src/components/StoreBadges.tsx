"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ANDROID_PLAY_STORE_URL,
  IOS_APP_STORE_URL,
} from "@/lib/brand";

/** Official Apple badge (119.66×40). Source: developer.apple.com/app-store/marketing/guidelines */
const APP_STORE_BADGE = {
  src: "/badges/download-on-the-app-store.svg",
  width: 120,
  height: 40,
  label: "Download on the App Store",
} as const;

/** Official Google Play badge (646×250). Source: play.google.com/intl/en_us/badges */
const GOOGLE_PLAY_BADGE = {
  src: "/badges/google-play.png",
  width: 646,
  height: 250,
  label: "Get it on Google Play",
} as const;

interface StoreBadgesProps {
  compact?: boolean;
  showComingSoonLabel?: boolean;
}

export function StoreBadges({
  compact = false,
  showComingSoonLabel = true,
}: StoreBadgesProps) {
  const iosLive = Boolean(IOS_APP_STORE_URL);
  const androidLive = Boolean(ANDROID_PLAY_STORE_URL);
  const comingSoon = !iosLive && !androidLive;

  const badgeHeight = compact ? 40 : 48;

  function renderBadge(
    href: string | null,
    badge: typeof APP_STORE_BADGE | typeof GOOGLE_PLAY_BADGE,
    live: boolean,
  ) {
    const image = (
      <Image
        src={badge.src}
        alt={badge.label}
        width={badge.width}
        height={badge.height}
        className="w-auto transition-opacity hover:opacity-90"
        style={{ height: badgeHeight }}
        priority={!compact}
      />
    );

    if (live && href) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={badge.label}
        >
          {image}
        </a>
      );
    }

    return (
      <Link
        href="/#waitlist"
        aria-label={`${badge.label} — coming soon, join waitlist`}
        className="group relative inline-block"
      >
        {image}
        {comingSoon && (
          <span className="pointer-events-none absolute -bottom-5 left-0 right-0 text-center text-[10px] uppercase tracking-wide text-text-muted opacity-0 transition-opacity group-hover:opacity-100">
            Coming soon
          </span>
        )}
      </Link>
    );
  }

  return (
    <div>
      {showComingSoonLabel && comingSoon && (
        <p className="mb-3 text-sm text-text-muted">
          Coming soon on App Store and Google Play — get notified at launch.
        </p>
      )}
      <div className={`flex flex-wrap items-center ${compact ? "gap-3" : "gap-4"}`}>
        {renderBadge(IOS_APP_STORE_URL || null, APP_STORE_BADGE, iosLive)}
        {renderBadge(ANDROID_PLAY_STORE_URL || null, GOOGLE_PLAY_BADGE, androidLive)}
      </div>
    </div>
  );
}
