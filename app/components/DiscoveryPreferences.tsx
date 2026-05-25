import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState, type ReactNode } from 'react';
import type { DiscoveryPreferencesValue, UserProfile } from '../types';
import { AppScrollView } from './AppScrollView';
import { RadiusSelector } from './RadiusSelector';
import {
  COLORS,
  COMPATIBILITY_THRESHOLD,
  DEFAULT_PREF_AGE_MAX,
  DEFAULT_PREF_AGE_MIN,
  DEFAULT_PREF_MIN_COMPATIBILITY,
  DEFAULT_PREF_MIN_PHOTOS,
  INTEREST_OPTIONS,
  LOOKING_FOR_OPTIONS,
  MAX_USER_AGE,
  MIN_PHOTOS_FILTER_OPTIONS,
  MIN_USER_AGE,
  type LookingFor,
  type RadiusMi,
} from '../utils/constants';
import { headerText, navHeaderText } from '../utils/typography';

interface DiscoveryPreferencesProps {
  value: DiscoveryPreferencesValue;
  radiusMi: RadiusMi;
  isPremium: boolean;
  onSave: (preferences: DiscoveryPreferencesValue, radius: RadiusMi) => void | Promise<void>;
  onPremiumRequired: () => void;
}

const SHEET_MAX_HEIGHT = Dimensions.get('window').height * 0.88;
const SHEET_SCROLL_MAX_HEIGHT = SHEET_MAX_HEIGHT - 160;

interface PreferencesFormProps {
  draft: DiscoveryPreferencesValue;
  radiusMi: RadiusMi;
  isPremium: boolean;
  onPatch: (updates: Partial<DiscoveryPreferencesValue>) => void;
  onRadiusChange: (radius: RadiusMi) => void;
  onPremiumRequired: () => void;
}

function clampAge(value: number): number {
  return Math.min(MAX_USER_AGE, Math.max(MIN_USER_AGE, Math.round(value)));
}

function normalizeAgeRange(minAge: number, maxAge: number): { min: number; max: number } {
  const min = clampAge(minAge);
  const max = clampAge(maxAge);
  if (min <= max) return { min, max };
  return { min: max, max: min };
}

function SectionLabel({
  title,
  locked = false,
  subtitle,
}: {
  title: string;
  locked?: boolean;
  subtitle?: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionLabel}>{title}</Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {locked && <Ionicons name="lock-closed" size={14} color={COLORS.primary} />}
    </View>
  );
}

