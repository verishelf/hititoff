import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { QuizQuestion } from '../components/QuizQuestion';
import { useUserStore } from '../store/userStore';
import { COLORS } from '../utils/constants';
import { headerText } from '../utils/typography';
import { hapticLight, hapticSelection, hapticSuccess } from '../utils/haptics';
import { QUIZ_QUESTIONS } from '../utils/quizData';
import type { QuizAnswers } from '../utils/quizScoring';
import { validateQuizAnswers } from '../utils/quizScoring';

interface QuizScreenProps {
  userId: string;
  onComplete: () => void;
}

export function QuizScreen({ userId, onComplete }: QuizScreenProps) {
  const { completeQuiz, isLoading } = useUserStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});

  const currentQuestion = QUIZ_QUESTIONS[currentIndex];

  const handleSelect = (optionId: string) => {
    hapticSelection();
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: optionId }));
  };

  const handleNext = async () => {
    if (!answers[currentQuestion.id]) {
      Alert.alert('Select an answer', 'Please choose an option to continue');
      return;
    }

    hapticLight();

    if (currentIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentIndex((i) => i + 1);
      return;
    }

    if (!validateQuizAnswers(answers)) {
      Alert.alert('Incomplete', 'Please answer all questions');
      return;
    }

    try {
      await completeQuiz(userId, answers);
      hapticSuccess();
      onComplete();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save quiz');
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      hapticLight();
      setCurrentIndex((i) => i - 1);
    }
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>Personality Quiz</Text>
        <Text style={styles.subheader}>
          Help us find your most compatible matches
        </Text>

        <QuizQuestion
          question={currentQuestion}
          questionIndex={currentIndex}
          totalQuestions={QUIZ_QUESTIONS.length}
          selectedOptionId={answers[currentQuestion.id]}
          onSelect={handleSelect}
        />

        <View style={styles.footer}>
          {currentIndex > 0 && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextBtn, currentIndex === 0 && styles.nextBtnFull]}
            onPress={handleNext}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={COLORS.text} />
            ) : (
              <Text style={styles.nextBtnText}>
                {currentIndex === QUIZ_QUESTIONS.length - 1 ? 'Finish' : 'Next'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    ...headerText,
    color: COLORS.text,
    fontSize: 24,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  subheader: {
    color: COLORS.textMuted,
    fontSize: 14,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    padding: 24,
    gap: 12,
  },
  backBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  backBtnText: { color: COLORS.textMuted, fontSize: 16, fontWeight: '600' },
  nextBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  nextBtnFull: { flex: 1 },
  nextBtnText: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
});
