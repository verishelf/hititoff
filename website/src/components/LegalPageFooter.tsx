import Link from "next/link";

import { LegalLinks } from "@/components/LegalLinks";

interface LegalPageFooterProps {
  page: "privacy" | "terms" | "eula";
}

const RELATED: Record<
  LegalPageFooterProps["page"],
  { label: string; href: string }[]
> = {
  privacy: [
    { label: "Terms of Service", href: "/terms" },
    { label: "EULA", href: "/eula" },
  ],
  terms: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "EULA", href: "/eula" },
  ],
  eula: [
    { label: "Terms of Service", href: "/terms" },
    { label: "Privacy Policy", href: "/privacy" },
  ],
};

export function LegalPageFooter({ page }: LegalPageFooterProps) {
  const related = RELATED[page];

  return (
    <nav
      aria-label="Related legal pages"
      className="mt-12 border-t border-border/60 pt-8"
    >
      <p className="text-sm text-text-muted">
        See also{" "}
        {related.map((link, index) => (
          <span key={link.href}>
            {index > 0 && (index === related.length - 1 ? ", and " : ", ")}
            <Link href={link.href} className="font-semibold text-primary hover:text-accent">
              {link.label}
            </Link>
          </span>
        ))}
        .
      </p>
      <div className="mt-4">
        <LegalLinks />
      </div>
    </nav>
  );
}
