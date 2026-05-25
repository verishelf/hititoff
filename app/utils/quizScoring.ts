import { QUIZ_DIMENSIONS, QUIZ_QUESTIONS } from './quizData';

export type QuizAnswers = Record<string, string>;

function l2Normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vector;
  return vector.map((v) => v / magnitude);
}

export function buildQuizVector(answers: QuizAnswers): number[] {
  const vector = new Array(QUIZ_DIMENSIONS).fill(0);

  for (const question of QUIZ_QUESTIONS) {
    const selectedOptionId = answers[question.id];
    if (!selectedOptionId) continue;

    const option = question.options.find((o) => o.id === selectedOptionId);
    if (!option) continue;

    option.weights.forEach((weight, index) => {
      vector[index] += weight;
    });
  }

  return l2Normalize(vector);
}

export function validateQuizAnswers(answers: QuizAnswers): boolean {
  return QUIZ_QUESTIONS.every((q) => Boolean(answers[q.id]));
}

export { QUIZ_QUESTIONS };
