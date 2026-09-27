import { useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router';
import { cn } from '@/lib/cn';
import { useHotkeys } from '@/lib/useHotkeys';
import DesktopPage from '@/shells/desktop/DesktopPage';
import ChipRow from '@/ui/ChipRow';
import ItemCard from '@/ui/ItemCard';
import SearchInput from '@/ui/SearchInput';
import SectionTitle from '@/ui/SectionTitle';
import Tag from '@/ui/Tag';
import ItemDetailContent from '../../components/ItemDetailContent';
import { MenuError, MenuLoading } from '../../components/MenuStatus';
import { useMenu } from '../../hooks/useMenu';
import { useMenuParams } from '../../hooks/useMenuParams';
import { MIN_QUERY_LENGTH, normalize, searchMenu, sectionsFor } from '../../model';

export default function MenuPanesView() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const params = useMenuParams();
  const { data, isPending, isError, refetch } = useMenu();
  const searchRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const selected = data?.items.find((i) => i.id === itemId);
  // A deep link to an item opens its category and subcategory.
  const category = params.category ?? selected?.category ?? 'food';
  const sections = useMemo(() => (data ? sectionsFor(data, category) : []), [data, category]);
  const searching = normalize(params.query).length >= MIN_QUERY_LENGTH;
  const results = useMemo(
    () => (data && searching ? searchMenu(data.items, params.query) : []),
    [data, searching, params.query],
  );

  const subcategoryId =
    sections.find((s) => s.subcategory.id === params.subcategoryId)?.subcategory.id ??
    (selected && selected.category === category ? selected.subcategoryId : undefined) ??
    sections[0]?.subcategory.id;
  const section = sections.find((s) => s.subcategory.id === subcategoryId);
  const visible = searching ? results : (section?.items ?? []);
  const categoryName = new Map(data?.categories.map((c) => [c.slug, c.name]));

  const open = (id: string) => navigate(`/menu/${id}${params.search}`, { replace: true });

  useHotkeys({
    Slash: () => searchRef.current?.focus(),
    // Inside the detail pane the arrows scroll it instead.
    ArrowDown: () => (inDetail() ? false : move(1)),
    ArrowUp: () => (inDetail() ? false : move(-1)),
    Enter: () => detailRef.current?.focus(),
  });

  const inDetail = () => !!detailRef.current?.contains(document.activeElement);

  function move(delta: number) {
    if (visible.length === 0) return;
    const i = visible.findIndex((v) => v.id === itemId);
    const next =
      i < 0 ? (delta > 0 ? 0 : visible.length - 1) : Math.min(Math.max(i + delta, 0), visible.length - 1);
    open(visible[next].id);
  }

  useEffect(() => {
    document.getElementById(`card-${itemId}`)?.scrollIntoView?.({ block: 'nearest' });
  }, [itemId]);

  const topBar = (
    <>
      <SearchInput
        id="menu-search"
        ref={searchRef}
        value={params.query}
        onChange={params.setQuery}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            params.setQuery('');
            e.currentTarget.blur();
          }
        }}
        className="max-w-[520px] flex-1"
        aria-keyshortcuts="/"
      />
      <ChipRow
        id="menu-cats"
        label="категорії меню"
        controls="menu-results"
        options={(data?.categories ?? []).map((c) => ({ value: c.slug, label: c.name }))}
        value={category}
        onChange={params.setCategory}
      />
    </>
  );

  return (
    <DesktopPage topBar={topBar} bodyClassName="grid min-h-0 grid-cols-[210px_minmax(0,1fr)_400px]">
      <nav
        aria-label="підкатегорії"
        className="flex flex-col gap-1 overflow-auto border-r border-line-faint px-3 py-[18px]"
      >
        {sections.map(({ subcategory, items }) => {
          const current = !searching && subcategory.id === subcategoryId;
          return (
            <button
              key={subcategory.id}
              type="button"
              onClick={() => params.setSubcategory(subcategory.id)}
              aria-current={current ? 'true' : undefined}
              className={cn(
                'flex min-h-9 items-center justify-between gap-2 rounded-lg px-2.5 text-left text-sm transition-colors',
                current ? 'bg-bg-raised text-text' : 'text-muted hover:text-text',
              )}
            >
              {subcategory.name}
              <span className="text-xs tabular-nums text-muted">{items.length}</span>
            </button>
          );
        })}
      </nav>

      <div id="menu-results" className="flex min-h-0 flex-col gap-3.5 overflow-auto px-[22px] py-[18px]">
        {isPending && <MenuLoading compact />}
        {isError && !data && <MenuError onRetry={() => refetch()} />}
        {data && (
          <>
            <SectionTitle as="h1">
              {searching
                ? `пошук: ${params.query.trim()}`
                : (section?.subcategory.name.toLowerCase() ?? 'меню')}
            </SectionTitle>
            {searching && (
              <p className="m-0 text-sm text-muted" aria-live="polite">
                {results.length > 0
                  ? `знайдено: ${results.length}`
                  : `нічого не знайдено за «${params.query.trim()}»`}
              </p>
            )}
            <div className="grid grid-cols-2 gap-3">
              {visible.map((item) => (
                <div key={item.id} id={`card-${item.id}`}>
                  <ItemCard
                    title={item.title}
                    to={`/menu/${item.id}${params.search}`}
                    selected={item.id === itemId}
                    compact
                    tag={searching ? categoryName.get(item.category) : undefined}
                    badges={item.isBestseller ? <Tag>★ хіт</Tag> : undefined}
                    className="h-full"
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <aside
        ref={detailRef}
        tabIndex={-1}
        aria-label="деталі позиції"
        className="min-h-0 overflow-auto border-l border-line-faint px-[22px] py-[18px] outline-none"
      >
        {selected ? (
          <ItemDetailContent key={selected.id} item={selected} variant="stacked" titleAs="h2" />
        ) : (
          data && (
            <p className="m-0 text-sm text-muted">
              Обери позицію зі списку. <kbd className="font-mono">↑</kbd> <kbd className="font-mono">↓</kbd> —
              по черзі.
            </p>
          )
        )}
      </aside>
    </DesktopPage>
  );
}
