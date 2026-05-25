import Image from "next/image";
import Link from "next/link";

import { APP_NAME, APP_SLOGAN, FOOTER_LINKS, NAV_LINKS, SUPPORT_EMAIL } from "@/lib/brand";
import { StoreBadges } from "./StoreBadges";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <Image
                src="/icon.png"
                alt={`${APP_NAME} logo`}
                width={40}
                height={40}
                className="rounded-xl"
              />
              <div>
                <p className="text-lg font-semibold">{APP_NAME}</p>
                <p className="text-sm uppercase tracking-wider text-text-muted">
                  {APP_SLOGAN}
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-text-muted">
              Compatibility-first dating with personality quiz matching, local discovery,
              video intros, and smart filters. Launching soon on iOS and Android.
            </p>
            <div className="mt-6">
              <StoreBadges compact />
            </div>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
              Explore
            </h2>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/90 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
              Legal
            </h2>
            <ul className="mt-4 space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-foreground/90 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-sm text-foreground/90 transition-colors hover:text-primary"
                >
                  {SUPPORT_EMAIL}
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-border/60 pt-6 text-sm text-text-muted">
          <p>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved. Must be 18+ to use.
          </p>
        </div>
      </div>
    </footer>
  );
}
