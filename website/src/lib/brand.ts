export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://hititoff.app";

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
  "HitItOff is a compatibility-first dating app that matches you with people nearby using a personality quiz, compatibility scores, video intros, and smart discovery filters. Better matches, closer.";

export const KEYWORDS = [
  "HitItOff",
  "dating app",
  "compatibility dating app",
  "personality quiz dating",
  "local dating app",
  "video intro dating",
  "compatibility score dating",
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
  "Send & receive super likes",
  "20-second video intro",
  "Profile boosts",
  "Age, compatibility & interest filters",
  "Video & Instagram profile filters",
  "No ads",
] as const;

export const FREE_FEATURES = [
  "Personality quiz matching",
  "Swipe to discover nearby singles",
  "Up to 20 likes per day",
  "3 messages per match on free plan",
  "Search radius up to 3 mi",
  "Basic discovery filters",
  "Match when you both like each other",
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    title: "Take the compatibility quiz",
    description:
      "Answer quick questions about personality, lifestyle, values, and humor. HitItOff builds a unique compatibility profile for you.",
  },
  {
    title: "Discover people nearby",
    description:
      "Browse profiles within your radius. See compatibility scores powered by quiz similarity and distance.",
  },
  {
    title: "Swipe, match, and chat",
    description:
      "Like profiles you connect with. When you both swipe right, it is a match — start chatting instantly.",
  },
  {
    title: "Stand out with video intros",
    description:
      "Add a 20-second video intro and connect Instagram photos so matches get a real feel for who you are.",
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
  { href: "/support", label: "Support" },
] as const;
