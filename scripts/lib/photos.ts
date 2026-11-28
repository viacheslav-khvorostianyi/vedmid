import sharp from 'sharp';

export const SYNC_HEADERS = { 'User-Agent': 'Mozilla/5.0 (compatible; vedmid-menu-sync/1.0)' };

/** Downloads a menu photo and saves it as an 800x500 WebP card, cropped around the dish. */
export async function savePhoto(url: string, file: string) {
  const res = await fetch(url, { headers: SYNC_HEADERS, signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  await sharp(Buffer.from(await res.arrayBuffer()))
    .rotate()
    .resize(800, 500, { fit: 'cover', position: 'attention' })
    .webp({ quality: 75 })
    .toFile(file);
}
