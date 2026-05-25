/**
 * Clear your swipe history so fake profiles show up in Discover again.
 *
 * Usage:
 *   node scripts/reset-discover.mjs frankposada4@icloud.com
 *   node scripts/reset-discover.mjs frankposada4@icloud.com --keep-matches
 *
 * Requires migration 016_dev_reset_discover.sql applied in Supabase.
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
const email = args.find((a) => a.includes('@'));
const keepMatches = args.includes('--keep-matches');

if (!email) {
  console.error('Usage: node scripts/reset-discover.mjs user@email.com [--keep-matches]');
  process.exit(1);
}

async function main() {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/dev_reset_discover_by_email`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_email: email,
      clear_matches: !keepMatches,
    }),
  });

  const text = await response.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    if (String(data).includes('dev_reset_discover_by_email') || response.status === 404) {
      console.error(
        'Missing dev_reset_discover_by_email function. Run supabase/migrations/016_dev_reset_discover.sql in the Supabase SQL Editor first.',
      );
    } else {
      console.error(`Failed (${response.status}):`, data);
    }
    process.exit(1);
  }

  console.log(`Reset Discover for ${email}`);
  console.log(`  Swipes cleared: ${data.swipes_deleted}`);
  console.log(`  Matches cleared: ${data.matches_deleted}`);
  console.log('Reload the Discover tab in the app.');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
