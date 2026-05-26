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
import { COLORS, FREE_PROFILE_REVIEWS_PER_DAY } from '../utils/constants';
import { getAiUsageToday, reviewProfile, type ProfileCoachResult } from '../services/aiService';

interface ProfileCoachPanelProps {
  isPremium: boolean;
  onApplyBio?: (bio: string) => void;
}

export function ProfileCoachPanel({ isPremium, onApplyBio }: ProfileCoachPanelProps) {
  const [loading, setLoading] = useState(false);
  const [coach, setCoach] = useState<ProfileCoachResult | null>(null);
  const [expanded, setExpanded] = useState(false);

  const loadReview = useCallback(async () => {
    if (!isPremium) {
      const usage = await getAiUsageToday('profile_coach');
      if (usage >= FREE_PROFILE_REVIEWS_PER_DAY) {
        Alert.alert(
          'Daily limit reached',
          `Free users get ${FREE_PROFILE_REVIEWS_PER_DAY} profile review per day. Upgrade to HitItOff Pro for unlimited.`,
        );
        return;
      }
    }

    setLoading(true);
    try {
      const result = await reviewProfile();
      setCoach(result);
      setExpanded(true);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not review profile');
    } finally {
      setLoading(false);
    }
  }, [isPremium]);

  return (
    <View style={styles.container}>
      {!expanded ? (
        <TouchableOpacity style={styles.triggerBtn} onPress={loadReview} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color={COLORS.primary} />
              <Text style={styles.triggerText}>AI profile coach</Text>
            </>
          )}
        </TouchableOpacity>
      ) : coach ? (
        <>
          <View style={styles.scoreRow}>
            <Text style={styles.scoreValue}>{coach.score}</Text>
            <Text style={styles.scoreLabel}>Profile strength</Text>
          </View>
          <Text style={styles.summary}>{coach.summary}</Text>

          <Text style={styles.sectionTitle}>Suggested bio</Text>
          <Text style={styles.bioSuggestion}>{coach.bio_suggestion}</Text>
          {onApplyBio && (
            <TouchableOpacity
              style={styles.applyBtn}
              onPress={() => onApplyBio(coach.bio_suggestion)}
            >
              <Text style={styles.applyText}>Use this bio</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>Photo tips</Text>
          {coach.photo_tips.map((tip, i) => (
            <Text key={i} style={styles.tip}>• {tip}</Text>
          ))}

          <Text style={styles.sectionTitle}>Prompt tips</Text>
          {coach.prompt_tips.map((tip, i) => (
            <Text key={i} style={styles.tip}>• {tip}</Text>
          ))}

          <TouchableOpacity style={styles.regenBtn} onPress={loadReview} disabled={loading}>
            <Ionicons name="refresh" size={18} color={COLORS.primary} />
            <Text style={styles.regenText}>Review again</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  triggerText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
  scoreRow: { alignItems: 'center', marginBottom: 12 },
  scoreValue: { color: COLORS.primary, fontSize: 36, fontWeight: '700' },
  scoreLabel: { color: COLORS.textMuted, fontSize: 12 },
  summary: { color: COLORS.text, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 8,
  },
  bioSuggestion: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  applyBtn: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,77,141,0.15)',
  },
  applyText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  tip: { color: COLORS.textMuted, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    paddingVertical: 8,
  },
  regenText: { color: COLORS.primary, fontSize: 14, fontWeight: '500' },
});
