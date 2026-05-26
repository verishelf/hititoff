import Link from "next/link";

const FEATURES = [
  {
    title: "AI conversation coach",
    description:
      "Get a conversation temperature score, diagnosis of what's stalling, and two reply suggestions with explanations — built into chat, no screenshots.",
  },
  {
    title: "AI profile coach",
    description:
      "Review your bio, photo order, and prompts with actionable rewrites. Free users get 1 review per day; Pro gets unlimited.",
  },
  {
    title: "Compatibility quiz matching",
    description:
      "Answer questions about personality, lifestyle, values, and humor. HitItOff scores how well you align before you swipe.",
  },
  {
    title: "Red / green flag checks",
    description:
      "Long-press any incoming message for an instant coaching read — green light, yellow caution, or red flag with plain-language explanation.",
  },
  {
    title: "Practice mode (Pro)",
    description:
      "Rehearse conversations with a simulated AI match, then get scored feedback on confidence and question quality before real dates.",
  },
  {
    title: "Match, chat & date in one app",
    description:
      "Local discovery, mood matching, chemistry timeline, AI date ideas with maps, and safety tools — no switching between apps.",
  },
] as const;

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold sm:text-4xl">
          AI-coached compatibility dating
        </h2>
        <p className="mt-4 text-lg text-text-muted">
          HitItOff combines AI coaching with real matching — personality science,
          compatibility scores, mood-based discovery, and local date planning in one
          native app. More intentional than prompt-only apps like Hinge.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <article key={feature.title} className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold">{feature.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">
              {feature.description}
            </p>
          </article>
        ))}
      </div>
      <div className="mt-10">
        <Link
          href="/features"
          className="text-sm font-semibold text-primary transition hover:text-accent"
        >
          Explore all features →
        </Link>
      </div>
    </section>
  );
}
