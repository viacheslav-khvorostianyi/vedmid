type Listener = (e: MediaQueryListEvent) => void;

let width = 390;
const lists = new Set<{ query: string; listeners: Set<Listener> }>();

function matches(query: string): boolean {
  const min = /min-width:\s*(\d+)px/.exec(query);
  const max = /max-width:\s*(\d+)px/.exec(query);
  return (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]));
}

/** Fake viewport width for window.matchMedia (min-width / max-width queries only). Notifies listeners. */
export function setViewportWidth(next: number) {
  width = next;
  window.matchMedia = (query: string) => {
    const entry = { query, listeners: new Set<Listener>() };
    lists.add(entry);
    return {
      get matches() {
        return matches(query);
      },
      media: query,
      onchange: null,
      addEventListener: (_: string, l: Listener) => entry.listeners.add(l),
      removeEventListener: (_: string, l: Listener) => entry.listeners.delete(l),
      addListener: (l: Listener) => entry.listeners.add(l),
      removeListener: (l: Listener) => entry.listeners.delete(l),
      dispatchEvent: () => true,
    } as MediaQueryList;
  };
  lists.forEach((entry) =>
    entry.listeners.forEach((l) =>
      l({ matches: matches(entry.query), media: entry.query } as MediaQueryListEvent),
    ),
  );
}
