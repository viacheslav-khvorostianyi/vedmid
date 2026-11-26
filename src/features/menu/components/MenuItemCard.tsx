import { photoUrl } from '@/lib/storage';
import ItemCard from '@/ui/ItemCard';
import Tag from '@/ui/Tag';
import type { MenuItem } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  to: string;
  /** Category label, shown in flat search results */
  tag?: string;
  selected?: boolean;
  compact?: boolean;
  className?: string;
}

/** A menu item as a list card: thumbnail, title and the bestseller badge. Used by both layouts. */
export default function MenuItemCard({ item, ...props }: MenuItemCardProps) {
  return (
    <ItemCard
      title={item.title}
      photo={photoUrl(item.photoPath, 240)}
      badges={item.isBestseller ? <Tag tone="accent">★ хіт</Tag> : undefined}
      {...props}
    />
  );
}
