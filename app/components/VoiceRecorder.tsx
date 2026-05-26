import { useCallback, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  useAudioRecorder,
  RecordingPresets,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
} from 'expo-audio';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { WaveformPlayer } from './WaveformPlayer';

interface VoiceRecorderProps {
  maxDurationSec?: number;
  onRecorded: (uri: string, durationMs: number) => void;
  label?: string;
}

export function VoiceRecorder({
  maxDurationSec = 30,
  onRecorded,
  label = 'Hold to record',
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);

  const startRecording = useCallback(async () => {
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Alert.alert('Permission needed', 'Microphone access is required to record voice.');
        return;
      }

      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setRecording(true);
      startTimeRef.current = Date.now();

      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed >= maxDurationSec * 1000) {
          stopRecording();
        }
      }, 500);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not start recording');
    }
  }, [audioRecorder, maxDurationSec]);

  const stopRecording = useCallback(async () => {
    if (!recording) return;
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      const elapsed = Date.now() - startTimeRef.current;
      setDurationMs(elapsed);
      setRecordedUri(uri ?? null);
      setRecording(false);

      if (uri) {
        onRecorded(uri, elapsed);
      }
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not stop recording');
      setRecording(false);
    }
  }, [audioRecorder, recording, onRecorded]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      {recordedUri ? (
        <View style={styles.playback}>
          <WaveformPlayer isPlaying={false} />
          <Text style={styles.duration}>{Math.round(durationMs / 1000)}s</Text>
          <TouchableOpacity
            onPress={() => {
              setRecordedUri(null);
              setDurationMs(0);
            }}
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.recordBtn, recording && styles.recordBtnActive]}
          onPressIn={startRecording}
          onPressOut={stopRecording}
        >
          <Ionicons
            name={recording ? 'mic' : 'mic-outline'}
            size={24}
            color={COLORS.text}
          />
          <Text style={styles.recordText}>
            {recording ? 'Recording...' : 'Tap & hold'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { color: COLORS.textMuted, fontSize: 13 },
  recordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'flex-start',
  },
  recordBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  recordText: { color: COLORS.text, fontSize: 14, fontWeight: '500' },
  playback: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
  },
  duration: { color: COLORS.textMuted, fontSize: 12 },
});
