export type QuizCategory =
  | 'personality'
  | 'lifestyle'
  | 'relationship'
  | 'humor'
  | 'values';

export interface QuizOption {
  id: string;
  label: string;
  weights: number[];
}

export interface QuizQuestionDef {
  id: string;
  category: QuizCategory;
  text: string;
  options: QuizOption[];
}

export const QUIZ_DIMENSIONS = 8;

export const QUIZ_QUESTIONS: QuizQuestionDef[] = [
  {
    id: 'q1',
    category: 'personality',
    text: 'At a party, you usually...',
    options: [
      { id: 'a', label: 'Mingle with everyone', weights: [0.9, 0.2, 0.1, 0.3, 0.5, 0.4, 0.6, 0.2] },
      { id: 'b', label: 'Stick with close friends', weights: [0.2, 0.8, 0.7, 0.4, 0.3, 0.5, 0.2, 0.6] },
      { id: 'c', label: 'Find a quiet corner', weights: [0.1, 0.9, 0.8, 0.6, 0.2, 0.7, 0.1, 0.8] },
      { id: 'd', label: 'Leave early', weights: [0.3, 0.7, 0.9, 0.8, 0.1, 0.9, 0.2, 0.9] },
    ],
  },
  {
    id: 'q2',
    category: 'personality',
    text: 'How do you handle stress?',
    options: [
      { id: 'a', label: 'Talk it out', weights: [0.8, 0.3, 0.2, 0.4, 0.7, 0.3, 0.5, 0.2] },
      { id: 'b', label: 'Exercise or move', weights: [0.5, 0.6, 0.3, 0.2, 0.4, 0.2, 0.8, 0.3] },
      { id: 'c', label: 'Need alone time', weights: [0.2, 0.9, 0.8, 0.7, 0.3, 0.8, 0.2, 0.7] },
      { id: 'd', label: 'Distract with hobbies', weights: [0.4, 0.5, 0.5, 0.3, 0.5, 0.4, 0.6, 0.5] },
    ],
  },
  {
    id: 'q3',
    category: 'lifestyle',
    text: 'Your ideal weekend looks like...',
    options: [
      { id: 'a', label: 'Adventure outdoors', weights: [0.7, 0.3, 0.2, 0.1, 0.6, 0.2, 0.9, 0.3] },
      { id: 'b', label: 'Brunch and city exploring', weights: [0.8, 0.4, 0.3, 0.2, 0.7, 0.3, 0.5, 0.4] },
      { id: 'c', label: 'Cozy at home', weights: [0.2, 0.8, 0.7, 0.6, 0.3, 0.8, 0.2, 0.7] },
      { id: 'd', label: 'Spontaneous plans', weights: [0.9, 0.2, 0.1, 0.2, 0.8, 0.1, 0.7, 0.2] },
    ],
  },
  {
    id: 'q4',
    category: 'lifestyle',
    text: 'How structured is your daily routine?',
    options: [
      { id: 'a', label: 'Very planned', weights: [0.3, 0.7, 0.8, 0.6, 0.4, 0.9, 0.5, 0.8] },
      { id: 'b', label: 'Loose framework', weights: [0.6, 0.5, 0.5, 0.4, 0.6, 0.5, 0.6, 0.5] },
      { id: 'c', label: 'Go with the flow', weights: [0.9, 0.2, 0.2, 0.2, 0.8, 0.2, 0.7, 0.2] },
      { id: 'd', label: 'Changes daily', weights: [0.8, 0.3, 0.3, 0.3, 0.7, 0.3, 0.8, 0.3] },
    ],
  },
  {
    id: 'q5',
    category: 'relationship',
    text: 'In a relationship, you value most...',
    options: [
      { id: 'a', label: 'Deep emotional connection', weights: [0.5, 0.7, 0.9, 0.8, 0.6, 0.8, 0.3, 0.7] },
      { id: 'b', label: 'Shared adventures', weights: [0.9, 0.3, 0.2, 0.2, 0.8, 0.2, 0.9, 0.3] },
      { id: 'c', label: 'Stability and trust', weights: [0.3, 0.8, 0.9, 0.7, 0.4, 0.9, 0.4, 0.8] },
      { id: 'd', label: 'Intellectual spark', weights: [0.6, 0.6, 0.7, 0.5, 0.7, 0.6, 0.5, 0.6] },
    ],
  },
  {
    id: 'q6',
    category: 'relationship',
    text: 'How soon do you like to meet in person?',
    options: [
      { id: 'a', label: 'Within a few days', weights: [0.9, 0.2, 0.1, 0.2, 0.8, 0.2, 0.8, 0.2] },
      { id: 'b', label: 'After good chat', weights: [0.6, 0.5, 0.5, 0.4, 0.6, 0.5, 0.5, 0.5] },
      { id: 'c', label: 'Take my time', weights: [0.2, 0.8, 0.8, 0.7, 0.3, 0.8, 0.2, 0.8] },
      { id: 'd', label: 'Video call first', weights: [0.4, 0.7, 0.7, 0.6, 0.5, 0.7, 0.3, 0.7] },
    ],
  },
  {
    id: 'q7',
    category: 'humor',
    text: 'Your humor style is mostly...',
    options: [
      { id: 'a', label: 'Witty and sarcastic', weights: [0.7, 0.5, 0.4, 0.3, 0.8, 0.4, 0.6, 0.3] },
      { id: 'b', label: 'Goofy and playful', weights: [0.9, 0.3, 0.2, 0.2, 0.9, 0.2, 0.8, 0.2] },
      { id: 'c', label: 'Dry and subtle', weights: [0.4, 0.7, 0.6, 0.5, 0.5, 0.6, 0.3, 0.6] },
      { id: 'd', label: 'Wholesome and warm', weights: [0.5, 0.6, 0.8, 0.7, 0.6, 0.7, 0.4, 0.8] },
    ],
  },
  {
    id: 'q8',
    category: 'humor',
    text: 'How important is making each other laugh?',
    options: [
      { id: 'a', label: 'Essential', weights: [0.8, 0.4, 0.3, 0.3, 0.9, 0.3, 0.7, 0.3] },
      { id: 'b', label: 'Very important', weights: [0.6, 0.5, 0.5, 0.4, 0.7, 0.5, 0.5, 0.5] },
      { id: 'c', label: 'Nice bonus', weights: [0.4, 0.6, 0.6, 0.5, 0.5, 0.6, 0.4, 0.6] },
      { id: 'd', label: 'Not a priority', weights: [0.2, 0.8, 0.8, 0.7, 0.3, 0.8, 0.2, 0.8] },
    ],
  },
  {
    id: 'q9',
    category: 'values',
    text: 'Family involvement in your life is...',
    options: [
      { id: 'a', label: 'Central', weights: [0.4, 0.7, 0.9, 0.8, 0.5, 0.9, 0.3, 0.9] },
      { id: 'b', label: 'Important but balanced', weights: [0.6, 0.5, 0.6, 0.5, 0.6, 0.6, 0.5, 0.6] },
      { id: 'c', label: 'Independent lifestyle', weights: [0.8, 0.4, 0.3, 0.3, 0.7, 0.3, 0.7, 0.3] },
      { id: 'd', label: 'Varies by season', weights: [0.5, 0.6, 0.5, 0.4, 0.5, 0.5, 0.5, 0.5] },
    ],
  },
  {
    id: 'q10',
    category: 'values',
    text: 'Career ambition vs work-life balance?',
    options: [
      { id: 'a', label: 'Career first', weights: [0.7, 0.4, 0.3, 0.3, 0.8, 0.4, 0.7, 0.3] },
      { id: 'b', label: 'Balance both', weights: [0.5, 0.6, 0.6, 0.5, 0.6, 0.6, 0.5, 0.6] },
      { id: 'c', label: 'Life outside work', weights: [0.3, 0.7, 0.8, 0.7, 0.4, 0.8, 0.3, 0.8] },
      { id: 'd', label: 'Still figuring it out', weights: [0.6, 0.5, 0.5, 0.4, 0.5, 0.5, 0.6, 0.5] },
    ],
  },
  {
    id: 'q11',
    category: 'personality',
    text: 'You recharge by...',
    options: [
      { id: 'a', label: 'Socializing', weights: [0.9, 0.2, 0.1, 0.2, 0.8, 0.2, 0.7, 0.2] },
      { id: 'b', label: 'Nature and quiet', weights: [0.3, 0.8, 0.7, 0.6, 0.4, 0.7, 0.6, 0.7] },
      { id: 'c', label: 'Creative projects', weights: [0.5, 0.7, 0.6, 0.5, 0.6, 0.6, 0.5, 0.6] },
      { id: 'd', label: 'Sleep and rest', weights: [0.2, 0.9, 0.8, 0.7, 0.3, 0.8, 0.2, 0.8] },
    ],
  },
  {
    id: 'q12',
    category: 'lifestyle',
    text: 'Morning or night person?',
    options: [
      { id: 'a', label: 'Early bird', weights: [0.4, 0.7, 0.7, 0.6, 0.5, 0.8, 0.6, 0.7] },
      { id: 'b', label: 'Night owl', weights: [0.7, 0.4, 0.4, 0.3, 0.7, 0.3, 0.5, 0.3] },
      { id: 'c', label: 'Depends on the day', weights: [0.6, 0.5, 0.5, 0.4, 0.6, 0.5, 0.5, 0.5] },
      { id: 'd', label: 'Always tired', weights: [0.5, 0.6, 0.6, 0.5, 0.5, 0.6, 0.4, 0.6] },
    ],
  },
  {
    id: 'q13',
    category: 'relationship',
    text: 'Conflict in relationships...',
    options: [
      { id: 'a', label: 'Address immediately', weights: [0.7, 0.4, 0.4, 0.3, 0.8, 0.4, 0.6, 0.4] },
      { id: 'b', label: 'Cool off then talk', weights: [0.4, 0.7, 0.7, 0.6, 0.5, 0.7, 0.4, 0.7] },
      { id: 'c', label: 'Avoid when possible', weights: [0.2, 0.8, 0.8, 0.7, 0.3, 0.8, 0.2, 0.8] },
      { id: 'd', label: 'Write it out first', weights: [0.3, 0.8, 0.7, 0.6, 0.4, 0.8, 0.3, 0.7] },
    ],
  },
  {
    id: 'q14',
    category: 'values',
    text: 'Long-term, you want...',
    options: [
      { id: 'a', label: 'Marriage and family', weights: [0.4, 0.7, 0.9, 0.8, 0.5, 0.9, 0.3, 0.9] },
      { id: 'b', label: 'Committed partnership', weights: [0.5, 0.6, 0.8, 0.7, 0.6, 0.8, 0.4, 0.8] },
      { id: 'c', label: 'See where it goes', weights: [0.8, 0.3, 0.3, 0.2, 0.7, 0.3, 0.7, 0.3] },
      { id: 'd', label: 'Not sure yet', weights: [0.6, 0.5, 0.5, 0.4, 0.5, 0.5, 0.6, 0.5] },
    ],
  },
  {
    id: 'q15',
    category: 'humor',
    text: 'Pet peeves in dating apps?',
    options: [
      { id: 'a', label: 'Low effort profiles', weights: [0.6, 0.6, 0.7, 0.6, 0.7, 0.7, 0.5, 0.7] },
      { id: 'b', label: 'Ghosting', weights: [0.5, 0.7, 0.8, 0.7, 0.6, 0.8, 0.4, 0.8] },
      { id: 'c', label: 'Too much small talk', weights: [0.8, 0.4, 0.3, 0.3, 0.8, 0.3, 0.7, 0.3] },
      { id: 'd', label: 'Moving too fast', weights: [0.3, 0.8, 0.8, 0.7, 0.4, 0.8, 0.3, 0.8] },
    ],
  },
];
