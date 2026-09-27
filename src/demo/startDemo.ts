import { setupWorker } from 'msw/browser';
import { supabase } from '@/lib/supabase';
import DemoBar from './DemoBar';
import { createDemoHandlers } from './handlers';
import { DEMO_PEOPLE, demoSession } from './session';
import { getRole, isFirstVisit, loadState, markStarted, saveState } from './storage';

/**
 * Demo mode (`npm run demo`): a service worker answers every Supabase request from the built-in menu and a
 * local demo state, so the real app runs without a backend. Returns the demo bar to render next to the app.
 */
export async function startDemo() {
  const worker = setupWorker(
    ...createDemoHandlers({
      url: import.meta.env.VITE_SUPABASE_URL,
      getState: loadState,
      setState: saveState,
      getRole,
    }),
  );
  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });

  if (isFirstVisit()) {
    markStarted();
    const session = demoSession(DEMO_PEOPLE[getRole()].email);
    await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  }
  return DemoBar;
}
