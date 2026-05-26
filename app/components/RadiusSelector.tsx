import { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { HapticSlider } from './HapticSlider';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  FREE_MAX_RADIUS_MI,
  RADIUS_OPTIONS_MI,
  type RadiusMi,
} from '../utils/constants';
import { headerText } from '../utils/typography';
import {
  milesForRadiusIndex,
  milesLabel,
  radiusIndexForMiles,
} from '../utils/distance';

interface RadiusSelectorProps {
  selected: RadiusMi;
  isPremium: boolean;
  onSelect: (radius: RadiusMi) => void;
  onPremiumRequired: () => void;
  mini?: boolean;
  embedded?: boolean;
}

interface RadiusSliderPanelProps {
  selected: RadiusMi;
  isPremium: boolean;
  onSelect: (radius: RadiusMi) => void;
  onPremiumRequired: () => void;
  onDone: () => void;
}

function RadiusSliderPanel({
  selected,
  isPremium,
  onSelect,
  onPremiumRequired,
  onDone,
}: RadiusSliderPanelProps) {
  const [sliderIndex, setSliderIndex] = useState(radiusIndexForMiles(selected));
  const selectedMiles = milesForRadiusIndex(sliderIndex);

  useEffect(() => {
    setSliderIndex(radiusIndexForMiles(selected));
  }, [selected]);

  const handleSlidingComplete = (value: number) => {
    const index = Math.round(value);
    const miles = milesForRadiusIndex(index);

    if (!isPremium && miles > FREE_MAX_RADIUS_MI) {
      onPremiumRequired();
      setSliderIndex(radiusIndexForMiles(selected));
      return;
    }

    setSliderIndex(index);
    onSelect(miles as RadiusMi);
  };

  return (
    <View style={styles.sheet}>
      <View style={styles.sheetHandle} />

      <View style={styles.sliderHeader}>
        <Text style={styles.sheetTitle}>Search radius</Text>
        <TouchableOpacity onPress={onDone} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Ionicons name="close" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.valueRow}>
        <Text style={styles.sliderValue}>{milesLabel(selectedMiles)}</Text>
        {!isPremium && selectedMiles > FREE_MAX_RADIUS_MI && (
          <Ionicons name="lock-closed" size={14} color={COLORS.primary} />
        )}
      </View>

      <HapticSlider
        style={styles.slider}
        minimumValue={0}
        maximumValue={RADIUS_OPTIONS_MI.length - 1}
        step={1}
        value={sliderIndex}
        onValueChange={(v) => setSliderIndex(Math.round(v))}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.glassBorder}
        thumbTintColor={COLORS.text}
      />

      <View style={styles.tickRow}>
        {RADIUS_OPTIONS_MI.map((mi, i) => {
          const locked = !isPremium && mi > FREE_MAX_RADIUS_MI;
          return (
            <Text
              key={mi}
              style={[
                styles.tickLabel,
                i === sliderIndex && styles.tickLabelActive,
                locked && styles.tickLabelLocked,
              ]}
            >
              {mi}
            </Text>
          );
        })}
      </View>

      {!isPremium && (
        <Text style={styles.hint}>Free plan: up to {FREE_MAX_RADIUS_MI} mi</Text>
      )}

      <TouchableOpacity style={styles.doneBtn} onPress={onDone}>
        <Text style={styles.doneBtnText}>Done</Text>
      </TouchableOpacity>
    </View>
  );
}

