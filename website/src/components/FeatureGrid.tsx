import Link from "next/link";

const FEATURES = [
  {
    title: "Compatibility quiz matching",
    description:
      "Answer questions about personality, lifestyle, values, and humor. HitItOff scores how well you align before you swipe.",
  },
  {
    title: "Local discovery radius",
    description:
      "Find compatible singles nearby with distance-aware scoring. Free users search up to 3 mi; Pro unlocks up to 50 mi.",
  },
  {
    title: "Transparent compatibility scores",
    description:
      "See a compatibility percentage on profiles so you know why someone is a strong match — not just a pretty photo.",
  },
  {
    title: "Video intro profiles",
    description:
      "Stand out with a 20-second video intro. Pro members can filter for profiles with video and Instagram photos.",
  },
  {
    title: "Smart discovery filters",
    description:
      "Filter by age, interests, compatibility minimum, photo count, bio, video intro, and more with HitItOff Pro.",
  },
  {
    title: "Match and chat instantly",
    description:
      "When you both like each other, it is a match. Start chatting right away and keep the conversation going.",
  },
] as const;

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Dating built around compatibility, not guesswork
        </h2>
        <p className="mt-4 text-lg text-text-muted">
          HitItOff combines personality science, location, and modern discovery tools
          so you spend less time on bad fits and more time on real connections.
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
