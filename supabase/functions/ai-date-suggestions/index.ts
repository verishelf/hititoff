import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { chatCompletion, hasOpenAI } from '../_shared/openai.ts';

const GOOGLE_PLACES_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY') ?? '';

interface DateSuggestion {
  title: string;
  description: string;
  category: string;
  place_name?: string;
  lat?: number;
  lng?: number;
}

function fallbackSuggestions(interests: string[], mood: string | null): DateSuggestion[] {
  const interest = interests[0] ?? 'coffee';
  return [
    {
      title: `${interest} & Conversation`,
      description: `Find a cozy spot to talk over shared interests in ${interest.toLowerCase()}.`,
      category: 'casual',
    },
    {
      title: 'Scenic Walk',
      description: 'Take a relaxed walk and discover something new together.',
      category: 'outdoor',
    },
    {
      title: 'Local Hidden Gem',
      description: 'Explore a neighborhood spot neither of you has tried yet.',
      category: 'adventure',
    },
  ];
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Unauthorized', 401);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return errorResponse('Unauthorized', 401);

    const { match_id } = await req.json();
    if (!match_id) return errorResponse('match_id required');

    const { data: match } = await supabase
      .from('matches')
      .select('user_a, user_b')
      .eq('id', match_id)
      .single();

    if (!match) return errorResponse('Match not found', 404);
    if (match.user_a !== user.id && match.user_b !== user.id) return errorResponse('Forbidden', 403);

    // Check cache
    const { data: cached } = await supabase
      .from('date_suggestions_cache')
      .select('suggestions, expires_at')
      .eq('match_id', match_id)
      .single();

    if (cached && new Date(cached.expires_at) > new Date()) {
      return jsonResponse({ suggestions: cached.suggestions });
    }

    const otherId = match.user_a === user.id ? match.user_b : match.user_a;
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, interests, current_mood, latitude, longitude, is_premium')
      .in('id', [user.id, otherId]);

    const myProfile = profiles?.find((p) => p.id === user.id);
    const otherProfile = profiles?.find((p) => p.id === otherId);
    if (!myProfile || !otherProfile) return errorResponse('Profiles not found', 404);

    if (!myProfile.is_premium) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekStartStr = weekStart.toISOString().slice(0, 10);

      const { data: weeklyUsage } = await supabase
        .from('ai_usage_daily')
        .select('count')
        .eq('user_id', user.id)
        .eq('feature', 'date_suggestions')
        .gte('date', weekStartStr);

      const weeklyTotal = (weeklyUsage ?? []).reduce((sum, row) => sum + (row.count ?? 0), 0);
      if (weeklyTotal >= 1) {
        return errorResponse('Weekly date suggestion limit reached. Upgrade to HitItOff Pro.', 429);
      }

      await supabase.rpc('increment_ai_usage', { p_feature: 'date_suggestions' });
    }

    const sharedInterests = (myProfile.interests ?? []).filter((i: string) =>
      (otherProfile.interests ?? []).includes(i)
    );

    const midLat = myProfile.latitude && otherProfile.latitude
      ? (myProfile.latitude + otherProfile.latitude) / 2
      : myProfile.latitude;
    const midLng = myProfile.longitude && otherProfile.longitude
      ? (myProfile.longitude + otherProfile.longitude) / 2
      : myProfile.longitude;

    let suggestions: DateSuggestion[] = fallbackSuggestions(sharedInterests, myProfile.current_mood);

    if (hasOpenAI()) {
      try {
        const content = await chatCompletion(
          'Generate 4 date ideas as JSON array with objects: { title, description, category }. Categories: coffee, restaurant, outdoor, event, adventure. Keep descriptions to 1 sentence.',
          JSON.stringify({
            shared_interests: sharedInterests,
            mood: myProfile.current_mood,
            location: midLat ? { lat: midLat, lng: midLng } : null,
          }),
          { temperature: 0.8 },
        );
        const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
        if (Array.isArray(parsed) && parsed.length > 0) {
          suggestions = parsed.slice(0, 4);
        }
      } catch {
        // Keep fallback
      }
    }

    // Enrich with Google Places if available
    if (GOOGLE_PLACES_API_KEY && midLat && midLng) {
      try {
        const query = sharedInterests.includes('Coffee') ? 'coffee shop' : 'restaurant';
        const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${midLat},${midLng}&radius=5000&type=${query.includes('coffee') ? 'cafe' : 'restaurant'}&key=${GOOGLE_PLACES_API_KEY}`;
        const placesRes = await fetch(placesUrl);
        const placesData = await placesRes.json();
        if (placesData.results?.[0]) {
          const place = placesData.results[0];
          suggestions.unshift({
            title: place.name,
            description: `Highly rated nearby spot — perfect for a first meetup.`,
            category: query.includes('coffee') ? 'coffee' : 'restaurant',
            place_name: place.name,
            lat: place.geometry?.location?.lat,
            lng: place.geometry?.location?.lng,
          });
        }
      } catch {
        // Keep AI suggestions
      }
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('date_suggestions_cache').upsert({
      match_id,
      suggestions,
      expires_at: expiresAt,
    });

    return jsonResponse({ suggestions });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
});
