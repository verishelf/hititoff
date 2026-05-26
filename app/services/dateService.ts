import { fetchDateSuggestions, type DateSuggestion } from './aiService';

export { type DateSuggestion };

export async function getDateSuggestions(matchId: string): Promise<DateSuggestion[]> {
  return fetchDateSuggestions(matchId);
}

export function openInMaps(lat: number, lng: number, label?: string): string {
  const encoded = encodeURIComponent(label ?? 'Date spot');
  return `https://maps.google.com/?q=${lat},${lng}(${encoded})`;
}
