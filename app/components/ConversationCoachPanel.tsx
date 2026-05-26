import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FREE_AI_CONVERSATION_COACH_PER_DAY } from '../utils/constants';
import { coachConversation, getAiUsageToday, type ConversationCoachResult } from '../services/aiService';

interface ConversationCoachPanelProps {
  matchId: string;
  isPremium: boolean;
  onSend: (text: string) => void;
  visible?: boolean;
}

export function ConversationCoachPanel({
  matchId,
  isPremium,
  onSend,
  visible = true,
}: ConversationCoachPanelProps) {
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [coach, setCoach] = useState<ConversationCoachResult | null>(null);

  const loadCoach = useCallback(async () => {
    if (!isPremium) {
      const usage = await getAiUsageToday('conversation_coach');
      if (usage >= FREE_AI_CONVERSATION_COACH_PER_DAY) {
        Alert.alert(
          'Daily limit reached',
          `Free users get ${FREE_AI_CONVERSATION_COACH_PER_DAY} conversation coach scans per day. Upgrade to HitItOff Pro for unlimited.`,
        );
        return;
      }
    }

    setLoading(true);
    try {
      const result = await coachConversation(matchId);
      setCoach(result);
      setExpanded(true);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not analyze conversation');
    } finally {
      setLoading(false);
    }
  }, [isPremium, matchId]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {!expanded ? (
        <TouchableOpacity style={styles.triggerBtn} onPress={loadCoach} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="thermometer-outline" size={18} color={COLORS.primary} />
              <Text style={styles.triggerText}>Coach this conversation</Text>
            </>
          )}
        </TouchableOpacity>
      ) : coach ? (
        <>
          <View style={styles.headerRow}>
            <View style={styles.tempBadge}>
              <Text style={styles.tempValue}>{coach.temperature}</Text>
              <Text style={styles.tempLabel}>Temperature</Text>
            </View>
            <TouchableOpacity onPress={loadCoach} disabled={loading}>
              <Ionicons name="refresh" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.diagnosis}>{coach.diagnosis}</Text>
          {coach.suggestions.map((suggestion, i) => (
            <View key={i} style={styles.suggestionCard}>
              <TouchableOpacity
                style={styles.suggestionRow}
                onPress={() => onSend(suggestion.text)}
              >
                <Text style={styles.suggestionText}>{suggestion.text}</Text>
                <Ionicons name="send" size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.reasoning}>{suggestion.reasoning}</Text>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12, paddingTop: 8 },
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'center',
    padding: 12,
  },
  triggerText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tempBadge: {
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tempValue: { color: COLORS.primary, fontSize: 22, fontWeight: '700' },
  tempLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '500' },
  diagnosis: {
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  suggestionCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  suggestionText: { flex: 1, color: COLORS.text, fontSize: 14 },
  reasoning: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
