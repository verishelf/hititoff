import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../utils/constants';
import { QUICK_RESPONSES } from '../utils/quickResponses';
import type { QuickResponseKey } from '../utils/quickResponses';

interface QuickResponseBarProps {
  onSelect: (key: QuickResponseKey, message: string) => void;
  visible?: boolean;
}

export function QuickResponseBar({ onSelect, visible = true }: QuickResponseBarProps) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Quick responses — no pressure, just clarity</Text>
      <View style={styles.row}>
        {QUICK_RESPONSES.map((template) => (
          <TouchableOpacity
            key={template.key}
            style={styles.chip}
            onPress={() => onSelect(template.key, template.message)}
          >
            <Text style={styles.chipText} numberOfLines={2}>
              {template.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  hint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  chipText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
  },
});
