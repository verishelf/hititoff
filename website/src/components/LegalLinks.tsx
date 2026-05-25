import Link from "next/link";

interface LegalLinksProps {
  className?: string;
  separator?: string;
}

export function LegalLinks({
  className = "text-sm text-text-muted",
  separator = " · ",
}: LegalLinksProps) {
  return (
    <p className={className}>
      <Link href="/terms" className="text-primary hover:text-accent">
        Terms of Service
      </Link>
      {separator}
      <Link href="/privacy" className="text-primary hover:text-accent">
        Privacy Policy
      </Link>
      {separator}
      <Link href="/eula" className="text-primary hover:text-accent">
        EULA
      </Link>
    </p>
  );
}
