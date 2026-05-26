import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';

export const INITIAL_SPARK_TEMPERATURE = 20;

interface SparkMeterProps {
  value: number;
  size?: number;
  label?: string;
  interactive?: boolean;
  /** True when showing the default baseline before chemistry data loads */
  isInitialBaseline?: boolean;
  messageCount?: number;
  onViewDetails?: () => void;
}

function getExplanation(
  value: number,
  messageCount: number,
  isInitialBaseline: boolean,
): { title: string; body: string; tip: string } {
  const atBaseline =
    value <= INITIAL_SPARK_TEMPERATURE && (messageCount === 0 || isInitialBaseline);

  if (atBaseline) {
    return {
      title: 'Why 20%?',
      body:
        'Every new match starts at 20% conversation temperature. You already matched on compatibility — this score tracks how the chat is going in real time.',
      tip: 'Reply thoughtfully, ask open questions, and share a little about yourself. Faster responses, deeper messages, and humor all push temperature higher.',
    };
  }

  if (value <= 35) {
    return {
      title: `${value}% — warming up`,
      body:
        'The conversation is still finding its rhythm. Early messages set the tone, so curiosity beats one-word replies.',
      tip: 'Try referencing something specific from their profile or your last exchange.',
    };
  }

  if (value <= 55) {
    return {
      title: `${value}% — building momentum`,
      body:
        'You are past the awkward phase. Both sides are engaging, but there is room to go deeper or suggest meeting up.',
      tip: 'Share a short story or ask something that cannot be answered with yes or no.',
    };
  }

  if (value <= 75) {
    return {
      title: `${value}% — strong connection`,
      body:
        'Response energy and engagement are solid. This is the zone where most conversations turn into real dates.',
      tip: 'If it feels right, suggest a low-pressure first meetup — coffee or a walk works great.',
    };
  }

  return {
    title: `${value}% — on fire`,
    body:
      'High mutual energy, good back-and-forth, and real chemistry showing up in your messages.',
    tip: 'Keep the momentum — lock in a date while the vibe is hot.',
  };
}

export function SparkMeter({
  value,
  size = 80,
  label = 'Temperature',
  interactive = true,
  isInitialBaseline = false,
  messageCount = 0,
  onViewDetails,
}: SparkMeterProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const clamped = Math.max(0, Math.min(100, value));
  const innerSize = size - 10;
  const explanation = getExplanation(clamped, messageCount, isInitialBaseline);

  const circle = (
    <View
      style={[
        styles.outerRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          ...Platform.select({
            ios: {
              shadowColor: COLORS.primary,
              shadowOffset: { width: 0, height: Math.max(4, size * 0.08) },
              shadowOpacity: 0.55,
              shadowRadius: Math.max(8, size * 0.12),
            },
            android: { elevation: 10 },
          }),
        },
      ]}
    >
      <LinearGradient
        colors={['#ff7eb3', COLORS.primary, COLORS.primaryDark, '#8b1048']}
        locations={[0, 0.35, 0.72, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={[
          styles.sphere,
          {
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.08)', 'transparent']}
          locations={[0, 0.45, 1]}
          start={{ x: 0.25, y: 0.05 }}
          end={{ x: 0.75, y: 0.85 }}
          style={[
            styles.gloss,
            {
              width: innerSize * 0.72,
              height: innerSize * 0.42,
              borderRadius: innerSize * 0.36,
              top: innerSize * 0.06,
              left: innerSize * 0.14,
            },
          ]}
        />

        <View
          style={[
            styles.fillGlow,
            {
              width: innerSize - 6,
              height: innerSize - 6,
              borderRadius: (innerSize - 6) / 2,
              opacity: 0.15 + (clamped / 100) * 0.55,
            },
          ]}
        />

        <View style={styles.rimBottom} />

        <Text style={[styles.value, { fontSize: size * 0.26 }]}>{clamped}%</Text>
      </LinearGradient>
    </View>
  );

  return (
    <>
      <View style={styles.container}>
        {interactive ? (
          <Pressable
            onPress={() => setModalVisible(true)}
            style={({ pressed }) => [pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Conversation temperature ${clamped} percent. Tap for explanation.`}
          >
            {circle}
          </Pressable>
        ) : (
          circle
        )}
        {label ? <Text style={styles.label}>{label}</Text> : null}
      </View>

      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View style={styles.modalMeterWrap}>
                <SparkMeter
                  value={clamped}
                  size={72}
                  label=""
                  interactive={false}
                />
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
              >
                <Ionicons name="close" size={24} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>{explanation.title}</Text>
            <Text style={styles.modalBody}>{explanation.body}</Text>
            <View style={styles.tipBox}>
              <Ionicons name="bulb-outline" size={18} color={COLORS.primary} />
              <Text style={styles.tipText}>{explanation.tip}</Text>
            </View>

            {clamped <= INITIAL_SPARK_TEMPERATURE && (
              <Text style={styles.baselineNote}>
                20% is the starting baseline for every match — not a judgment on compatibility,
                which you already passed by matching.
              </Text>
            )}

            {onViewDetails ? (
              <TouchableOpacity
                style={styles.detailsBtn}
                onPress={() => {
                  setModalVisible(false);
                  onViewDetails();
                }}
              >
                <Text style={styles.detailsBtnText}>View chemistry timeline</Text>
                <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.gotItBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.gotItText}>Got it</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 4 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.96 }] },
  outerRing: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5a1538',
  },
  sphere: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  gloss: {
    position: 'absolute',
    transform: [{ rotate: '-18deg' }],
  },
  fillGlow: {
    position: 'absolute',
    backgroundColor: '#fff',
  },
  rimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '28%',
    backgroundColor: 'rgba(0,0,0,0.22)',
    borderBottomLeftRadius: 999,
    borderBottomRightRadius: 999,
  },
  value: {
    color: COLORS.text,
    fontWeight: '800',
    zIndex: 2,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modalMeterWrap: { marginLeft: -4, marginTop: -8 },
  modalTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  modalBody: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 14,
  },
  tipBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipText: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
  },
  baselineNote: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    marginBottom: 8,
  },
  detailsBtnText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  gotItBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  gotItText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
