import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import { setViewportWidth } from './matchMedia';

// DB tests (supabase/tests) run in the node environment, without a DOM.
// Route views are lazy-loaded; the first import in a file can be slow (coverage, CI).
configure({ asyncUtilTimeout: 5000 });

if (typeof window !== 'undefined') {
  // jsdom has no matchMedia; default every test to the mobile layout.
  setViewportWidth(390);

  afterEach(() => {
    cleanup();
    setViewportWidth(390);
  });
}
