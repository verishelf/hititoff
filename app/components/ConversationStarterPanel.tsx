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
import { COLORS, FREE_AI_OPENERS_PER_DAY } from '../utils/constants';
import { generateConversationStartersForMatch } from '../services/chatService';
import { getAiUsageToday, type OpenerTone } from '../services/aiService';

const TONES: { id: OpenerTone; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'funny', label: 'Funny', icon: 'happy-outline' },
  { id: 'flirty', label: 'Flirty', icon: 'heart-outline' },
  { id: 'deep', label: 'Deep', icon: 'chatbubbles-outline' },
  { id: 'romantic', label: 'Romantic', icon: 'rose-outline' },
];

interface ConversationStarterPanelProps {
  matchId: string;
  isPremium: boolean;
  onSend: (text: string) => void;
  visible?: boolean;
}

export function ConversationStarterPanel({
  matchId,
  isPremium,
  onSend,
  visible = true,
}: ConversationStarterPanelProps) {
  const [tone, setTone] = useState<OpenerTone>('funny');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadSuggestions = useCallback(async () => {
    if (!isPremium) {
      const usage = await getAiUsageToday('openers');
      if (usage >= FREE_AI_OPENERS_PER_DAY) {
        Alert.alert(
          'Daily limit reached',
          `Free users get ${FREE_AI_OPENERS_PER_DAY} AI openers per day. Upgrade to HitItOff Pro for unlimited.`,
        );
        return;
      }
    }

    setLoading(true);
    try {
      const openers = await generateConversationStartersForMatch(matchId, tone);
      setSuggestions(openers);
      setExpanded(true);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not generate openers');
    } finally {
      setLoading(false);
    }
  }, [matchId, tone, isPremium]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {!expanded ? (
        <TouchableOpacity style={styles.triggerBtn} onPress={loadSuggestions} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color={COLORS.primary} />
              <Text style={styles.triggerText}>Get AI conversation starters</Text>
            </>
          )}
        </TouchableOpacity>
      ) : (
        <>
          <View style={styles.toneRow}>
            {TONES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.toneChip, tone === t.id && styles.toneChipActive]}
                onPress={() => setTone(t.id)}
              >
                <Ionicons
                  name={t.icon}
                  size={14}
                  color={tone === t.id ? COLORS.text : COLORS.textMuted}
                />
                <Text style={[styles.toneText, tone === t.id && styles.toneTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.regenBtn} onPress={loadSuggestions} disabled={loading}>
              <Ionicons name="refresh" size={18} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.suggestions}>
            {suggestions.map((suggestion, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionChip}
                onPress={() => onSend(suggestion)}
              >
                <Text style={styles.suggestionText} numberOfLines={3}>
                  {suggestion}
                </Text>
                <Ionicons name="send" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
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
  toneRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  toneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toneChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  toneText: { color: COLORS.textMuted, fontSize: 12, fontWeight: '500' },
  toneTextActive: { color: COLORS.text },
  regenBtn: { padding: 6, marginLeft: 'auto' },
  suggestions: { gap: 8 },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  suggestionText: { flex: 1, color: COLORS.text, fontSize: 14 },
});
