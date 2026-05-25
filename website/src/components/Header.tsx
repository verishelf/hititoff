import Image from "next/image";
import Link from "next/link";

import { APP_NAME, NAV_LINKS } from "@/lib/brand";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/icon.png"
            alt={`${APP_NAME} app icon`}
            width={36}
            height={36}
            className="rounded-lg"
            priority
          />
          <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-text-muted transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#waitlist"
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Join Waitlist
          </Link>
        </nav>
        <Link
          href="/#waitlist"
          className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white md:hidden"
        >
          Waitlist
        </Link>
      </div>
    </header>
  );
}
