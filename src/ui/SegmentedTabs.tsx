import type { ReactNode } from 'react';
import TabChips, { type TabOption } from './TabChips';

interface SegmentedTabsProps<T extends string> {
  id: string;
  label: string;
  options: readonly TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Content of the selected tab */
  children: ReactNode;
}

/** Equal-width tabs with their panel (item detail: алергени / склад / поєднання). */
export default function SegmentedTabs<T extends string>({ id, children, ...rest }: SegmentedTabsProps<T>) {
  const panelId = `${id}-panel`;
  return (
    <div className="flex flex-col gap-3">
      <TabChips idPrefix={id} panelId={panelId} fill {...rest} />
      <div role="tabpanel" id={panelId} aria-labelledby={`${id}-tab-${rest.value}`}>
        {children}
      </div>
    </div>
  );
}
