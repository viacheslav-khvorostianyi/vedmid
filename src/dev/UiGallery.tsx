import { useState, type ReactNode } from 'react';
import { CATEGORIES } from '@/features/menu/categories';
import type { CategorySlug } from '@/features/menu/types';
import Button from '@/ui/Button';
import Chip from '@/ui/Chip';
import ChipRow from '@/ui/ChipRow';
import ItemCard from '@/ui/ItemCard';
import Logo from '@/ui/Logo';
import Panel from '@/ui/Panel';
import Photo from '@/ui/Photo';
import ProgressBar from '@/ui/ProgressBar';
import SearchInput from '@/ui/SearchInput';
import SectionTitle from '@/ui/SectionTitle';
import SegmentedTabs from '@/ui/SegmentedTabs';
import Skeleton from '@/ui/Skeleton';
import StatTile from '@/ui/StatTile';
import Tag from '@/ui/Tag';
import { useToast } from '@/ui/Toast';

const DETAIL_TABS = [
  { value: 'allergens', label: 'алергени' },
  { value: 'ingredients', label: 'склад' },
  { value: 'pairing', label: 'поєднання' },
] as const;

const DETAIL_TEXT: Record<(typeof DETAIL_TABS)[number]['value'], string> = {
  allergens: 'глютен, лактоза',
  ingredients: 'Овочевий бульйон, рвана яловичина, квасоля, пампушка, сало з часником, сметана.',
  pairing: 'Поєднання для цієї страви ще не заповнене.',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs tracking-widest text-muted uppercase">{title}</h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

/** /dev/ui — every UI primitive in its states (dev builds only). */
export default function UiGallery() {
  const [q, setQ] = useState('борщ');
  const [cat, setCat] = useState<CategorySlug>('food');
  const [tab, setTab] = useState<(typeof DETAIL_TABS)[number]['value']>('allergens');
  const toast = useToast();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-8">
      <Logo />
      <SectionTitle as="h1">ui kit</SectionTitle>

      <Section title="Logo">
        <Logo />
        <Logo size="lg" stacked />
      </Section>

      <Section title="SearchInput">
        <SearchInput id="gallery-search" value={q} onChange={setQ} className="w-full" />
      </Section>

      <Section title="Chip · ChipRow">
        <Chip selected>обрано</Chip>
        <Chip>не обрано</Chip>
        <Chip disabled>вимкнено</Chip>
        <ChipRow
          id="gallery-cats"
          label="категорії"
          options={CATEGORIES.map((c) => ({ value: c.slug, label: c.name }))}
          value={cat}
          onChange={setCat}
          className="w-full"
        />
      </Section>

      <Section title="SectionTitle">
        <div className="w-full">
          <SectionTitle>перші страви</SectionTitle>
        </div>
        <SectionTitle size="sm" divider={false}>
          фраза для продажу
        </SectionTitle>
      </Section>

      <Section title="ItemCard">
        <div className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2">
          <ItemCard title="Борщ з пампушкою та салом із чорним часником" />
          <ItemCard title="Бограч з м’ясом та аджикою" selected />
          <ItemCard title="El Capitan Brut" tag="вино" badges={<Tag>★ хіт</Tag>} compact />
          <ItemCard title="Grand Admiral Brut Natur Rose (Виноробня 46parallel, Південний регіон)" compact />
        </div>
      </Section>

      <Section title="SegmentedTabs · Panel">
        <div className="w-full max-w-sm">
          <SegmentedTabs
            id="gallery-detail"
            label="інформація про страву"
            options={DETAIL_TABS}
            value={tab}
            onChange={setTab}
          >
            <Panel>{DETAIL_TEXT[tab]}</Panel>
          </SegmentedTabs>
        </div>
        <Panel tone="default" className="w-full max-w-sm">
          Колір тексту з PDF (#2E2E2E) — лише для короткого тексту.
        </Panel>
      </Section>

      <Section title="Photo">
        <Photo alt="фото подачі борщу" className="max-w-xs" />
        <Photo alt="фото подачі" aspect="video" className="max-w-xs" />
      </Section>

      <Section title="Button · Toast">
        <Button variant="no" className="w-36">
          не знаю
        </Button>
        <Button className="w-36" onClick={() => toast('Збережено')}>
          знаю (toast)
        </Button>
        <Button variant="ghost" size="sm">
          вийти
        </Button>
        <Button disabled>вимкнено</Button>
      </Section>

      <Section title="Tag · StatTile · ProgressBar">
        <Tag>глютен</Tag>
        <Tag>лактоза</Tag>
        <div className="grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4">
          <StatTile value={112} label="знаю карток" />
          <StatTile value={7} label="серія зараз" />
          <StatTile value="86%" label="точність у тестах" />
          <StatTile value={14} label="найдовша серія" />
        </div>
        <ProgressBar value={120} max={250} label="до рівня 4" className="w-full" />
      </Section>

      <Section title="Skeleton">
        <div className="grid w-full gap-3.5">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </Section>
    </div>
  );
}
