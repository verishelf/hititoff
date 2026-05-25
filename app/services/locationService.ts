import * as Location from 'expo-location';
import { supabase } from './supabase';

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === Location.PermissionStatus.GRANTED;
}

export async function getCurrentCoordinates(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  const granted = await requestLocationPermission();
  if (!granted) return null;

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

export async function updateUserLocation(userId: string): Promise<boolean> {
  const coords = await getCurrentCoordinates();
  if (!coords) return false;

  const { error } = await supabase
    .from('profiles')
    .update({
      latitude: coords.latitude,
      longitude: coords.longitude,
      location_updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw new Error(error.message);
  return true;
}
