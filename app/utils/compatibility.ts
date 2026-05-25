import { COMPATIBILITY_THRESHOLD, LOCATION_WEIGHT, QUIZ_WEIGHT } from './constants';

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] ** 2;
    magB += b[i] ** 2;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function quizSimilarity(a: number[], b: number[]): number {
  const similarity = cosineSimilarity(a, b);
  return Math.round(Math.max(0, Math.min(100, similarity * 100)));
}

export function locationScore(distanceMi: number, radiusMi: number): number {
  if (radiusMi <= 0) return 0;
  if (distanceMi >= radiusMi) return 0;
  return Math.round(100 * (1 - distanceMi / radiusMi));
}

export function finalCompatibility(quizScore: number, locScore: number): number {
  return Math.round(QUIZ_WEIGHT * quizScore + LOCATION_WEIGHT * locScore);
}

export function meetsCompatibilityThreshold(
  quizScore: number,
  locScore: number,
): boolean {
  return finalCompatibility(quizScore, locScore) >= COMPATIBILITY_THRESHOLD;
}
