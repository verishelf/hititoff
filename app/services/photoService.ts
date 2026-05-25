import * as FileSystem from 'expo-file-system/legacy';
import { STORAGE_BUCKET } from '../utils/constants';
import { supabase } from './supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

function contentTypeFromMime(mimeType?: string, uri?: string): string {
  if (mimeType) return mimeType;
  const lower = uri?.toLowerCase() ?? '';
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function extensionFromContentType(contentType: string): string {
  switch (contentType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'video/mp4':
      return 'mp4';
    case 'video/quicktime':
      return 'mov';
    default:
      return 'jpg';
  }
}

function videoContentTypeFromMime(mimeType?: string, uri?: string): string {
  if (mimeType?.startsWith('video/')) return mimeType;
  const lower = uri?.toLowerCase() ?? '';
  if (lower.includes('.mov')) return 'video/quicktime';
  return 'video/mp4';
}

async function getAuthToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) {
    throw new Error('You must be signed in to upload photos');
  }
  return token;
}

async function photoHasContent(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, { method: 'HEAD' });
    if (head.ok) {
      const length = Number(head.headers.get('content-length') ?? NaN);
      if (!Number.isNaN(length)) {
        return length > 0;
      }
    }

    const response = await fetch(url);
    if (!response.ok) return false;
    const blob = await response.blob();
    return blob.size > 0;
  } catch {
    return false;
  }
}

async function assertLocalFile(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || info.isDirectory) {
    throw new Error('Could not read media file');
  }
  if (!info.size) {
    throw new Error('Media file is empty');
  }
  return info.size;
}

async function resolveLocalMediaUri(uri: string, fallbackExt = 'mp4'): Promise<string> {
  if (uri.startsWith('file://')) {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) return uri;
  }

  if (uri.startsWith('/')) {
    const fileUri = uri.startsWith('file://') ? uri : `file://${uri}`;
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) return fileUri;
  }

  const ext = uri.toLowerCase().includes('.mov') ? 'mov' : fallbackExt;
  const dest = `${FileSystem.cacheDirectory}upload_${Date.now()}.${ext}`;

  try {
    await FileSystem.copyAsync({ from: uri, to: dest });
    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) return dest;
  } catch {
    // fall through
  }

  throw new Error('Could not access media file. Please try again.');
}

async function readLocalFileBytes(localUri: string): Promise<ArrayBuffer> {
  const response = await fetch(localUri);
  if (!response.ok) {
    throw new Error('Could not read media file for upload');
  }
  return response.arrayBuffer();
}

async function uploadBytesToStorage(
  path: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<void> {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, bytes, {
    contentType,
    upsert: true,
  });

  if (error) throw new Error(error.message);
}

async function uploadLocalFileToStorage(
  localUri: string,
  path: string,
  contentType: string,
): Promise<void> {
  const fileSize = await assertLocalFile(localUri);
  const token = await getAuthToken();

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${STORAGE_BUCKET}/${path}`;

  const result = await FileSystem.uploadAsync(uploadUrl, localUri, {
    httpMethod: 'POST',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: supabaseAnonKey,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
  });

  if (result.status < 200 || result.status >= 300) {
    throw new Error(result.body || `Upload failed (${result.status})`);
  }

  if (result.body && result.body.includes('error')) {
    try {
      const parsed = JSON.parse(result.body) as { message?: string; error?: string };
      if (parsed.message || parsed.error) {
        throw new Error(parsed.message ?? parsed.error ?? 'Upload failed');
      }
    } catch (e) {
      if (e instanceof Error && e.message !== 'Upload failed') {
        throw e;
      }
    }
  }

  console.log(`[photoService] Uploaded ${path} (${fileSize} bytes local)`);
}

export function normalizePhotoUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://')) {
    return url;
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(url);
  return data.publicUrl;
}

export async function filterValidPhotoUrls(urls: string[]): Promise<string[]> {
  const normalized = urls
    .filter((url): url is string => typeof url === 'string' && url.length > 0)
    .map(normalizePhotoUrl);

  const results = await Promise.all(
    normalized.map(async (url) => ((await photoHasContent(url)) ? url : null)),
  );

  return results.filter((url): url is string => url !== null);
}

export function storagePathFromPhotoUrl(url: string): string | null {
  if (!url.startsWith('http')) {
    return url.includes('/') ? url : null;
  }

  const marker = `/object/public/${STORAGE_BUCKET}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

export async function deleteProfilePhoto(url: string): Promise<void> {
  const path = storagePathFromPhotoUrl(url);
  if (!path) return;

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) {
    console.warn('[photoService] Storage delete failed:', error.message);
  }
}

export async function uploadProfilePhoto(
  userId: string,
  uri: string,
  index: number,
  mimeType?: string,
): Promise<string> {
  if (!uri.startsWith('file://')) {
    throw new Error('Only local photos can be uploaded. Please pick from your library.');
  }

  const contentType = contentTypeFromMime(mimeType, uri);
  const ext = extensionFromContentType(contentType);
  const path = `${userId}/${Date.now()}_${index}.${ext}`;

  await uploadLocalFileToStorage(uri, path, contentType);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const valid = await photoHasContent(publicUrl);
  if (!valid) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    throw new Error('Photo upload failed — server received an empty file. Please try again.');
  }

  return publicUrl;
}

export async function uploadInstagramPhoto(
  userId: string,
  uri: string,
  index: number,
  mimeType?: string,
): Promise<string> {
  if (!uri.startsWith('file://')) {
    throw new Error('Only local photos can be uploaded. Please pick from your library.');
  }

  const contentType = contentTypeFromMime(mimeType, uri);
  const ext = extensionFromContentType(contentType);
  const path = `${userId}/ig_${Date.now()}_${index}.${ext}`;

  await uploadLocalFileToStorage(uri, path, contentType);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const valid = await photoHasContent(publicUrl);
  if (!valid) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    throw new Error('Photo upload failed — server received an empty file. Please try again.');
  }

  return publicUrl;
}

export async function uploadProfileVideo(
  userId: string,
  uri: string,
  mimeType?: string,
): Promise<string> {
  const contentType = videoContentTypeFromMime(mimeType, uri);
  const ext = extensionFromContentType(contentType);
  const localUri = await resolveLocalMediaUri(uri, ext);
  const fileSize = await assertLocalFile(localUri);

  const maxBytes = 50 * 1024 * 1024;
  if (fileSize > maxBytes) {
    throw new Error('Video must be under 50MB. Try a shorter clip.');
  }

  const path = `${userId}/intro_${Date.now()}.${ext}`;
  const bytes = await readLocalFileBytes(localUri);

  if (bytes.byteLength === 0) {
    throw new Error('Video file is empty');
  }

  await uploadBytesToStorage(path, bytes, contentType);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  const publicUrl = data.publicUrl;

  const valid = await photoHasContent(publicUrl);
  if (!valid) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    throw new Error('Video upload failed — server received an empty file. Please try again.');
  }

  return publicUrl;
}

export async function deleteProfileVideo(url: string): Promise<void> {
  await deleteProfilePhoto(url);
}
