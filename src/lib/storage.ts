import { supabase } from './supabase';

const BUCKET = 'dish-photos';
// Image transforms need a paid Supabase plan; without them the uploaded file (≤1600px WebP, see E7-3) is served as-is.
const TRANSFORMS = import.meta.env.VITE_SUPABASE_IMAGE_TRANSFORMS === 'true';
// A literal (vite.config.ts), so normal builds drop the demo branch.
const DEMO = import.meta.env.VITE_DEMO === 'true';

/**
 * Where the demo build ships a photo: public/demo-photos/{own,stock}/… under the app's base path.
 * Images load straight from the site, not through the demo's service worker, so they also show when the worker
 * is not in control (a hard reload, browsers or in-app views without service workers).
 */
export function demoPhotoUrl(path: string, base: string): string {
  return `${base}demo-photos/${path}`;
}

/** Public URL of a dish photo, resized server-side when transforms are enabled. */
export function photoUrl(path: string | null | undefined, width = 800): string | null {
  if (!path) return null;
  if (DEMO) return demoPhotoUrl(path, import.meta.env.BASE_URL);
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path, TRANSFORMS ? { transform: { width, quality: 75, resize: 'contain' } } : undefined);
  return data.publicUrl;
}
