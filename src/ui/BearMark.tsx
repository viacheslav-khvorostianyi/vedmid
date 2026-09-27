import type { SVGProps } from 'react';

// Placeholder bear until the designer's vector arrives (E1-5). Keep in sync with public/bear.svg.
export const BEAR_PATH =
  'M5 25c0-8 8-14 18-14 5 0 9 1 13 1 3-3 7-5 12-4l3-3 3 3c4 1 6 3 7 7l4 1-1 4c-2 1-5 2-8 2-2 2-4 5-5 8l1 7h-5l-2-7c-3 1-8 1-11 0l-1 7h-5v-7c-3 0-6-1-8-2l-2 8H9l1-9c-3-1-5-4-5-7z';

export default function BearMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 72 40" aria-hidden="true" focusable="false" {...props}>
      <path fill="currentColor" d={BEAR_PATH} />
    </svg>
  );
}
