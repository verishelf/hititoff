/**
 * Grant or revoke HitItOff Pro in Supabase for testing.
 *
 * Usage:
 *   node scripts/set-premium.mjs frankposada4@icloud.com
 *   node scripts/set-premium.mjs frankposada4@icloud.com --revoke
 *
 * Requires migration 007_dev_set_premium.sql applied in Supabase.
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
const revoke = args.includes('--revoke');

if (!email) {
  console.error('Usage: node scripts/set-premium.mjs user@email.com [--revoke]');
  process.exit(1);
}

async function main() {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/dev_set_premium_by_email`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_email: email,
      premium: !revoke,
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
    if (String(data).includes('dev_set_premium_by_email') || response.status === 404) {
      console.error(
        'Missing dev_set_premium_by_email function. Run supabase/migrations/007_dev_set_premium.sql in the Supabase SQL Editor first.',
      );
    } else {
      console.error(`Failed (${response.status}):`, data);
    }
    process.exit(1);
  }

  const action = revoke ? 'Revoked premium for' : 'Granted premium to';
  console.log(`${action} ${email} (${data})`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
