import { CTASection } from "@/components/CTASection";
import { CoachComparisonSection } from "@/components/CoachComparisonSection";
import { HingeComparisonSection } from "@/components/HingeComparisonSection";
import { FAQAccordion } from "@/components/FAQAccordion";
import { FeatureGrid } from "@/components/FeatureGrid";
import { Hero } from "@/components/Hero";
import { HowItWorksSteps } from "@/components/HowItWorksSteps";
import { WaitlistForm } from "@/components/WaitlistForm";
import { FAQ_ITEMS } from "@/lib/faq-data";

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <>
      <Hero />

      <FeatureGrid />

      <CoachComparisonSection />

      <HingeComparisonSection />

      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">How HitItOff works</h2>
          <p className="mt-4 text-lg text-text-muted">
            From quiz to chemistry in four simple steps. Built for people who want
            smarter local dating with AI-powered compatibility context.
          </p>
        </div>
        <div className="mt-12">
          <HowItWorksSteps />
        </div>
      </section>

      <section
        id="waitlist"
        className="mx-auto max-w-6xl px-4 py-20 sm:px-6"
        aria-labelledby="waitlist-heading"
      >
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <h2 id="waitlist-heading" className="text-3xl font-bold sm:text-4xl">
              Get notified at launch
            </h2>
            <p className="mt-4 text-lg text-text-muted">
              HitItOff is coming soon to the App Store and Google Play. Join the
              waitlist for early access updates and launch day download links.
            </p>
          </div>
          <WaitlistForm />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold sm:text-4xl">Frequently asked questions</h2>
          <p className="mt-4 text-lg text-text-muted">
            Quick answers about compatibility matching, pricing, safety, and launch timing.
          </p>
        </div>
        <div className="mt-10">
          <FAQAccordion items={FAQ_ITEMS.filter((item) =>
            [
              'What is HitItOff?',
              'What AI features does HitItOff include?',
              'How is HitItOff different from AI dating coaches like Hitch?',
              'How is HitItOff different from Hinge?',
              'Is HitItOff free to use?',
              'How does the chemistry system work?',
              'Is HitItOff available on iPhone and Android?',
            ].includes(item.question),
          )} />
        </div>
      </section>

      <CTASection />
    </>
  );
}
