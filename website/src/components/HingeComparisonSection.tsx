import Link from "next/link";

const COMPARISON_ROWS = [
  {
    feature: "Personality quiz & compatibility scores",
    hititoff: true,
    hinge: false,
  },
  {
    feature: "AI conversation coach (in-app)",
    hititoff: true,
    hinge: false,
  },
  {
    feature: "Conversation temperature & chemistry timeline",
    hititoff: true,
    hinge: false,
  },
  {
    feature: "Mood-based discovery (vibe today)",
    hititoff: true,
    hinge: false,
  },
  {
    feature: "AI profile coach & bio rewrites",
    hititoff: true,
    hinge: false,
  },
  {
    feature: "Red / green flag message checks",
    hititoff: true,
    hinge: false,
  },
  {
    feature: "Date invites + AI local date ideas",
    hititoff: true,
    hinge: false,
  },
  {
    feature: "Practice mode before real chats",
    hititoff: "Pro",
    hinge: false,
  },
  {
    feature: "Profile prompts & comments",
    hititoff: true,
    hinge: true,
  },
] as const;

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <span className="text-success font-semibold">✓</span>;
  if (value === false) return <span className="text-text-muted">—</span>;
  return <span className="text-accent text-sm font-medium">{value}</span>;
}

export function HingeComparisonSection() {
  return (
    <section className="border-y border-border/40 bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Hinge helps you start. HitItOff helps you choose.
          </h2>
          <p className="mt-4 text-lg text-text-muted">
            Hinge is great at prompts and comments — but matching still comes down to
            guesswork, and the chat is on you. HitItOff adds compatibility scoring, live
            chemistry tracking, and AI coaching so you spend time on people who fit and
            know what to say when you match.
          </p>
        </div>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-4 pr-4 font-semibold text-text-muted">Feature</th>
                <th className="pb-4 px-4 font-semibold text-primary">HitItOff</th>
                <th className="pb-4 pl-4 font-semibold text-text-muted">Hinge</th>
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
                    <Cell value={row.hinge} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-text-muted">
          Hinge wins on audience size today — HitItOff wins on intentional matching:
          fewer random chats, more context before you swipe, and a clear path from
          match to date inside one app.
        </p>

        <div className="mt-10">
          <Link
            href="#waitlist"
            className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Join the waitlist →
          </Link>
        </div>
      </div>
    </section>
  );
}
