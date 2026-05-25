import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View, type ImageStyle, type StyleProp } from 'react-native';
import { COLORS } from '../utils/constants';

interface ProfilePhotoProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  label?: string;
}

export function ProfilePhoto({ uri, style, label }: ProfilePhotoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderText}>{label?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={style}
      contentFit="cover"
      cachePolicy="memory-disk"
      recyclingKey={uri}
      onError={() => setFailed(true)}
    />
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: COLORS.primary,
    fontSize: 28,
    fontWeight: '700',
  },
});
