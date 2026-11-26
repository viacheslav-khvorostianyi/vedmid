// Finds stock-photo candidates for every photo key in queries.ts and renders contact sheets for review.
//   npx tsx scripts/photos/search.ts <outDir> [key …]
// Writes <outDir>/candidates.json and <outDir>/sheet-NN.jpg (rows = keys, columns = candidates 0–3).
// Pick one candidate per key and record it in supabase/seed/photos.json, then run download.ts.
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { QUERIES } from './queries';

const API = 'https://api.openverse.org/v1/images/';
const LICENSES = 'cc0,pdm,by,by-sa';
const PER_KEY = 4;
const ROWS_PER_SHEET = 8;
const CELL = { w: 240, h: 150 };
const LABEL_W = 200;

export interface Candidate {
  id: string;
  url: string;
  thumbnail: string;
  title: string;
  creator: string | null;
  license: string;
  licenseVersion: string | null;
  licenseUrl: string | null;
  landingUrl: string;
  source: string;
}

interface OpenverseResult {
  id: string;
  url: string;
  thumbnail: string;
  title: string | null;
  creator: string | null;
  license: string;
  license_version: string | null;
  license_url: string | null;
  foreign_landing_url: string;
  source: string;
  width: number | null;
  height: number | null;
}

async function search(query: string): Promise<Candidate[]> {
  const params = new URLSearchParams({ q: query, license: LICENSES, mature: 'false', page_size: '20' });
  let res: Response | undefined;
  for (let attempt = 1; attempt <= 4; attempt++) {
    res = await fetch(`${API}?${params}`, {
      headers: { 'User-Agent': 'vedmid-photo-script/1.0' },
      signal: AbortSignal.timeout(30_000),
    }).catch(() => undefined);
    if (res?.ok || (res && res.status < 500 && res.status !== 429)) break;
    await new Promise((r) => setTimeout(r, attempt * 5_000)); // Openverse returns transient 5xx
  }
  if (!res?.ok) throw new Error(`${query}: HTTP ${res?.status ?? 'timeout'}`);
  const body = (await res.json()) as { results: OpenverseResult[] };
  return body.results
    .filter((r) => (r.width ?? 0) >= 640 && (r.width ?? 0) >= (r.height ?? 0))
    .slice(0, PER_KEY)
    .map((r) => ({
      id: r.id,
      url: r.url,
      thumbnail: r.thumbnail,
      title: r.title ?? '',
      creator: r.creator,
      license: r.license,
      licenseVersion: r.license_version,
      licenseUrl: r.license_url,
      landingUrl: r.foreign_landing_url,
      source: r.source,
    }));
}

async function thumb(c: Candidate, cacheFile: string): Promise<Buffer | null> {
  if (existsSync(cacheFile)) return readFile(cacheFile);
  try {
    const res = await fetch(c.url, { signal: AbortSignal.timeout(20_000) });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const out = await sharp(buf).resize(CELL.w, CELL.h, { fit: 'cover' }).jpeg({ quality: 70 }).toBuffer();
    await writeFile(cacheFile, out);
    return out;
  } catch {
    return null;
  }
}

const escapeXml = (s: string) => s.replace(/[<>&"]/g, (ch) => `&#${ch.charCodeAt(0)};`);

function label(text: string, w: number, h: number): Buffer {
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#111"/>` +
      `<text x="8" y="${h / 2 + 6}" font-family="Helvetica" font-size="17" fill="#fff">${escapeXml(text)}</text></svg>`,
  );
}

async function sheet(rows: [string, (Buffer | null)[]][], file: string) {
  const width = LABEL_W + PER_KEY * (CELL.w + 4);
  const height = rows.length * (CELL.h + 4);
  const layers: sharp.OverlayOptions[] = [];
  rows.forEach(([key, thumbs], r) => {
    const top = r * (CELL.h + 4);
    layers.push({ input: label(key, LABEL_W, CELL.h), top, left: 0 });
    thumbs.forEach((t, i) => {
      const left = LABEL_W + i * (CELL.w + 4);
      layers.push({ input: t ?? label(`${i}: failed`, CELL.w, CELL.h), top, left });
      layers.push({ input: label(String(i), 26, 26), top, left });
    });
  });
  await sharp({ create: { width, height, channels: 3, background: '#333' } })
    .composite(layers)
    .jpeg({ quality: 80 })
    .toFile(file);
}

async function main() {
  const [outDir, ...only] = process.argv.slice(2);
  if (!outDir) throw new Error('usage: search.ts <outDir> [key …]');
  await mkdir(path.join(outDir, 'thumbs'), { recursive: true });
  const keys = only.length ? only : Object.keys(QUERIES);
  // Resumable: earlier results stay cached in candidates.json and thumbs/.
  const cacheFile = path.join(outDir, 'candidates.json');
  const candidates: Record<string, Candidate[]> = existsSync(cacheFile)
    ? JSON.parse(await readFile(cacheFile, 'utf8'))
    : {};
  const rows: [string, (Buffer | null)[]][] = [];
  for (const key of keys) {
    const query = QUERIES[key];
    if (!query) throw new Error(`unknown key ${key}`);
    if (!candidates[key]) {
      candidates[key] = await search(query);
      await writeFile(cacheFile, JSON.stringify(candidates, null, 2));
      await new Promise((r) => setTimeout(r, 700)); // stay under the anonymous burst limit
    }
    const list = candidates[key];
    rows.push([
      key,
      await Promise.all(list.map((c, i) => thumb(c, path.join(outDir, 'thumbs', `${key}-${i}.jpg`)))),
    ]);
    console.log(`${key}: ${list.length} candidates`);
  }
  for (let i = 0; i * ROWS_PER_SHEET < rows.length; i++) {
    const file = path.join(outDir, `sheet-${String(i).padStart(2, '0')}.jpg`);
    await sheet(rows.slice(i * ROWS_PER_SHEET, (i + 1) * ROWS_PER_SHEET), file);
  }
  console.log(`done: ${keys.length} keys → ${outDir}`);
}

await main();
