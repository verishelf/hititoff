import { handleCors, jsonResponse, errorResponse } from '../_shared/cors.ts';
import { chatCompletion, hasOpenAI } from '../_shared/openai.ts';

const SCAM_PATTERNS = [
  /\b(crypto|bitcoin|ethereum|wallet|investment opportunity)\b/i,
  /\b(send money|wire transfer|gift card|cashapp|venmo me)\b/i,
  /\b(whatsapp|telegram|signal)\b.*\b(move|chat)\b/i,
  /https?:\/\/[^\s]+/i,
];

const TOXIC_PATTERNS = [
  /\b(kill yourself|kys|die)\b/i,
  /\b(slut|whore|bitch)\b/i,
];

const BREADCRUMB_PATTERNS = [
  /\b(maybe|we'll see|busy|later|not sure)\b/i,
  /\b(hey|hi|sup)\b/i,
];

interface ModerationResult {
  approved: boolean;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  flags: string[];
}

export interface MessageFlagResult {
  signal: 'green' | 'yellow' | 'red';
  headline: string;
  explanation: string;
}

function heuristicModerate(text: string): ModerationResult {
  const flags: string[] = [];

  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(text)) flags.push('scam_pattern');
  }
  for (const pattern of TOXIC_PATTERNS) {
    if (pattern.test(text)) flags.push('toxicity');
  }

  if (flags.includes('toxicity')) {
    return { approved: false, severity: 'high', reason: 'Toxic content detected', flags };
  }
  if (flags.includes('scam_pattern')) {
    return { approved: false, severity: 'high', reason: 'Potential scam detected', flags };
  }
  if (text.length > 2000) {
    return { approved: false, severity: 'medium', reason: 'Message too long', flags: ['length'] };
  }

  return { approved: true, severity: 'low', reason: 'OK', flags };
}

function heuristicFlag(text: string): MessageFlagResult {
  for (const pattern of SCAM_PATTERNS) {
    if (pattern.test(text)) {
      return {
        signal: 'red',
        headline: 'Possible scam or off-app redirect',
        explanation: 'This message mentions money, crypto, or moving to another app — common scam patterns. Proceed with caution.',
      };
    }
  }
  for (const pattern of TOXIC_PATTERNS) {
    if (pattern.test(text)) {
      return {
        signal: 'red',
        headline: 'Disrespectful or harmful language',
        explanation: 'This message contains language that crosses a line. You do not owe a reply.',
      };
    }
  }
  if (text.length < 8 && BREADCRUMB_PATTERNS.some((p) => p.test(text))) {
    return {
      signal: 'yellow',
      headline: 'Low-effort or vague reply',
      explanation: 'Short, non-committal messages can mean they are busy — or breadcrumbing. Watch if this pattern repeats.',
    };
  }
  if (/\?/.test(text) && text.length > 20) {
    return {
      signal: 'green',
      headline: 'Engaged and curious',
      explanation: 'They asked a question and put effort into the message — a positive sign of interest.',
    };
  }
  return {
    signal: 'green',
    headline: 'Neutral to positive',
    explanation: 'Nothing alarming here. Match their energy and keep the conversation moving forward.',
  };
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return errorResponse('Unauthorized', 401);

    const { text, target_type = 'message', mode = 'moderation' } = await req.json();
    if (!text) return errorResponse('text required');

    if (mode === 'coaching') {
      let flagResult = heuristicFlag(text);

      if (hasOpenAI()) {
        try {
          const content = await chatCompletion(
            `You are a dating coach helping someone read a message they received. Return ONLY valid JSON:
{ "signal": "green"|"yellow"|"red",
  "headline": string (short label, e.g. "Genuine interest" or "Possible breadcrumbing"),
  "explanation": string (2-3 sentences, friendly coaching tone) }
Green = positive interest. Yellow = ambiguous or low effort. Red = scam, manipulation, or disrespect.`,
            `Message received: "${text.slice(0, 500)}"`,
            { temperature: 0.4 },
          );
          const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
          if (['green', 'yellow', 'red'].includes(parsed.signal)) {
            flagResult = {
              signal: parsed.signal,
              headline: String(parsed.headline ?? flagResult.headline),
              explanation: String(parsed.explanation ?? flagResult.explanation),
            };
          }
        } catch {
          // Keep heuristic
        }
      }

      return jsonResponse(flagResult);
    }

    let result = heuristicModerate(text);

    if (hasOpenAI() && result.approved) {
      try {
        const content = await chatCompletion(
          'You are a content moderator for a dating app. Return ONLY valid JSON: { "approved": boolean, "severity": "low"|"medium"|"high", "reason": string, "flags": string[] }. Flag toxicity, harassment, scams, and explicit content.',
          `Moderate this ${target_type}: "${text.slice(0, 500)}"`,
          { temperature: 0.1 },
        );
        const aiResult = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
        if (!aiResult.approved) {
          result = {
            approved: false,
            severity: aiResult.severity ?? 'medium',
            reason: aiResult.reason ?? 'Content flagged',
            flags: aiResult.flags ?? ['ai_moderation'],
          };
        }
      } catch {
        // Keep heuristic result
      }
    }

    return jsonResponse(result);
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : 'Internal error', 500);
  }
});
