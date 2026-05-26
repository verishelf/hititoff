import { Linking, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../utils/constants';
import { openInMaps, type DateSuggestion } from '../services/dateService';

interface DateMapPreviewProps {
  visible: boolean;
  suggestion: DateSuggestion | null;
  onClose: () => void;
}

export function DateMapPreview({ visible, suggestion, onClose }: DateMapPreviewProps) {
  if (!suggestion?.lat || !suggestion?.lng) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{suggestion.title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          <MapView
            style={styles.map}
            initialRegion={{
              latitude: suggestion.lat,
              longitude: suggestion.lng,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            <Marker
              coordinate={{ latitude: suggestion.lat, longitude: suggestion.lng }}
              title={suggestion.place_name ?? suggestion.title}
            />
          </MapView>

          <TouchableOpacity
            style={styles.openBtn}
            onPress={() => Linking.openURL(openInMaps(suggestion.lat!, suggestion.lng!, suggestion.title))}
          >
            <Ionicons name="navigate-outline" size={18} color={COLORS.text} />
            <Text style={styles.openBtnText}>Open in Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    padding: 24,
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: { color: COLORS.text, fontSize: 16, fontWeight: '600', flex: 1 },
  map: { height: 250 },
  openBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    padding: 16,
  },
  openBtnText: { color: COLORS.text, fontSize: 15, fontWeight: '600' },
});
