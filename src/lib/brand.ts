export interface Brand {
  /** e.g. «Просто ЛІС», for accessible labels */
  name: string;
  /** The wordmark in the lockup */
  lockup: string;
}

let brand: Brand = { name: 'Просто ЛІС', lockup: 'ПРОСТО ЛІС' };

/** The restaurant the app is branded for. Only the demo changes it (it can show more than one restaurant). */
export const getBrand = (): Brand => brand;

/** Call before the first render. */
export function setBrand(next: Brand) {
  brand = next;
}
