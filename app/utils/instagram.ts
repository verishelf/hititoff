const USERNAME_PATTERN = /^[a-zA-Z0-9._]{1,30}$/;

export function parseInstagramUsername(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/i);
  if (urlMatch?.[1]) {
    const username = urlMatch[1].replace(/\/$/, '');
    return USERNAME_PATTERN.test(username) ? username : null;
  }

  const username = trimmed.replace(/^@/, '').replace(/\/$/, '');
  return USERNAME_PATTERN.test(username) ? username : null;
}

export function instagramProfileUrl(username: string): string {
  return `https://instagram.com/${username}`;
}

export function formatInstagramHandle(username: string): string {
  return `@${username}`;
}
