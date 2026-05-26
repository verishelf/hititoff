import { supabase } from './supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

export type OpenerTone = 'funny' | 'flirty' | 'deep' | 'romantic';

export interface CompatibilityBreakdown {
  overall_score: number;
  chemistry_score: number;
  emotional_resonance: number;
  communication_compat: number;
  humor_alignment: number;
  factors?: Record<string, unknown>;
}

export interface ModerationResult {
  approved: boolean;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  flags: string[];
}

export interface DateSuggestion {
  title: string;
  description: string;
  category: string;
  place_name?: string;
  lat?: number;
  lng?: number;
}

export interface ConversationCoachResult {
  temperature: number;
  diagnosis: string;
  suggestions: { text: string; reasoning: string }[];
}

export interface MessageFlagResult {
  signal: 'green' | 'yellow' | 'red';
  headline: string;
  explanation: string;
}

export interface ProfileCoachResult {
  score: number;
  summary: string;
  bio_suggestion: string;
  photo_tips: string[];
  prompt_tips: string[];
}

export interface PracticeEvaluation {
  overall_score: number;
  confidence_score: number;
  question_quality: number;
  summary: string;
  tips: string[];
}

export type PracticeMessage = { role: 'user' | 'assistant'; content: string };

async function invokeFunction<T>(name: string, body: Record<string, unknown>): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error ?? `Function ${name} failed`);
  }
  return json as T;
}

export async function computeCompatibility(
  userIdA: string,
  userIdB: string,
): Promise<CompatibilityBreakdown> {
  return invokeFunction<CompatibilityBreakdown>('ai-compatibility', {
    user_id_a: userIdA,
    user_id_b: userIdB,
  });
}

export async function generateConversationStarters(
  matchId: string,
  tone: OpenerTone = 'funny',
): Promise<string[]> {
  const result = await invokeFunction<{ openers: string[] }>('ai-openers', {
    match_id: matchId,
    tone,
  });
  return result.openers;
}

export async function moderateContent(
  text: string,
  targetType: 'message' | 'profile' = 'message',
): Promise<ModerationResult> {
  return invokeFunction<ModerationResult>('ai-moderate', {
    text,
    target_type: targetType,
    mode: 'moderation',
  });
}

export async function checkMessageFlag(text: string): Promise<MessageFlagResult> {
  return invokeFunction<MessageFlagResult>('ai-moderate', {
    text,
    mode: 'coaching',
  });
}

export async function coachConversation(matchId: string): Promise<ConversationCoachResult> {
  return invokeFunction<ConversationCoachResult>('ai-conversation-coach', { match_id: matchId });
}

export async function reviewProfile(): Promise<ProfileCoachResult> {
  return invokeFunction<ProfileCoachResult>('ai-profile-coach', {});
}

export async function startPracticeSession(): Promise<{ persona_name: string; message: string }> {
  return invokeFunction('ai-practice-mode', { action: 'start' });
}

export async function practiceChatReply(
  messages: PracticeMessage[],
): Promise<{ message: string }> {
  return invokeFunction('ai-practice-mode', { action: 'chat', messages });
}

export async function evaluatePracticeSession(
  messages: PracticeMessage[],
): Promise<PracticeEvaluation> {
  return invokeFunction<PracticeEvaluation>('ai-practice-mode', {
    action: 'evaluate',
    messages,
  });
}

export async function generateVibeSummary(
  audioBase64: string,
  mimeType = 'audio/m4a',
  clipType: 'bio' | 'vibe' = 'vibe',
): Promise<{ vibe_summary: string; transcript: string }> {
  return invokeFunction('ai-vibe-summary', {
    audio_base64: audioBase64,
    mime_type: mimeType,
    clip_type: clipType,
  });
}

export async function fetchDateSuggestions(matchId: string): Promise<DateSuggestion[]> {
  const result = await invokeFunction<{ suggestions: DateSuggestion[] }>('ai-date-suggestions', {
    match_id: matchId,
  });
  return result.suggestions;
}

export async function getDateSuggestionsUsageThisWeek(): Promise<number> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 0;

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const { data } = await supabase
    .from('ai_usage_daily')
    .select('count, date')
    .eq('user_id', session.user.id)
    .eq('feature', 'date_suggestions')
    .gte('date', weekStartStr);

  return (data ?? []).reduce((sum, row) => sum + (row.count ?? 0), 0);
}

export async function getCompatibilityFromCache(
  userIdA: string,
  userIdB: string,
): Promise<CompatibilityBreakdown | null> {
  const [user_a, user_b] = userIdA < userIdB ? [userIdA, userIdB] : [userIdB, userIdA];
  const { data, error } = await supabase
    .from('compatibility_analytics')
    .select('*')
    .eq('user_a', user_a)
    .eq('user_b', user_b)
    .maybeSingle();

  if (error || !data) return null;
  return {
    overall_score: data.overall_score,
    chemistry_score: data.chemistry_score,
    emotional_resonance: data.emotional_resonance,
    communication_compat: data.communication_compat,
    humor_alignment: data.humor_alignment,
    factors: data.factors as Record<string, unknown>,
  };
}

export async function getAiUsageToday(feature: string): Promise<number> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return 0;

  const { data } = await supabase
    .from('ai_usage_daily')
    .select('count')
    .eq('user_id', session.user.id)
    .eq('feature', feature)
    .eq('date', new Date().toISOString().slice(0, 10))
    .maybeSingle();

  return data?.count ?? 0;
}
