import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import type { ChemistryEvent } from '../services/chemistryService';

const EVENT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  first_reply: 'chatbubble-outline',
  deep_convo: 'layers-outline',
  humor_match: 'happy-outline',
  spark_boost: 'flash-outline',
};

const EVENT_LABELS: Record<string, string> = {
  first_reply: 'First reply',
  deep_convo: 'Deep conversation',
  humor_match: 'Humor alignment',
  spark_boost: 'Spark boost',
};

interface ChemistryTimelineProps {
  events: ChemistryEvent[];
  sparkMeter: number;
  detailed?: boolean;
}

export function ChemistryTimeline({ events, sparkMeter, detailed = true }: ChemistryTimelineProps) {
  if (!detailed && events.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.sparkLabel}>Conversation temperature: {sparkMeter}%</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chemistry Timeline</Text>
      {events.length === 0 ? (
        <Text style={styles.empty}>Keep chatting to build your chemistry!</Text>
      ) : (
        events.map((event) => (
          <View key={event.id} style={styles.event}>
            <Ionicons
              name={EVENT_ICONS[event.event_type] ?? 'ellipse-outline'}
              size={16}
              color={COLORS.primary}
            />
            <View style={styles.eventContent}>
              <Text style={styles.eventLabel}>
                {EVENT_LABELS[event.event_type] ?? event.event_type}
              </Text>
              {event.delta > 0 && (
                <Text style={styles.eventDelta}>+{event.delta} spark</Text>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  title: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  sparkLabel: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  event: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  eventContent: { flex: 1 },
  eventLabel: { color: COLORS.text, fontSize: 12 },
  eventDelta: { color: COLORS.success, fontSize: 11 },
});
