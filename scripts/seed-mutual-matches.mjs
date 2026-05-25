/**
 * Creates mutual matches between your account and seeded fake profiles.
 *
 * Usage:
 *   node scripts/seed-mutual-matches.mjs
 *   node scripts/seed-mutual-matches.mjs --near-user YOUR_USER_ID --count 5
 *
 * Requires migration 005_dev_create_match.sql applied in Supabase first.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

function loadEnv() {
  try {
    readFileSync(resolve(root, '.env'), 'utf8')
      .split('\n')
      .forEach((line) => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) process.env[match[1].trim()] = match[2].trim();
      });
  } catch {
    // optional
  }
}

loadEnv();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const args = process.argv.slice(2);
const nearUserArg = args.find((a) => a.startsWith('--near-user='))?.split('=')[1]
  ?? (args.includes('--near-user') ? args[args.indexOf('--near-user') + 1] : undefined);
const countArg = args.find((a) => a.startsWith('--count='))?.split('=')[1]
  ?? (args.includes('--count') ? args[args.indexOf('--count') + 1] : undefined);

const REFERENCE_USER_ID = nearUserArg ?? 'adfb62d4-1182-4dd7-a3cb-e0e2e5e70f74';
const MATCH_COUNT = Number(countArg ?? 5);

const FAKE_NAMES = [
  'Maya', 'Jordan', 'Sofia', 'Alex', 'Riley', 'Emma',
  'Luca', 'Zoe', 'Noah', 'Ava', 'Ethan', 'Luna',
];

async function rest(path, { method = 'GET', body } = {}) {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
  if (body) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${supabaseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(`${method} ${path} failed (${response.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function createMatch(referenceUserId, fakeUserId) {
  return rest('/rest/v1/rpc/dev_create_match', {
    method: 'POST',
    body: { user_x: referenceUserId, user_y: fakeUserId },
  });
}

async function main() {
  console.log(`Creating up to ${MATCH_COUNT} mutual matches for ${REFERENCE_USER_ID}...`);

  const nameFilter = FAKE_NAMES.map((n) => `name.eq.${n}`).join(',');
  const profiles = await rest(
    `/rest/v1/profiles?select=id,name&or=(${nameFilter})&id=neq.${REFERENCE_USER_ID}&order=created_at.desc`,
  );

  if (!profiles?.length) {
    console.error('No fake profiles found. Run: npm run seed:profiles');
    process.exit(1);
  }

  const targets = profiles.slice(0, MATCH_COUNT);
  let created = 0;

  for (const profile of targets) {
    try {
      const matchId = await createMatch(REFERENCE_USER_ID, profile.id);
      console.log(`  ✓ Matched with ${profile.name} (${String(matchId).slice(0, 8)}…)`);
      created += 1;
    } catch (error) {
      const message = error.message ?? String(error);
      if (message.includes('dev_create_match') && message.includes('404')) {
        console.error(
          '\nMissing dev_create_match function. Run supabase/migrations/005_dev_create_match.sql in the Supabase SQL Editor first.',
        );
        process.exit(1);
      }
      console.error(`  ✗ ${profile.name}: ${message}`);
    }
  }

  console.log(`\nDone. Created ${created}/${targets.length} matches. Open the Matches tab in the app.`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
