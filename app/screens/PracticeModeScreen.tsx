import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AppFlatList } from '../components/AppFlatList';
import {
  evaluatePracticeSession,
  practiceChatReply,
  startPracticeSession,
  type PracticeEvaluation,
  type PracticeMessage,
} from '../services/aiService';
import { COLORS } from '../utils/constants';
import type { RootStackParamList } from '../types';

interface PracticeModeScreenProps {
  userId: string;
}

interface ChatLine {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function PracticeModeScreen({ userId: _userId }: PracticeModeScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [lines, setLines] = useState<ChatLine[]>([]);
  const [messages, setMessages] = useState<PracticeMessage[]>([]);
  const [personaName, setPersonaName] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [evaluation, setEvaluation] = useState<PracticeEvaluation | null>(null);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const { persona_name, message } = await startPracticeSession();
      setPersonaName(persona_name);
      const opener: ChatLine = { id: '0', role: 'assistant', content: message };
      setLines([opener]);
      setMessages([{ role: 'assistant', content: message }]);
      setStarted(true);
      setEvaluation(null);
    } catch (e) {
      Alert.alert('Pro feature', e instanceof Error ? e.message : 'Practice mode requires HitItOff Pro');
      navigation.navigate('Paywall');
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  const send = async () => {
    const content = text.trim();
    if (!content || loading) return;

    const userLine: ChatLine = { id: String(Date.now()), role: 'user', content };
    const nextMessages: PracticeMessage[] = [...messages, { role: 'user', content }];
    setLines((prev) => [...prev, userLine]);
    setMessages(nextMessages);
    setText('');
    setLoading(true);

    try {
      const { message } = await practiceChatReply(nextMessages);
      const assistantLine: ChatLine = {
        id: String(Date.now() + 1),
        role: 'assistant',
        content: message,
      };
      setLines((prev) => [...prev, assistantLine]);
      setMessages([...nextMessages, { role: 'assistant', content: message }]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not continue practice');
    } finally {
      setLoading(false);
    }
  };

  const finish = async () => {
    if (messages.length < 2) {
      Alert.alert('Keep going', 'Exchange at least a couple of messages before getting feedback.');
      return;
    }
    setLoading(true);
    try {
      const result = await evaluatePracticeSession(messages);
      setEvaluation(result);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not evaluate session');
    } finally {
      setLoading(false);
    }
  };

  const renderLine = ({ item }: { item: ChatLine }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.bubbleRow, isUser && styles.bubbleRowMine]}>
        <View style={[styles.bubble, isUser ? styles.bubbleMine : styles.bubbleTheirs]}>
          {!isUser && personaName ? (
            <Text style={styles.personaLabel}>{personaName}</Text>
          ) : null}
          <Text style={styles.bubbleText}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.gradient}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>Zero-pressure rehearsal with an AI match</Text>
        </View>

        {!started ? (
          <View style={styles.startPanel}>
            <Ionicons name="school-outline" size={48} color={COLORS.primary} />
            <Text style={styles.startTitle}>Practice mode</Text>
            <Text style={styles.startDesc}>
              Simulate a conversation, then get coaching feedback on your confidence and question quality.
            </Text>
            <TouchableOpacity style={styles.startBtn} onPress={start} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={COLORS.text} />
              ) : (
                <Text style={styles.startBtnText}>Start practice chat</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={90}
          >
            {evaluation ? (
              <View style={styles.evalPanel}>
                <Text style={styles.evalTitle}>Your coaching feedback</Text>
                <Text style={styles.evalScore}>Overall: {evaluation.overall_score}/100</Text>
                <Text style={styles.evalSub}>
                  Confidence {evaluation.confidence_score} · Questions {evaluation.question_quality}
                </Text>
                <Text style={styles.evalSummary}>{evaluation.summary}</Text>
                {evaluation.tips.map((tip, i) => (
                  <Text key={i} style={styles.evalTip}>• {tip}</Text>
                ))}
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={() => {
                    setStarted(false);
                    setLines([]);
                    setMessages([]);
                    setEvaluation(null);
                  }}
                >
                  <Text style={styles.startBtnText}>Practice again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <AppFlatList
                  data={lines}
                  keyExtractor={(item) => item.id}
                  renderItem={renderLine}
                  contentContainerStyle={styles.list}
                />
                <TouchableOpacity style={styles.finishBtn} onPress={finish} disabled={loading}>
                  <Text style={styles.finishText}>End & get feedback</Text>
                </TouchableOpacity>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Type your reply..."
                    placeholderTextColor={COLORS.textMuted}
                    value={text}
                    onChangeText={setText}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, (!text.trim() || loading) && styles.sendDisabled]}
                    onPress={send}
                    disabled={!text.trim() || loading}
                  >
                    <Ionicons name="send" size={20} color={COLORS.text} />
                  </TouchableOpacity>
                </View>
              </>
            )}
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 8 },
  subtitle: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center' },
  startPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  startTitle: { color: COLORS.text, fontSize: 22, fontWeight: '700' },
  startDesc: { color: COLORS.textMuted, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  startBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    marginTop: 16,
  },
  startBtnText: { color: COLORS.text, fontSize: 16, fontWeight: '600' },
  list: { padding: 16, flexGrow: 1 },
  bubbleRow: { marginBottom: 10, alignItems: 'flex-start' },
  bubbleRowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '85%', borderRadius: 18, padding: 12 },
  bubbleMine: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: {
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  personaLabel: { color: COLORS.primary, fontSize: 11, fontWeight: '600', marginBottom: 4 },
  bubbleText: { color: COLORS.text, fontSize: 15, lineHeight: 21 },
  finishBtn: { alignSelf: 'center', paddingVertical: 8 },
  finishText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.5 },
  evalPanel: { flex: 1, padding: 20 },
  evalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '700', marginBottom: 12 },
  evalScore: { color: COLORS.primary, fontSize: 28, fontWeight: '700' },
  evalSub: { color: COLORS.textMuted, fontSize: 13, marginBottom: 12 },
  evalSummary: { color: COLORS.text, fontSize: 15, lineHeight: 22, marginBottom: 12 },
  evalTip: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 6 },
});
