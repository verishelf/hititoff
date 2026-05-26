import Link from "next/link";

const COMPARISON_ROWS = [
  {
    feature: "Real matching & chat",
    hititoff: true,
    hitch: false,
  },
  {
    feature: "Conversation temperature & diagnosis",
    hititoff: true,
    hitch: true,
  },
  {
    feature: "AI profile coach",
    hititoff: true,
    hitch: true,
  },
  {
    feature: "Red / green flag message checks",
    hititoff: true,
    hitch: true,
  },
  {
    feature: "Practice mode",
    hititoff: "Pro",
    hitch: "Pro",
  },
  {
    feature: "Compatibility quiz & scores",
    hititoff: true,
    hitch: false,
  },
  {
    feature: "Full chat context (no screenshots)",
    hititoff: true,
    hitch: false,
  },
] as const;

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="text-success font-semibold">✓</span>;
  if (value === false) return <span className="text-text-muted">—</span>;
  return <span className="text-accent text-sm font-medium">{value}</span>;
}

export function CoachComparisonSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Coach + matches in one app
        </h2>
        <p className="mt-4 text-lg text-text-muted">
          Tools like Hitch Dating coach you on Hinge and Bumble — but you still swipe
          elsewhere with no compatibility context. HitItOff builds AI coaching into the
          same app where you match, chat, and plan dates.
        </p>
      </div>

      <div className="mt-12 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="pb-4 pr-4 font-semibold text-text-muted">Feature</th>
              <th className="pb-4 px-4 font-semibold text-primary">HitItOff</th>
              <th className="pb-4 pl-4 font-semibold text-text-muted">
                Coach-only tools
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_ROWS.map((row) => (
              <tr key={row.feature} className="border-b border-border/60">
                <td className="py-4 pr-4 text-foreground">{row.feature}</td>
                <td className="py-4 px-4">
                  <Cell value={row.hititoff} />
                </td>
                <td className="py-4 pl-4">
                  <Cell value={row.hitch} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10">
        <Link
          href="#waitlist"
          className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Get early access →
        </Link>
      </div>
    </section>
  );
}
