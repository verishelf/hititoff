export const RADIUS_OPTIONS_MI = [1, 5, 10, 25, 50] as const;
export type RadiusMi = (typeof RADIUS_OPTIONS_MI)[number];

/** @deprecated Use RADIUS_OPTIONS_MI */
export const RADIUS_OPTIONS = RADIUS_OPTIONS_MI;
/** @deprecated Use RadiusMi */
export type RadiusKm = RadiusMi;

export const FREE_MAX_RADIUS_MI = 3;
/** @deprecated Use FREE_MAX_RADIUS_MI */
export const FREE_MAX_RADIUS_KM = FREE_MAX_RADIUS_MI;

export const KM_PER_MILE = 1.60934;

export const FREE_DAILY_LIKES = 20;
export const FREE_MESSAGES_PER_MATCH = 3;
export const FREE_LIKED_YOU_PREVIEW = 1;
export const COMPATIBILITY_THRESHOLD = 70;
export const QUIZ_WEIGHT = 0.6;
export const LOCATION_WEIGHT = 0.4;
export const BOOST_DURATION_MINUTES = 30;

export const APP_SLOGAN = 'Better Matches, Closer';

export const WEBSITE_URL = 'https://hititoff.vercel.app';
export const PRIVACY_POLICY_URL = `${WEBSITE_URL}/privacy`;
export const TERMS_OF_SERVICE_URL = `${WEBSITE_URL}/terms`;
export const EULA_URL = `${WEBSITE_URL}/eula`;

/** RevenueCat entitlement identifier — must match dashboard exactly */
export const HITITOFF_PRO_ENTITLEMENT = 'HitItOff Pro';

/** @deprecated Use HITITOFF_PRO_ENTITLEMENT */
export const FLIKR_PRO_ENTITLEMENT = HITITOFF_PRO_ENTITLEMENT;

/** @deprecated Use HITITOFF_PRO_ENTITLEMENT */
export const PREMIUM_ENTITLEMENT = HITITOFF_PRO_ENTITLEMENT;

/** RevenueCat package identifiers within your offering */
export const PACKAGE_IDS = {
  weekly: 'weekly',
  monthly: 'monthly',
  yearly: 'yearly',
} as const;

/** @deprecated Use PACKAGE_IDS */
export const PRODUCT_IDS = PACKAGE_IDS;

export const STORAGE_BUCKET = 'profile-photos';

export const MAX_VIDEO_INTRO_SECONDS = 20;
export const MAX_INSTAGRAM_PHOTOS = 6;

export const GENDER_OPTIONS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'non_binary', label: 'Non-binary' },
] as const;

export type Gender = (typeof GENDER_OPTIONS)[number]['id'];

export const LOOKING_FOR_OPTIONS = [
  { id: 'male', label: 'Men' },
  { id: 'female', label: 'Women' },
  { id: 'everyone', label: 'Everyone' },
] as const;

export type LookingFor = (typeof LOOKING_FOR_OPTIONS)[number]['id'];

export const MIN_USER_AGE = 18;
export const MAX_USER_AGE = 99;
export const DEFAULT_PREF_AGE_MIN = 18;
export const DEFAULT_PREF_AGE_MAX = 55;
export const DEFAULT_PREF_MIN_COMPATIBILITY = 70;
export const DEFAULT_PREF_MIN_PHOTOS = 1;

export const MIN_PHOTOS_FILTER_OPTIONS = [1, 2, 3, 4, 5, 6] as const;
export type MinPhotosFilter = (typeof MIN_PHOTOS_FILTER_OPTIONS)[number];

export const COLORS = {
  background: '#120810',
  surface: '#1f1220',
  card: '#2a1830',
  primary: '#ff4d8d',
  primaryDark: '#c9185a',
  accent: '#ff8fab',
  text: '#ffffff',
  textMuted: '#b8a0ad',
  success: '#4ade80',
  danger: '#f87171',
  border: '#3d2845',
  overlay: 'rgba(0,0,0,0.6)',
  glassBorder: 'rgba(255,255,255,0.12)',
} as const;

export const INTEREST_OPTIONS = [
  'Travel',
  'Music',
  'Fitness',
  'Cooking',
  'Movies',
  'Art',
  'Gaming',
  'Reading',
  'Photography',
  'Dancing',
  'Hiking',
  'Coffee',
  'Wine',
  'Yoga',
  'Pets',
  'Tech',
] as const;

export const HITITOFF_PRO_FEATURES = [
  'Unlimited likes per day',
  'Unlimited messages',
  'Search up to 50 mi radius',
  'Advanced dating preferences',
  'See who liked you',
  'View all profile photos',
  'Compatibility scores on every profile',
  'Send & receive super likes',
  '20-second video intro',
  'Profile boosts',
  'Age, compatibility & interest filters',
  'Video & Instagram profile filters',
  'No ads',
] as const;

/** Discovery filters included with HitItOff Pro */
export const PRO_DISCOVERY_FILTERS = [
  'Age range',
  'Minimum compatibility score',
  'Shared interest filters',
  '3+ photo minimum',
  'Video intro filter',
  'Instagram filter',
] as const;

/** Discovery filters available on the free plan */
export const FREE_DISCOVERY_FILTERS = [
  'Show me (men, women, everyone)',
  'Search radius up to 3 mi',
  'Minimum photos (1–2)',
  'Has bio filter',
] as const;

export const HITITOFF_PRO_UPGRADE_BLURB =
  'Unlimited likes & messages, 50 mi radius, advanced dating preferences, boosts & more';