function RadiusSliderInline({
  selected,
  isPremium,
  onSelect,
  onPremiumRequired,
}: Omit<RadiusSliderPanelProps, 'onDone'>) {
  const [sliderIndex, setSliderIndex] = useState(radiusIndexForMiles(selected));
  const selectedMiles = milesForRadiusIndex(sliderIndex);

  useEffect(() => {
    setSliderIndex(radiusIndexForMiles(selected));
  }, [selected]);

  const handleSlidingComplete = (value: number) => {
    const index = Math.round(value);
    const miles = milesForRadiusIndex(index);

    if (!isPremium && miles > FREE_MAX_RADIUS_MI) {
      onPremiumRequired();
      setSliderIndex(radiusIndexForMiles(selected));
      return;
    }

    setSliderIndex(index);
    onSelect(miles as RadiusMi);
  };

  return (
    <View style={styles.inlineWrap}>
      <View style={styles.inlineValueRow}>
        <Text style={styles.inlineValue}>{milesLabel(selectedMiles)}</Text>
        {!isPremium && selectedMiles > FREE_MAX_RADIUS_MI && (
          <Ionicons name="lock-closed" size={14} color={COLORS.primary} />
        )}
      </View>

      <HapticSlider
        style={styles.inlineSlider}
        minimumValue={0}
        maximumValue={RADIUS_OPTIONS_MI.length - 1}
        step={1}
        value={sliderIndex}
        onValueChange={(v) => setSliderIndex(Math.round(v))}
        onSlidingComplete={handleSlidingComplete}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.glassBorder}
        thumbTintColor={COLORS.text}
      />

      <View style={styles.tickRow}>
        {RADIUS_OPTIONS_MI.map((mi, i) => {
          const locked = !isPremium && mi > FREE_MAX_RADIUS_MI;
          return (
            <Text
              key={mi}
              style={[
                styles.tickLabel,
                i === sliderIndex && styles.tickLabelActive,
                locked && styles.tickLabelLocked,
              ]}
            >
              {mi}
            </Text>
          );
        })}
      </View>

      {!isPremium && (
        <Text style={styles.inlineHint}>Free plan: up to {FREE_MAX_RADIUS_MI} mi</Text>
      )}
    </View>
  );
}

export function RadiusSelector({
  selected,
  isPremium,
  onSelect,
  onPremiumRequired,
  mini = false,
  embedded = false,
}: RadiusSelectorProps) {
  const [open, setOpen] = useState(false);

  if (embedded) {
    return (
      <RadiusSliderInline
        selected={selected}
        isPremium={isPremium}
        onSelect={onSelect}
        onPremiumRequired={onPremiumRequired}
      />
    );
  }

  const locked = !isPremium && selected > FREE_MAX_RADIUS_MI;

  const trigger = mini ? (
    <TouchableOpacity
      style={styles.miniPill}
      onPress={() => setOpen(true)}
      activeOpacity={0.8}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 8 }}
    >
      <Text style={styles.miniText}>{selected} mi</Text>
      <Ionicons name="chevron-down" size={12} color={COLORS.textMuted} />
      {locked && <Ionicons name="lock-closed" size={10} color={COLORS.textMuted} />}
    </TouchableOpacity>
  ) : (
    <View style={styles.container}>
      <Text style={styles.label}>Search radius</Text>
      <TouchableOpacity
        style={styles.dropdown}
        onPress={() => setOpen(true)}
        activeOpacity={0.85}
      >
        <View style={styles.dropdownLeft}>
          <Ionicons name="navigate-outline" size={18} color={COLORS.primary} />
          <Text style={styles.dropdownValue}>{selected} mi</Text>
        </View>
        <View style={styles.dropdownRight}>
          {locked && <Ionicons name="lock-closed" size={14} color={COLORS.textMuted} />}
          <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      {trigger}

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={styles.sheetOuter}>
            <RadiusSliderPanel
              selected={selected}
              isPremium={isPremium}
              onSelect={onSelect}
              onPremiumRequired={onPremiumRequired}
              onDone={() => setOpen(false)}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  dropdownRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  miniText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  sheetOuter: {
    width: '100%',
    zIndex: 2,
  },
  sheet: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 34,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.border,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.glassBorder,
    marginBottom: 16,
  },
  sliderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    ...headerText,
    color: COLORS.text,
    fontSize: 18,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sliderValue: {
    ...headerText,
    color: COLORS.text,
    fontSize: 28,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  tickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  tickLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  tickLabelActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  tickLabelLocked: {
    opacity: 0.45,
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  doneBtn: {
    marginTop: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  inlineWrap: {
    gap: 4,
  },
  inlineValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inlineValue: {
    ...headerText,
    color: COLORS.text,
    fontSize: 20,
  },
  inlineSlider: {
    width: '100%',
    height: 36,
  },
  inlineHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
