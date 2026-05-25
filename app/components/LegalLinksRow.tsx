import * as WebBrowser from 'expo-web-browser';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import {
  COLORS,
  EULA_URL,
  PRIVACY_POLICY_URL,
  TERMS_OF_SERVICE_URL,
} from '../utils/constants';

async function openLegalUrl(url: string) {
  await WebBrowser.openBrowserAsync(url);
}

export function LegalLinksRow() {
  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={() => void openLegalUrl(TERMS_OF_SERVICE_URL)}>
        <Text style={styles.link}>Terms</Text>
      </TouchableOpacity>
      <Text style={styles.separator}>·</Text>
      <TouchableOpacity onPress={() => void openLegalUrl(PRIVACY_POLICY_URL)}>
        <Text style={styles.link}>Privacy</Text>
      </TouchableOpacity>
      <Text style={styles.separator}>·</Text>
      <TouchableOpacity onPress={() => void openLegalUrl(EULA_URL)}>
        <Text style={styles.link}>EULA</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
  },
  link: {
    color: COLORS.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  separator: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
