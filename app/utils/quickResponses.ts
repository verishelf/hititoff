export type QuickResponseKey = 'still_interested' | 'busy_continue' | 'not_feeling_it';

export interface QuickResponseTemplate {
  key: QuickResponseKey;
  label: string;
  message: string;
}

export const QUICK_RESPONSES: QuickResponseTemplate[] = [
  {
    key: 'still_interested',
    label: 'Still interested',
    message: "Hey! I'm still interested in getting to know you better 😊",
  },
  {
    key: 'busy_continue',
    label: 'Busy but want to continue',
    message: "I've been busy lately, but I'd love to keep chatting when you have a moment!",
  },
  {
    key: 'not_feeling_it',
    label: 'Not feeling the connection',
    message:
      "I think you're great, but I'm not feeling the romantic connection. Wishing you all the best! 💛",
  },
];

export function getQuickResponse(key: QuickResponseKey): QuickResponseTemplate {
  return QUICK_RESPONSES.find((r) => r.key === key) ?? QUICK_RESPONSES[0];
}
