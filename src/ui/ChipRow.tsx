import TabChips, { type TabOption } from './TabChips';

interface ChipRowProps<T extends string> {
  options: readonly TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  id: string;
  /** id of the region this row filters */
  controls?: string;
  className?: string;
}

/** Horizontally scrolling single-select chip row (e.g. menu categories). */
export default function ChipRow<T extends string>({ id, controls, ...rest }: ChipRowProps<T>) {
  return <TabChips idPrefix={id} panelId={controls} {...rest} />;
}
