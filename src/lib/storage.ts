import { supabase } from './supabase';

const BUCKET = 'dish-photos';
// Image transforms need a paid Supabase plan; without them the uploaded file (≤1600px WebP, see E7-3) is served as-is.
const TRANSFORMS = import.meta.env.VITE_SUPABASE_IMAGE_TRANSFORMS === 'true';

/** Public URL of a dish photo, resized server-side when transforms are enabled. */
export function photoUrl(path: string | null | undefined, width = 800): string | null {
  if (!path) return null;
  const { data } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(path, TRANSFORMS ? { transform: { width, quality: 75, resize: 'contain' } } : undefined);
  return data.publicUrl;
}