function OptionChips<T extends string | number>({
  options,
  selected,
  onSelect,
  formatLabel = (value) => String(value),
}: {
  options: readonly T[];
  selected: T;
  onSelect: (value: T) => void;
  formatLabel?: (value: T) => string;
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => {
        const active = selected === option;
        return (
          <Pressable
            key={String(option)}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onSelect(option)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>
              {formatLabel(option)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function ToggleRow({
  label,
  description,
  value,
  locked = false,
  onValueChange,
  onLockedPress,
}: {
  label: string;
  description: string;
  value: boolean;
  locked?: boolean;
  onValueChange: (next: boolean) => void;
  onLockedPress?: () => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Pressable
        style={styles.toggleCopy}
        onPress={locked ? onLockedPress : () => onValueChange(!value)}
      >
        <View style={styles.toggleTitleRow}>
          <Text style={styles.toggleLabel}>{label}</Text>
          {locked && <Ionicons name="lock-closed" size={12} color={COLORS.primary} />}
        </View>
        <Text style={styles.toggleDescription}>{description}</Text>
      </Pressable>
      <Switch
        value={value}
        onValueChange={(next) => {
          if (locked) {
            onLockedPress?.();
            return;
          }
          onValueChange(next);
        }}
        trackColor={{ false: COLORS.border, true: COLORS.primaryDark }}
        thumbColor={value ? COLORS.primary : COLORS.textMuted}
        disabled={locked}
      />
    </View>
  );
}

function PremiumSection({
  locked,
  onLockedPress,
  children,
}: {
  locked: boolean;
  onLockedPress: () => void;
  children: ReactNode;
}) {
  if (!locked) return <>{children}</>;

  return (
    <Pressable onPress={onLockedPress} style={styles.lockedSection}>
      {children}
    </Pressable>
  );
}

export function profileToDiscoveryPreferences(profile: UserProfile): DiscoveryPreferencesValue {
  return {
    looking_for: profile.looking_for ?? 'everyone',
    pref_age_min: profile.pref_age_min,
    pref_age_max: profile.pref_age_max,
    pref_min_compatibility: profile.pref_min_compatibility,
    pref_interest_filters: profile.pref_interest_filters,
    pref_min_photos: profile.pref_min_photos,
    pref_require_bio: profile.pref_require_bio,
    pref_require_video: profile.pref_require_video,
    pref_require_instagram: profile.pref_require_instagram,
  };
}

function countActiveFilters(value: DiscoveryPreferencesValue): number {
  let count = 0;
  if (value.pref_require_bio) count += 1;
  if (value.pref_require_video) count += 1;
  if (value.pref_require_instagram) count += 1;
  if (value.pref_min_photos > 1) count += 1;
  if (value.pref_min_compatibility !== DEFAULT_PREF_MIN_COMPATIBILITY) count += 1;
  if (value.pref_interest_filters.length > 0) count += 1;
  return count;
}

export function buildPreferencesSummary(
  value: DiscoveryPreferencesValue,
  radiusMi: RadiusMi,
): string {
  const genderLabel =
    LOOKING_FOR_OPTIONS.find((option) => option.id === value.looking_for)?.label ?? 'Everyone';

  const parts = [
    genderLabel,
    `${radiusMi} mi`,
    `${value.pref_age_min}-${value.pref_age_max}`,
  ];

  const activeFilters = countActiveFilters(value);
  if (activeFilters > 0) {
    parts.push(`${activeFilters} filter${activeFilters === 1 ? '' : 's'}`);
  }

  return parts.join(' · ');
}

function PreferencesForm({
  draft,
  radiusMi,
  isPremium,
  onPatch,
  onRadiusChange,
  onPremiumRequired,
}: PreferencesFormProps) {
  const [minAge, setMinAge] = useState(draft.pref_age_min);
  const [maxAge, setMaxAge] = useState(draft.pref_age_max);
  const [minCompatibility, setMinCompatibility] = useState(draft.pref_min_compatibility);

  const toggleInterest = (interest: string) => {
    if (!isPremium) {
      onPremiumRequired();
      return;
    }

    const next = draft.pref_interest_filters.includes(interest)
      ? draft.pref_interest_filters.filter((item) => item !== interest)
      : [...draft.pref_interest_filters, interest];

    onPatch({ pref_interest_filters: next });
  };

  const commitAgeRange = (nextMin: number, nextMax: number) => {
    if (!isPremium) {
      onPremiumRequired();
      setMinAge(draft.pref_age_min);
      setMaxAge(draft.pref_age_max);
      return;
    }

    const { min, max } = normalizeAgeRange(nextMin, nextMax);
    setMinAge(min);
    setMaxAge(max);
    onPatch({ pref_age_min: min, pref_age_max: max });
  };

  const commitCompatibility = (next: number) => {
    if (!isPremium) {
      onPremiumRequired();
      setMinCompatibility(draft.pref_min_compatibility);
      return;
    }

    const rounded = Math.round(next);
    setMinCompatibility(rounded);
    onPatch({ pref_min_compatibility: rounded });
  };

  return (
    <View style={styles.sections}>
      <View style={styles.section}>
        <SectionLabel title="Search radius" subtitle="How far to look for matches" />
        <RadiusSelector
          embedded
          selected={radiusMi}
          isPremium={isPremium}
          onSelect={onRadiusChange}
          onPremiumRequired={onPremiumRequired}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <SectionLabel title="Show me" subtitle="Who you want to discover" />
        <OptionChips
          options={LOOKING_FOR_OPTIONS.map((option) => option.id)}
          selected={draft.looking_for}
          onSelect={(looking_for) => onPatch({ looking_for })}
          formatLabel={(id) => LOOKING_FOR_OPTIONS.find((option) => option.id === id)?.label ?? id}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <SectionLabel title="Age range" locked={!isPremium} subtitle="Filter by age" />
        <PremiumSection locked={!isPremium} onLockedPress={onPremiumRequired}>
          <View style={styles.valuePill}>
            <Text style={styles.valuePillText}>
              {minAge}–{maxAge} years
            </Text>
          </View>
          <Text style={styles.sliderCaption}>Minimum age</Text>
          <Slider
            style={styles.slider}
            minimumValue={MIN_USER_AGE}
            maximumValue={MAX_USER_AGE - 1}
            step={1}
            value={minAge}
            onValueChange={(nextMin) => {
              if (!isPremium) return;
              const { min, max } = normalizeAgeRange(nextMin, maxAge);
              setMinAge(min);
              setMaxAge(max);
            }}
            onSlidingComplete={(nextMin) => commitAgeRange(nextMin, maxAge)}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.glassBorder}
            thumbTintColor={COLORS.text}
            disabled={!isPremium}
          />
          <Text style={styles.sliderCaption}>Maximum age</Text>
          <Slider
            style={styles.slider}
            minimumValue={MIN_USER_AGE + 1}
            maximumValue={MAX_USER_AGE}
            step={1}
            value={maxAge}
            onValueChange={(nextMax) => {
              if (!isPremium) return;
              const { min, max } = normalizeAgeRange(minAge, nextMax);
              setMinAge(min);
              setMaxAge(max);
            }}
            onSlidingComplete={(nextMax) => commitAgeRange(minAge, nextMax)}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.glassBorder}
            thumbTintColor={COLORS.text}
            disabled={!isPremium}
          />
        </PremiumSection>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <SectionLabel
          title="Minimum compatibility"
          locked={!isPremium}
          subtitle={`Default is ${COMPATIBILITY_THRESHOLD}%`}
        />
        <PremiumSection locked={!isPremium} onLockedPress={onPremiumRequired}>
          <View style={styles.valuePill}>
            <Text style={styles.valuePillText}>{minCompatibility}% match or higher</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={50}
            maximumValue={100}
            step={5}
            value={minCompatibility}
            onValueChange={(next) => {
              if (!isPremium) return;
              setMinCompatibility(Math.round(next));
            }}
            onSlidingComplete={commitCompatibility}
            minimumTrackTintColor={COLORS.primary}
            maximumTrackTintColor={COLORS.glassBorder}
            thumbTintColor={COLORS.text}
            disabled={!isPremium}
          />
        </PremiumSection>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <SectionLabel
          title="Shared interests"
          locked={!isPremium}
          subtitle="Match at least one selected interest"
        />
        <View style={styles.chips}>
          {INTEREST_OPTIONS.map((interest) => {
            const active = draft.pref_interest_filters.includes(interest);
            return (
              <TouchableOpacity
                key={interest}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleInterest(interest)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{interest}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {draft.pref_interest_filters.length === 0 && (
          <Text style={styles.helperText}>No selection means any interests</Text>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <SectionLabel title="Minimum photos" subtitle="Profiles must have at least this many" />
        <OptionChips
          options={MIN_PHOTOS_FILTER_OPTIONS}
          selected={
            MIN_PHOTOS_FILTER_OPTIONS.includes(
              draft.pref_min_photos as (typeof MIN_PHOTOS_FILTER_OPTIONS)[number],
            )
              ? (draft.pref_min_photos as (typeof MIN_PHOTOS_FILTER_OPTIONS)[number])
              : MIN_PHOTOS_FILTER_OPTIONS[0]
          }
          onSelect={(pref_min_photos) => {
            if (!isPremium && pref_min_photos > 2) {
              onPremiumRequired();
              return;
            }
            onPatch({ pref_min_photos });
          }}
          formatLabel={(count) => (count === 1 ? '1 photo' : `${count}+ photos`)}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <SectionLabel title="Profile quality" subtitle="Only show profiles that include" />
        <ToggleRow
          label="Has a bio"
          description="Bio is at least 10 characters"
          value={draft.pref_require_bio}
          onValueChange={(pref_require_bio) => onPatch({ pref_require_bio })}
        />
        <ToggleRow
          label="Has video intro"
          description="Uploaded a profile video"
          value={draft.pref_require_video}
          locked={!isPremium}
          onValueChange={(pref_require_video) => onPatch({ pref_require_video })}
          onLockedPress={onPremiumRequired}
        />
        <ToggleRow
          label="Has Instagram"
          description="Linked an Instagram account"
          value={draft.pref_require_instagram}
          locked={!isPremium}
          onValueChange={(pref_require_instagram) => onPatch({ pref_require_instagram })}
          onLockedPress={onPremiumRequired}
        />
      </View>
    </View>
  );
}

export function DiscoveryPreferences({
  value,
  radiusMi,
  isPremium,
  onSave,
  onPremiumRequired,
}: DiscoveryPreferencesProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [draftRadius, setDraftRadius] = useState(radiusMi);
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const summary = buildPreferencesSummary(value, radiusMi);

  const handleOpen = () => {
    setDraft(value);
    setDraftRadius(radiusMi);
    setFormKey((current) => current + 1);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handlePatch = useCallback((updates: Partial<DiscoveryPreferencesValue>) => {
    setDraft((current) => ({ ...current, ...updates }));
  }, []);

  const handleDone = async () => {
    setSaving(true);
    try {
      await onSave(draft, draftRadius);
      setOpen(false);
    } catch (error) {
      Alert.alert(
        'Could not save preferences',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const sheetContent = (
    <>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>Dating preferences</Text>
        <TouchableOpacity
          onPress={handleClose}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons name="close" size={22} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <AppScrollView
        style={styles.sheetScroll}
        contentContainerStyle={styles.sheetScrollContent}
        keyboardShouldPersistTaps="always"
        nestedScrollEnabled
      >
        <PreferencesForm
          key={formKey}
          draft={draft}
          radiusMi={draftRadius}
          isPremium={isPremium}
          onPatch={handlePatch}
          onRadiusChange={setDraftRadius}
          onPremiumRequired={onPremiumRequired}
        />
      </AppScrollView>

      <TouchableOpacity
        style={[styles.doneBtn, saving && styles.doneBtnDisabled]}
        onPress={() => void handleDone()}
        disabled={saving}
      >
        <Text style={styles.doneBtnText}>{saving ? 'Saving…' : 'Done'}</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={handleOpen}
        activeOpacity={0.85}
      >
        <View style={styles.triggerIcon}>
          <Ionicons name="options-outline" size={20} color={COLORS.primary} />
        </View>
        <View style={styles.triggerCopy}>
          <Text style={styles.triggerTitle}>Dating preferences</Text>
          <Text style={styles.triggerSummary} numberOfLines={2}>
            {summary}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={handleClose}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={handleClose} />
          <View style={styles.sheetOuter}>
            <View style={styles.sheet}>
              <View style={styles.sheetHandle} />
              {sheetContent}
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function defaultDiscoveryPreferences(looking_for: LookingFor | null): DiscoveryPreferencesValue {
  return {
    looking_for: looking_for ?? 'everyone',
    pref_age_min: DEFAULT_PREF_AGE_MIN,
    pref_age_max: DEFAULT_PREF_AGE_MAX,
    pref_min_compatibility: DEFAULT_PREF_MIN_COMPATIBILITY,
    pref_interest_filters: [],
    pref_min_photos: DEFAULT_PREF_MIN_PHOTOS,
    pref_require_bio: false,
    pref_require_video: false,
    pref_require_instagram: false,
  };
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  triggerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 77, 141, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerCopy: {
    flex: 1,
    gap: 2,
  },
  triggerTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  triggerSummary: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
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
    maxHeight: SHEET_MAX_HEIGHT,
    zIndex: 2,
  },
  sheet: {
    width: '100%',
    maxHeight: SHEET_MAX_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 28,
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
    marginTop: 10,
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    ...headerText,
    color: COLORS.text,
    fontSize: 20,
  },
  sheetScroll: {
    maxHeight: SHEET_SCROLL_MAX_HEIGHT,
  },
  sheetScrollContent: {
    paddingBottom: 8,
  },
  doneBtn: {
    marginTop: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnDisabled: {
    opacity: 0.65,
  },
  doneBtnText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  sections: {
    gap: 0,
  },
  section: {
    gap: 10,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
    opacity: 0.6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  sectionHeaderText: {
    flex: 1,
    gap: 2,
  },
  sectionLabel: {
    ...navHeaderText,
    color: COLORS.text,
    fontSize: 14,
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  lockedSection: {
    opacity: 0.92,
  },
  valuePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 77, 141, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 141, 0.25)',
  },
  valuePillText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: COLORS.text,
  },
  sliderCaption: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: -4,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  helperText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
  },
  toggleCopy: {
    flex: 1,
    gap: 2,
  },
  toggleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  toggleDescription: {
    color: COLORS.textMuted,
    fontSize: 12,
    lineHeight: 17,
  },
});
