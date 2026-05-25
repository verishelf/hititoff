import { RADIUS_OPTIONS_MI } from './constants';

const EARTH_RADIUS_MI = 3958.8;

export { RADIUS_OPTIONS_MI as RADIUS_OPTIONS };

export function haversineMi(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_MI * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinRadius(distanceMi: number, radiusMi: number): boolean {
  return distanceMi <= radiusMi;
}

export function formatDistanceMi(distanceMi: number): string {
  if (distanceMi < 0.1) return 'Nearby';
  if (distanceMi < 10) return `${distanceMi.toFixed(1)} mi away`;
  return `${Math.round(distanceMi)} mi away`;
}

export function milesLabel(miles: number): string {
  return miles === 1 ? '1 mile' : `${miles} miles`;
}

export function radiusIndexForMiles(miles: number): number {
  const idx = RADIUS_OPTIONS_MI.indexOf(miles as (typeof RADIUS_OPTIONS_MI)[number]);
  return idx >= 0 ? idx : 1;
}

export function milesForRadiusIndex(index: number): number {
  const clamped = Math.max(0, Math.min(RADIUS_OPTIONS_MI.length - 1, Math.round(index)));
  return RADIUS_OPTIONS_MI[clamped];
}
