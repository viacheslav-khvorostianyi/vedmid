/** Only same-app paths are allowed as post-login targets (no open redirects). */
export function safeNext(next: string | null | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/menu';
  if (next === '/login' || next.startsWith('/login?') || next === '/') return '/menu';
  return next;
}
