export const PROFILE_PROMPTS = [
  'My ideal Sunday looks like...',
  'A green flag I look for is...',
  'The way to my heart is...',
  'I geek out about...',
  'My love language is...',
  'Best travel story...',
] as const;

export type ProfilePromptKey = (typeof PROFILE_PROMPTS)[number];

export interface ProfilePrompt {
  prompt: string;
  answer: string;
}
