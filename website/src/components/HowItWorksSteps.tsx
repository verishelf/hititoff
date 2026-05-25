import { HOW_IT_WORKS_STEPS } from "@/lib/brand";

export function HowItWorksSteps() {
  return (
    <ol className="grid gap-6 md:grid-cols-2">
      {HOW_IT_WORKS_STEPS.map((step, index) => (
        <li key={step.title} className="glass-card rounded-2xl p-6">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-sm font-bold text-primary">
            {index + 1}
          </span>
          <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
          <p className="mt-3 text-sm leading-relaxed text-text-muted">
            {step.description}
          </p>
        </li>
      ))}
    </ol>
  );
}
