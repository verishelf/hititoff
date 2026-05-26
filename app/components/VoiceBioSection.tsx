import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../utils/constants';
import { WaveformPlayer } from './WaveformPlayer';

interface VoiceBioSectionProps {
  voiceBioUrl?: string | null;
  vibeSummary?: string | null;
  onPlay?: () => void;
}

export function VoiceBioSection({
  voiceBioUrl,
  vibeSummary,
  onPlay,
}: VoiceBioSectionProps) {
  if (!voiceBioUrl && !vibeSummary) return null;

  return (
    <View style={styles.container}>
      {vibeSummary && (
        <Text style={styles.summary}>"{vibeSummary}"</Text>
      )}
      {voiceBioUrl && (
        <WaveformPlayer onPress={onPlay} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  summary: {
    color: COLORS.accent,
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '500',
  },
});
