/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SENTRY_DSN?: string;
  /** 'true' when the Supabase plan supports image transforms */
  readonly VITE_SUPABASE_IMAGE_TRANSFORMS?: string;
  /** 'true' only under `npm run demo` (set in vite.config.ts) */
  readonly VITE_DEMO: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
