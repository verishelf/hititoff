/**
 * Seeds fake swipe candidates near your account for local testing.
 *
 * Usage:
 *   node scripts/seed-fake-profiles.mjs
 *   node scripts/seed-fake-profiles.mjs --count 12
 *   node scripts/seed-fake-profiles.mjs --near-user adfb62d4-1182-4dd7-a3cb-e0e2e5e70f74
 *
 * Requires EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env
 *
 * Note: Discover filters by gender preferences. Older seeded profiles without
 * gender/looking_for will not appear — re-run this script to create new ones.
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
    // .env optional if vars already exported
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
const countArg = args.find((a) => a.startsWith('--count='))?.split('=')[1]
  ?? (args.includes('--count') ? args[args.indexOf('--count') + 1] : undefined);
const nearUserArg = args.find((a) => a.startsWith('--near-user='))?.split('=')[1]
  ?? (args.includes('--near-user') ? args[args.indexOf('--near-user') + 1] : undefined);

const PROFILE_COUNT = Number(countArg ?? 10);

const REFERENCE_USER_ID = nearUserArg ?? 'adfb62d4-1182-4dd7-a3cb-e0e2e5e70f74';

const FRANK_QUIZ_VECTOR = [
  0.350429420308788,
  0.359081998588017,
  0.372060866006861,
  0.307166528912641,
  0.38936602256532,
  0.363408287727632,
  0.315819107191871,
  0.363408287727632,
];

const FAKE_PROFILES = [
  { name: 'Maya', age: 24, gender: 'female', looking_for: 'male', bio: 'Sunset chaser. Always down for tacos and a beach walk.', interests: ['Travel', 'Photography', 'Coffee'] },
  { name: 'Jordan', age: 27, gender: 'male', looking_for: 'female', bio: 'Weekend hiker, weekday designer. Dog person.', interests: ['Hiking', 'Art', 'Pets'] },
  { name: 'Sofia', age: 26, gender: 'female', looking_for: 'everyone', bio: 'Live music fan looking for someone to explore the coast with.', interests: ['Music', 'Wine', 'Dancing'] },
  { name: 'Alex', age: 25, gender: 'non_binary', looking_for: 'everyone', bio: 'Yoga in the morning, gaming at night. Balance is everything.', interests: ['Yoga', 'Gaming', 'Fitness'] },
  { name: 'Riley', age: 28, gender: 'female', looking_for: 'male', bio: 'Amateur chef. Will cook for you if you pick the playlist.', interests: ['Cooking', 'Music', 'Movies'] },
  { name: 'Emma', age: 23, gender: 'female', looking_for: 'male', bio: 'Bookworm with a passport full of stamps.', interests: ['Reading', 'Travel', 'Coffee'] },
  { name: 'Luca', age: 29, gender: 'male', looking_for: 'female', bio: 'Surf before work. Tech by day, stargazer by night.', interests: ['Fitness', 'Tech', 'Photography'] },
  { name: 'Zoe', age: 26, gender: 'female', looking_for: 'male', bio: 'Trying every coffee shop within 5 miles.', interests: ['Coffee', 'Art', 'Hiking'] },
  { name: 'Noah', age: 30, gender: 'male', looking_for: 'everyone', bio: 'Low-key funny. High-key loyal.', interests: ['Movies', 'Pets', 'Cooking'] },
  { name: 'Ava', age: 25, gender: 'female', looking_for: 'male', bio: 'Dance classes, farmers markets, and spontaneous road trips.', interests: ['Dancing', 'Travel', 'Wine'] },
  { name: 'Ethan', age: 27, gender: 'male', looking_for: 'female', bio: 'Trail runner who never skips leg day or brunch.', interests: ['Fitness', 'Hiking', 'Coffee'] },
  { name: 'Luna', age: 24, gender: 'female', looking_for: 'male', bio: 'Film nerd. Bonus points if you quote The Office.', interests: ['Movies', 'Reading', 'Art'] },
];

function quizVectorVariant(index) {
  const jitter = (i) => 1 + ((index + i) % 3) * 0.02;
  const raw = FRANK_QUIZ_VECTOR.map((v, i) => v * jitter(i));
  const mag = Math.sqrt(raw.reduce((sum, v) => sum + v * v, 0));
  return raw.map((v) => v / mag);
}

function photoUrl(seed) {
  return `https://picsum.photos/seed/flikr-${seed}/800/1000`;
}

async function rest(path, { method = 'GET', token, body } = {}) {
  const headers = {
    apikey: anonKey,
    Authorization: `Bearer ${token ?? anonKey}`,
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

async function getReferenceLocation() {
  const rows = await rest(
    `/rest/v1/profiles?id=eq.${REFERENCE_USER_ID}&select=latitude,longitude,quiz_vector,name`,
  );
  const user = rows?.[0];
  if (!user?.latitude || !user?.longitude) {
    throw new Error(
      `Reference user ${REFERENCE_USER_ID} has no location. Open the app and allow location first.`,
    );
  }
  return user;
}

function offsetLocation(baseLat, baseLng, index) {
  const angle = (index / PROFILE_COUNT) * Math.PI * 2;
  const miles = 0.3 + (index % 5) * 0.35;
  const latOffset = (miles / 69) * Math.cos(angle);
  const lngOffset = (miles / (69 * Math.cos((baseLat * Math.PI) / 180))) * Math.sin(angle);
  return {
    latitude: baseLat + latOffset,
    longitude: baseLng + lngOffset,
  };
}

async function createFakeProfile(template, index, reference) {
  const slug = template.name.toLowerCase().replace(/\s+/g, '-');
  const email = `flikr-fake-${slug}-${Date.now()}-${index}@test.flikr.local`;
  const password = `FlikrSeed!${index}${Date.now().toString(36)}`;

  const signup = await rest('/auth/v1/signup', {
    method: 'POST',
    body: {
      email,
      password,
      data: { name: template.name, age: template.age },
    },
  });

  const userId = signup.user?.id;
  const token = signup.access_token;
  if (!userId || !token) {
    throw new Error(`Signup succeeded but no session for ${template.name}`);
  }

  const { latitude, longitude } = offsetLocation(reference.latitude, reference.longitude, index);
  const quiz_vector = quizVectorVariant(index);

  const updated = await rest(`/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    token,
    body: {
      name: template.name,
      age: template.age,
      bio: template.bio,
      interests: template.interests,
      gender: template.gender,
      looking_for: template.looking_for,
      photos: [photoUrl(`${slug}-${index}`), photoUrl(`${slug}-${index}-2`)],
      quiz_completed: true,
      quiz_vector,
      latitude,
      longitude,
      location_updated_at: new Date().toISOString(),
    },
  });

  // Fake profile likes the reference user so a match forms when they swipe back
  try {
    await rest('/rest/v1/swipes', {
      method: 'POST',
      token,
      body: { user_id: userId, target_id: REFERENCE_USER_ID, direction: 'like' },
    });
    await rest('/rest/v1/likes_received', {
      method: 'POST',
      token,
      body: {
        target_id: REFERENCE_USER_ID,
        liker_id: userId,
        is_super_like: false,
      },
    });
  } catch {
    // Ignore duplicate likes if re-seeding
  }

  return {
    id: userId,
    name: template.name,
    latitude,
    longitude,
    profile: updated?.[0],
  };
}

async function main() {
  console.log(`Seeding up to ${PROFILE_COUNT} fake profiles near user ${REFERENCE_USER_ID}...`);

  const reference = await getReferenceLocation();
  console.log(
    `Reference: ${reference.name ?? 'user'} at ${reference.latitude.toFixed(4)}, ${reference.longitude.toFixed(4)}`,
  );

  const templates = FAKE_PROFILES.slice(0, PROFILE_COUNT);
  const created = [];

  for (let i = 0; i < templates.length; i++) {
    const template = templates[i];
    try {
      const result = await createFakeProfile(template, i, reference);
      created.push(result);
      console.log(`  ✓ ${result.name} (${result.id.slice(0, 8)}…) ~${result.latitude.toFixed(4)}, ${result.longitude.toFixed(4)}`);
    } catch (error) {
      console.error(`  ✗ ${template.name}: ${error.message}`);
    }
  }

  console.log(`\nDone. Created ${created.length}/${templates.length} fake profiles.`);
  console.log('Reload the Discover tab in the app to start swiping.');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
