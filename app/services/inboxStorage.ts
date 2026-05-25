import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = 'hititoff_dismissed_messages:';

export async function loadDismissedMessageMatchIds(userId: string): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(`${KEY_PREFIX}${userId}`);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((id): id is string => typeof id === 'string' && id.length > 0);
  } catch {
    return [];
  }
}

export async function saveDismissedMessageMatchIds(
  userId: string,
  matchIds: string[],
): Promise<void> {
  await AsyncStorage.setItem(`${KEY_PREFIX}${userId}`, JSON.stringify(matchIds));
}
