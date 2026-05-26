import Link from "next/link";

interface CTASectionProps {
  title?: string;
  description?: string;
}

export function CTASection({
  title = "Ready for smarter matches?",
  description = "Join the HitItOff waitlist for AI-powered compatibility, mood matching, and chemistry tracking — launching soon on iOS and Android.",
}: CTASectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="glass-card rounded-3xl px-6 py-12 text-center sm:px-10">
        <h2 className="text-3xl font-bold">{title}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-text-muted">{description}</p>
        <Link
          href="/#waitlist"
          className="mt-8 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Join the waitlist
        </Link>
      </div>
    </section>
  );
}
