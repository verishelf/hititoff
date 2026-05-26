export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://hititoff.vercel.app";

export const APP_NAME = "HitItOff";
export const APP_SLOGAN = "Better Matches, Closer";
export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@hititoff.app";

export const IOS_APP_STORE_URL =
  process.env.NEXT_PUBLIC_IOS_APP_STORE_URL ?? "";
export const ANDROID_PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_ANDROID_PLAY_STORE_URL ?? "";

export const COLORS = {
  background: "#120810",
  surface: "#1f1220",
  card: "#2a1830",
  primary: "#ff4d8d",
  primaryDark: "#c9185a",
  accent: "#ff8fab",
  text: "#ffffff",
  textMuted: "#b8a0ad",
  success: "#4ade80",
  danger: "#f87171",
  border: "#3d2845",
  splash: "#9d1b6b",
} as const;

export const DEFAULT_DESCRIPTION =
  "HitItOff is an AI-powered compatibility dating app. Personality quiz matching, multi-dimensional compatibility scores, mood-based discovery, AI conversation starters, chemistry tracking, voice bios, date ideas, and safety tools — for better matches, closer.";

export const KEYWORDS = [
  "HitItOff",
  "dating app",
  "Hinge alternative",
  "AI dating coach",
  "compatibility dating app",
  "personality quiz dating",
  "chemistry dating app",
  "mood based matching",
  "AI conversation starters",
  "local dating app",
  "video intro dating",
  "compatibility score dating",
  "voice bio dating",
  "meet singles nearby",
  "relationship app",
  "smart matching app",
];

export const HITITOFF_PRO_FEATURES = [
  "Unlimited likes per day",
  "Unlimited messages",
  "Search up to 50 mi radius",
  "Advanced dating preferences",
  "See who liked you",
  "View all profile photos",
  "Compatibility scores on every profile",
  "Advanced AI compatibility insights",
  "Unlimited AI conversation starters",
  "Unlimited AI conversation coach",
  "Practice mode with scored feedback",
  "Unlimited AI profile coach reviews",
  "Advanced mood filters",
  "Chemistry analytics & timeline",
  "AI voice vibe summaries",
  "Priority visibility in discovery",
  "Send & receive super likes",
  "20-second video intro",
  "Profile boosts",
  "Age, compatibility & interest filters",
  "Video & Instagram profile filters",
  "No ads",
] as const;

export const FREE_FEATURES = [
  "Personality quiz + profile prompts",
  "Swipe to discover nearby singles",
  "Up to 20 likes per day",
  "3 messages per match on free plan",
  "Search radius up to 3 mi",
  "Compatibility scores on profiles",
  "Live mood selection for discovery",
  "3 AI conversation starters per day",
  "5 AI conversation coach scans per day",
  "1 AI profile review per day",
  "Unlimited red/green flag message checks",
  "Conversation temperature & chemistry basics in chat",
  "Quick responses & respectful dater badges",
  "Report, block & message moderation",
  "Match when you both like each other",
] as const;

export const AI_FEATURES = [
  {
    title: "AI conversation coach",
    description:
      "Analyze any chat for conversation temperature, what's working, what's stalling, and get two reply suggestions with explanations — all inside the thread.",
  },
  {
    title: "AI profile coach",
    description:
      "Get a profile strength score, bio rewrite, photo order tips, and prompt feedback so you stand out before you swipe.",
  },
  {
    title: "Red / green flag checks",
    description:
      "Long-press incoming messages for instant coaching reads — green light, yellow caution, or red flag with a plain-language explanation.",
  },
  {
    title: "AI compatibility engine",
    description:
      "Go beyond a single percentage. HitItOff analyzes quiz answers, profile prompts, interests, and humor to surface chemistry, emotional resonance, communication fit, and humor alignment scores.",
  },
  {
    title: "AI conversation starters",
    description:
      "Stuck on what to say? Get contextual openers in funny, flirty, deep, or romantic tones — generated from both profiles. One tap to send.",
  },
  {
    title: "Mood-based matching",
    description:
      "Set your vibe — deep talks, flirty, adventurous, serious, chill, or spontaneous. Discovery adapts in real time and shows mood badges on profiles.",
  },
  {
    title: "HitItOff chemistry system",
    description:
      "Track conversation temperature, response energy, conversation depth, and humor alignment as you chat. See a chemistry timeline that evolves with every message.",
  },
  {
    title: "Practice mode (Pro)",
    description:
      "Simulate conversations with an AI match, then get scored feedback on confidence, question quality, and ask-for-date timing.",
  },
  {
    title: "Voice bios & vibe clips",
    description:
      "Add a voice intro and short vibe clip to your profile. AI generates personality summaries like “Confident and playful” from your voice.",
  },
  {
    title: "No-ghosting tools",
    description:
      "Respectful dater badges, warm quick responses (“Still interested”, “Busy but want to continue”), and gentle nudges keep conversations human — not guilt-driven.",
  },
  {
    title: "Real-world date ideas",
    description:
      "AI-curated date suggestions based on shared interests, location, and mood. View nearby spots on a map and plan your first meetup from chat.",
  },
  {
    title: "Safety & trust",
    description:
      "AI message moderation, scam detection, report and block tools, and selfie verification hooks help keep the community safe.",
  },
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    title: "Take the compatibility quiz",
    description:
      "Answer questions about personality, lifestyle, values, and humor. Add profile prompts so HitItOff — and our AI — understand the real you.",
  },
  {
    title: "Set your mood & discover",
    description:
      "Choose your vibe for the day and browse nearby singles. See compatibility scores, mood badges, and AI-powered match insights on every profile.",
  },
  {
    title: "Swipe, match, and break the ice",
    description:
      "Like profiles you connect with. When you both swipe right, use AI conversation starters in the tone you want — funny, flirty, deep, or romantic.",
  },
  {
    title: "Build chemistry in chat",
    description:
      "Watch your spark meter grow as you chat. Track chemistry over time, send voice messages, use quick responses, and plan dates with AI-curated local ideas.",
  },
] as const;

export const NAV_LINKS = [
  { href: "/features", label: "Features" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
] as const;

export const FOOTER_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/eula", label: "EULA" },
  { href: "/support", label: "Support" },
] as const;
