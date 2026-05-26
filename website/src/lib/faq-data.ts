import { SITE_URL, SUPPORT_EMAIL } from "./brand";

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is HitItOff?",
    answer:
      "HitItOff is an AI-powered, compatibility-first dating app that helps you meet singles nearby. Instead of endless swiping with no context, HitItOff uses a personality quiz, multi-dimensional compatibility scoring, mood-based discovery, AI conversation starters, and chemistry tracking to surface people who are a better fit for you.",
  },
  {
    question: "How does HitItOff matching work?",
    answer:
      "HitItOff combines your quiz answers with distance to calculate a compatibility score for each profile. Our AI compatibility engine adds deeper insights — chemistry, emotional resonance, communication fit, and humor alignment. You can set your mood to filter discovery, swipe on people in your radius, and match when you both like each other.",
  },
  {
    question: "What AI features does HitItOff include?",
    answer:
      "HitItOff includes AI conversation coach (temperature score, diagnosis, and explained reply suggestions), AI profile coach, red/green flag message checks, AI compatibility breakdowns, contextual conversation starters, mood-based matching, conversation temperature tracking in chat, AI voice vibe summaries, curated local date suggestions, practice mode (Pro), and AI message moderation. Free users get 3 openers, 5 conversation coach scans, and 1 profile review per day; Pro unlocks unlimited coaching.",
  },
  {
    question: "Is HitItOff free to use?",
    answer:
      "Yes. HitItOff offers a free plan with daily likes, messaging, local discovery up to 3 miles, compatibility scores, mood selection, basic chemistry tracking, and limited AI conversation starters. HitItOff Pro unlocks unlimited likes and messages, a 50-mile radius, advanced AI insights, unlimited openers, mood filters, chemistry analytics, voice vibe summaries, and an ad-free experience.",
  },
  {
    question: "How much does HitItOff Pro cost?",
    answer:
      "HitItOff Pro is available as a weekly, monthly, or yearly subscription through the App Store or Google Play. Pricing is shown in the app before you subscribe and may vary by region.",
  },
  {
    question: "What is the compatibility score?",
    answer:
      "The compatibility score reflects how well your personality quiz answers align with another user, weighted together with how close you are within your selected search radius. With HitItOff Pro, you also see an AI-powered breakdown across chemistry, emotional resonance, communication compatibility, and humor alignment.",
  },
  {
    question: "What is mood-based matching?",
    answer:
      "You can set your current vibe — like deep talks, flirty, adventurous, serious, chill, or spontaneous — and HitItOff adjusts your discovery feed accordingly. Mood badges appear on profiles, and Pro members can filter discovery to match compatible moods.",
  },
  {
    question: "How does the chemistry system work?",
    answer:
      "Once you match and start chatting, HitItOff tracks conversation temperature based on response energy, engagement, conversation depth, and humor alignment. You see a chemistry timeline as your connection develops. Pro members get detailed analytics; free users see a summary temperature meter.",
  },
  {
    question: "Does HitItOff help with no-ghosting?",
    answer:
      "Yes. HitItOff includes respectful dater badges, warm quick-response options like \"Still interested\" and \"Busy but want to continue,\" and emotionally intelligent nudges — designed to keep conversations honest without being toxic or guilt-driven.",
  },
  {
    question: "Is HitItOff safe?",
    answer:
      "HitItOff includes AI message moderation, scam pattern detection, report and block tools, and selfie verification hooks. You can report users from their profile or chat, and flagged content is reviewed. See our Privacy Policy and Terms for full details.",
  },
  {
    question: "Do I need to be 18 or older to use HitItOff?",
    answer:
      "Yes. HitItOff is strictly for adults aged 18 and over. Age verification and profile details help keep the community safe and appropriate.",
  },
  {
    question: "Does HitItOff use my location?",
    answer:
      "Yes, with your permission. HitItOff uses your location to show compatible people nearby, calculate distance-based scores, and suggest local date ideas. You control your search radius in discovery preferences.",
  },
  {
    question: "Can I add a video or voice intro to my profile?",
    answer:
      "Yes. HitItOff supports short video intros and voice bios so matches can see and hear you before chatting. Pro members can get AI-generated voice vibe summaries like \"Confident and playful\" from their recordings.",
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
    question: "How is HitItOff different from AI dating coaches like Hitch?",
    answer:
      "Tools like Hitch Dating are AI coaches that work alongside Hinge, Bumble, and Tinder — they analyze screenshots and suggest replies, but you still match and chat on other apps. HitItOff is the dating app itself: compatibility matching, AI coaching, chemistry tracking, and date planning in one place with full conversation context — no copy-paste required.",
  },
  {
    question: "How is HitItOff different from Hinge?",
    answer:
      "Hinge focuses on prompts and comments — you like a line, match, and figure out the rest yourself. HitItOff adds a personality quiz and compatibility scores before you swipe, mood-based discovery, in-app AI conversation coach with temperature and reply suggestions, chemistry tracking over time, red/green flag checks, and built-in date invites with local AI date ideas. Hinge is where many people already have matches; HitItOff is built for intentional daters who want fewer dead-end chats and more help turning matches into real dates.",
  },
  {
    question: "How is HitItOff different from other dating apps?",
    answer:
      "HitItOff focuses on compatibility and chemistry before guesswork alone. Personality quiz scoring, AI-powered insights, mood-based discovery, conversation starters, chemistry tracking, voice bios, date planning, and safety tools help you spend time on matches that actually make sense.",
  },
  {
    question: "How do I contact HitItOff support?",
    answer:
      `Email ${SUPPORT_EMAIL} or visit the Support page at ${SITE_URL}/support. We respond to account, billing, and safety questions as quickly as possible.`,
  },
];
