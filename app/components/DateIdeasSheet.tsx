import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FREE_DATE_SUGGESTIONS_PER_WEEK } from '../utils/constants';
import { getDateSuggestions, type DateSuggestion } from '../services/dateService';
import { getDateSuggestionsUsageThisWeek } from '../services/aiService';
import { DateMapPreview } from './DateMapPreview';

interface DateIdeasSheetProps {
  visible: boolean;
  matchId: string;
  isPremium?: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export function DateIdeasSheet({
  visible,
  matchId,
  isPremium = false,
  onClose,
  onUpgrade,
}: DateIdeasSheetProps) {
  const [suggestions, setSuggestions] = useState<DateSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<DateSuggestion | null>(null);

  const load = useCallback(async () => {
    if (!isPremium) {
      const usage = await getDateSuggestionsUsageThisWeek();
      if (usage >= FREE_DATE_SUGGESTIONS_PER_WEEK) {
        Alert.alert(
          'Weekly limit reached',
          `Free users get ${FREE_DATE_SUGGESTIONS_PER_WEEK} date suggestion set per week. Upgrade to HitItOff Pro for unlimited.`,
          [
            { text: 'Not now', style: 'cancel', onPress: onClose },
            { text: 'Upgrade', onPress: onUpgrade },
          ],
        );
        return;
      }
    }

    setLoading(true);
    try {
      const results = await getDateSuggestions(matchId);
      setSuggestions(results);
    } catch (e) {
      const message = e instanceof Error ? e.message : '';
      if (message.includes('limit')) {
        Alert.alert('Limit reached', message, [
          { text: 'Not now', style: 'cancel', onPress: onClose },
          { text: 'Upgrade', onPress: onUpgrade },
        ]);
        return;
      }
      setSuggestions([
        {
          title: 'Coffee & Conversation',
          description: 'Find a cozy local café to chat over coffee.',
          category: 'coffee',
        },
        {
          title: 'Scenic Walk',
          description: 'Take a relaxed walk and discover something new together.',
          category: 'outdoor',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [isPremium, matchId, onClose, onUpgrade]);

  useEffect(() => {
    if (visible) load();
  }, [visible, load]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Date Ideas</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.primary} style={styles.loader} />
          ) : (
            <ScrollView style={styles.list}>
              {suggestions.map((suggestion, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.card}
                  onPress={() => {
                    if (suggestion.lat && suggestion.lng) {
                      setSelectedPlace(suggestion);
                      setMapVisible(true);
                    }
                  }}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{suggestion.title}</Text>
                    <Text style={styles.category}>{suggestion.category}</Text>
                  </View>
                  <Text style={styles.description}>{suggestion.description}</Text>
                  {suggestion.lat && suggestion.lng && (
                    <View style={styles.mapLink}>
                      <Ionicons name="map-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.mapLinkText}>View on map</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>

      <DateMapPreview
        visible={mapVisible}
        suggestion={selectedPlace}
        onClose={() => setMapVisible(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: { color: COLORS.text, fontSize: 18, fontWeight: '700' },
  loader: { padding: 40 },
  list: { padding: 16 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: '600', flex: 1 },
  category: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  description: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20 },
  mapLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  mapLinkText: { color: COLORS.primary, fontSize: 13, fontWeight: '500' },
});
