import type { StaffRole } from '@/features/auth/context';
import { isRestaurantId, type RestaurantId } from '../../supabase/seed/restaurants';
import { emptyState, type DemoState } from './server';

// Demo data lives only in this browser. Every access is guarded: storage can be blocked (private mode).

// `started` is versioned: v1 could be set by a failed first sign-in (Safari mixed-content bug), so browsers that
// saw it get one fresh automatic sign-in.
// Each restaurant keeps its own progress; «Просто ЛІС» keeps the original key so earlier progress stays.
const KEYS = {
  state: 'vedmid-demo:state',
  stateDelikacia: 'vedmid-demo:state:delikacia',
  restaurant: 'vedmid-demo:restaurant',
  role: 'vedmid-demo:role',
  started: 'vedmid-demo:started:v2',
} as const;
const STATE_KEY: Record<RestaurantId, string> = { lis: KEYS.state, delikacia: KEYS.stateDelikacia };

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* demo keeps working in memory */
  }
}

export function getRestaurant(): RestaurantId {
  const value = read(KEYS.restaurant);
  return isRestaurantId(value) ? value : 'lis';
}
export const setRestaurant = (id: RestaurantId) => write(KEYS.restaurant, id);

let memory: DemoState | null = null;

export function loadState(): DemoState {
  if (memory) return memory;
  try {
    memory = { ...emptyState(), ...(JSON.parse(read(STATE_KEY[getRestaurant()]) ?? 'null') ?? {}) };
  } catch {
    memory = emptyState();
  }
  return memory!;
}

export function saveState(state: DemoState) {
  memory = state;
  write(STATE_KEY[getRestaurant()], JSON.stringify(state));
}

export const getRole = (): StaffRole => (read(KEYS.role) === 'manager' ? 'manager' : 'waiter');
export const setRole = (role: StaffRole) => write(KEYS.role, role);

/** First visit signs the demo user in automatically; after that, signing out is respected. */
export const isFirstVisit = () => read(KEYS.started) === null;
export const markStarted = () => write(KEYS.started, '1');

export function resetDemo() {
  memory = null;
  Object.values(KEYS).forEach((k) => write(k, null));
  // supabase-js session for this project
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sb-') && k.endsWith('-auth-token'))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
