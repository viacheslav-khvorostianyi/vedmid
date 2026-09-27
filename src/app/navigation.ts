export interface NavItem {
  to: string;
  label: string;
  /** Desktop shortcut, as KeyboardEvent.code */
  hotkey: string;
  /** Hint shown next to the item */
  hint: string;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/menu', label: 'меню', hotkey: 'Digit1', hint: '1' },
  { to: '/cards', label: 'картки', hotkey: 'Digit2', hint: '2' },
  { to: '/games', label: 'ігри', hotkey: 'Digit3', hint: '3' },
  { to: '/profile', label: 'профіль', hotkey: 'Digit4', hint: '4' },
];

export const MANAGER_NAV_ITEM: NavItem = {
  to: '/manager',
  label: 'керування меню',
  hotkey: 'KeyM',
  hint: 'M',
};

/** Per-route shell options, set via the route's `handle`. */
export interface ShellHandle {
  /** Show the brand lockup above the page on mobile (menu, detail, games — per DESIGN §5) */
  lockup?: boolean;
  /** Hide the bottom nav on mobile (full-screen games) */
  hideNav?: boolean;
  /** Turn off the desktop section shortcuts (1–4, M) because the page uses those keys itself (games) */
  noSectionHotkeys?: boolean;
}
