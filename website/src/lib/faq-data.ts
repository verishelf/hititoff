import { SITE_URL, SUPPORT_EMAIL } from "./brand";

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is HitItOff?",
    answer:
      "HitItOff is a compatibility-first dating app that helps you meet singles nearby. Instead of endless swiping with no context, HitItOff uses a personality quiz, location, and compatibility scoring to surface people who are a better fit for you.",
  },
  {
    question: "How does HitItOff matching work?",
    answer:
      "HitItOff combines your quiz answers with distance to calculate a compatibility score for each profile. You swipe on people in your discovery radius, and when you both like each other, you match and can start chatting.",
  },
  {
    question: "Is HitItOff free to use?",
    answer:
      "Yes. HitItOff offers a free plan with daily likes, messaging, and local discovery up to 3 miles. HitItOff Pro unlocks unlimited likes and messages, a 50-mile radius, advanced filters, who liked you, video intros, boosts, and an ad-free experience.",
  },
  {
    question: "How much does HitItOff Pro cost?",
    answer:
      "HitItOff Pro is available as a weekly, monthly, or yearly subscription through the App Store or Google Play. Pricing is shown in the app before you subscribe and may vary by region.",
  },
  {
    question: "What is the compatibility score?",
    answer:
      "The compatibility score reflects how well your personality quiz answers align with another user, weighted together with how close you are within your selected search radius. Higher scores suggest stronger alignment on lifestyle, values, humor, and relationship preferences.",
  },
  {
    question: "Do I need to be 18 or older to use HitItOff?",
    answer:
      "Yes. HitItOff is strictly for adults aged 18 and over. Age verification and profile details help keep the community safe and appropriate.",
  },
  {
    question: "Does HitItOff use my location?",
    answer:
      "Yes, with your permission. HitItOff uses your location to show compatible people nearby and calculate distance-based scores. You control your search radius in discovery preferences.",
  },
  {
    question: "Can I add a video intro to my profile?",
    answer:
      "Yes. HitItOff supports short video intros so matches can see and hear you before chatting. Video intros are available to Pro members and can also be used as a discovery filter.",
  },
  {
    question: "How do I delete my HitItOff account?",
    answer:
      "You can delete your account from the Profile screen in the app. Account deletion removes your profile and associated data in accordance with our Privacy Policy.",
  },
  {
    question: "Is HitItOff available on iPhone and Android?",
    answer:
      `HitItOff is launching soon on iOS and Android. Join the waitlist at ${SITE_URL}/#waitlist to get notified when the app is available in your app store.`,
  },
  {
    question: "How is HitItOff different from other dating apps?",
    answer:
      "HitItOff focuses on compatibility before chemistry alone. Personality quiz scoring, transparent compatibility percentages, local discovery, video intros, and advanced filters help you spend time on matches that actually make sense.",
  },
  {
    question: "How do I contact HitItOff support?",
    answer:
      `Email ${SUPPORT_EMAIL} or visit the Support page at ${SITE_URL}/support. We respond to account, billing, and safety questions as quickly as possible.`,
  },
];
