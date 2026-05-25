import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../utils/constants';
import { headerText } from '../utils/typography';
import type { QuizQuestionDef } from '../utils/quizData';

interface QuizQuestionProps {
  question: QuizQuestionDef;
  questionIndex: number;
  totalQuestions: number;
  selectedOptionId?: string;
  onSelect: (optionId: string) => void;
}

export function QuizQuestion({
  question,
  questionIndex,
  totalQuestions,
  selectedOptionId,
  onSelect,
}: QuizQuestionProps) {
  const progress = ((questionIndex + 1) / totalQuestions) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <Text style={styles.category}>{question.category}</Text>
      <Text style={styles.question}>{question.text}</Text>
      <Text style={styles.counter}>
        {questionIndex + 1} of {totalQuestions}
      </Text>

      <View style={styles.options}>
        {question.options.map((option) => {
          const selected = selectedOptionId === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => onSelect(option.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  category: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  question: {
    ...headerText,
    color: COLORS.text,
    fontSize: 22,
    lineHeight: 30,
    marginBottom: 8,
  },
  counter: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginBottom: 24,
  },
  options: {
    gap: 12,
  },
  option: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  optionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(255, 77, 141, 0.12)',
  },
  optionText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '500',
  },
  optionTextSelected: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
