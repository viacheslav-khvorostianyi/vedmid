import { useState, type ReactNode } from 'react';
import { photoUrl } from '@/lib/storage';
import Panel from '@/ui/Panel';
import Photo from '@/ui/Photo';
import SectionTitle from '@/ui/SectionTitle';
import SegmentedTabs from '@/ui/SegmentedTabs';
import Tag from '@/ui/Tag';
import { DETAIL_TAB_LABELS, detailTabs, formatUpdated, type DetailTab } from '../model';
import type { MenuItem } from '../types';
import TasteProfileBars from './TasteProfileBars';

interface ItemDetailContentProps {
  item: MenuItem;
  /** `tabs` on mobile (PDF p.2); `stacked` shows every section at once (desktop pane) */
  variant: 'tabs' | 'stacked';
  titleAs?: 'h1' | 'h2';
}

function TabBody({ item, tab }: { item: MenuItem; tab: DetailTab }) {
  switch (tab) {
    case 'allergens':
      return <Panel>{item.allergens.join(', ')}</Panel>;
    case 'ingredients':
      return <Panel>{item.ingredients}</Panel>;
    case 'grape':
      return (
        <Panel className="flex flex-col gap-1.5">
          {item.grapeVarieties && (
            <p className="m-0">
              <strong>сорт:</strong> {item.grapeVarieties}
            </p>
          )}
          {item.sweetness && (
            <p className="m-0">
              <strong>солодкість:</strong> {item.sweetness}
            </p>
          )}
          {item.ingredients && <p className="m-0">{item.ingredients}</p>}
        </Panel>
      );
    case 'profile':
      return (
        <Panel>
          <TasteProfileBars profile={item.tasteProfile!} />
        </Panel>
      );
    case 'pairing':
      return item.pairing ? (
        <Panel>{item.pairing}</Panel>
      ) : (
        <p className="m-0 text-sm text-muted">поєднання ще не заповнене</p>
      );
  }
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5">
      <SectionTitle as="h3" size="sm" divider={false}>
        {title}
      </SectionTitle>
      {children}
    </section>
  );
}

/** Everything a waiter needs about one item. Shared by the mobile detail screen and the desktop detail pane. */
export default function ItemDetailContent({ item, variant, titleAs: Title = 'h1' }: ItemDetailContentProps) {
  const tabs = detailTabs(item);
  const [tab, setTab] = useState<DetailTab>(tabs[0] ?? 'pairing');

  return (
    <div className="flex flex-col gap-3.5">
      <Photo
        src={photoUrl(item.photoPath)}
        alt={`фото подачі: ${item.title}`}
        aspect={variant === 'stacked' ? 'video' : 'wide'}
      />
      <Title className="m-0 font-mono text-base leading-snug font-bold desk:text-[17px]">{item.title}</Title>
      {(item.isBestseller || item.isFinalist || item.anchor) && (
        <div className="flex flex-wrap items-center gap-1.5">
          {item.isBestseller && <Tag>★ хіт продажів</Tag>}
          {item.isFinalist && <Tag>фіналіст конкурсу</Tag>}
          {item.anchor && <span className="text-[13px] text-muted">«{item.anchor}»</span>}
        </div>
      )}

      {tabs.length > 0 &&
        (variant === 'tabs' ? (
          <SegmentedTabs
            id={`detail-${item.id}`}
            label="інформація про позицію"
            options={tabs.map((t) => ({ value: t, label: DETAIL_TAB_LABELS[t] }))}
            value={tabs.includes(tab) ? tab : tabs[0]}
            onChange={setTab}
          >
            <TabBody item={item} tab={tabs.includes(tab) ? tab : tabs[0]} />
          </SegmentedTabs>
        ) : (
          tabs.map((t) => (
            <Section key={t} title={DETAIL_TAB_LABELS[t]}>
              <TabBody item={item} tab={t} />
            </Section>
          ))
        ))}

      {item.sales && (
        <Section title="фраза для продажу">
          <Panel>{item.sales}</Panel>
        </Section>
      )}
      {item.interestingFact && (
        <Section title="цікавий факт">
          <Panel>{item.interestingFact}</Panel>
        </Section>
      )}
      {item.producer && (
        <Section title="виробник">
          <Panel className="flex flex-col gap-1.5">
            {item.producer.uniqueness && <p className="m-0">{item.producer.uniqueness}</p>}
            {item.producer.facilities && <p className="m-0">{item.producer.facilities}</p>}
            {item.producer.rawMaterials && <p className="m-0">{item.producer.rawMaterials}</p>}
          </Panel>
        </Section>
      )}

      {formatUpdated(item.updatedAt) && (
        <p className="m-0 text-xs text-muted">оновлено {formatUpdated(item.updatedAt)}</p>
      )}
    </div>
  );
}
