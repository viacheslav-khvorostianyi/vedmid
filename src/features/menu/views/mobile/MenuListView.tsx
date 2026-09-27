import ChipRow from '@/ui/ChipRow';
import ItemCard from '@/ui/ItemCard';
import SearchInput from '@/ui/SearchInput';
import SectionTitle from '@/ui/SectionTitle';
import Tag from '@/ui/Tag';
import { MenuError, MenuLoading } from '../../components/MenuStatus';
import { useMenuSearch, useMenuSections } from '../../hooks/useMenu';
import { useMenuParams } from '../../hooks/useMenuParams';
import { MIN_QUERY_LENGTH, normalize } from '../../model';
import type { MenuItem } from '../../types';

function badges(item: MenuItem) {
  return item.isBestseller ? <Tag>★ хіт</Tag> : undefined;
}

export default function MenuListView() {
  const { category, query, search, setCategory, setQuery } = useMenuParams();
  const active = category ?? 'food';
  const { data, isPending, isError, refetch, sections } = useMenuSections(active);
  const { results } = useMenuSearch(query);
  const searching = normalize(query).length >= MIN_QUERY_LENGTH;
  const categoryName = new Map(data?.categories.map((c) => [c.slug, c.name]));

  return (
    <div className="flex flex-col gap-3.5">
      <h1 className="sr-only">меню</h1>
      <SearchInput id="menu-search" value={query} onChange={setQuery} />
      <ChipRow
        id="menu-cats"
        label="категорії меню"
        controls="menu-results"
        options={(data?.categories ?? []).map((c) => ({ value: c.slug, label: c.name }))}
        value={active}
        onChange={setCategory}
      />

      <div id="menu-results" className="flex flex-col gap-3.5">
        {isPending && <MenuLoading />}
        {isError && !data && <MenuError onRetry={() => refetch()} />}

        {data && searching && (
          <>
            <p className="m-0 text-sm text-muted" aria-live="polite">
              {results.length > 0 ? `знайдено: ${results.length}` : `нічого не знайдено за «${query.trim()}»`}
            </p>
            {results.map((item) => (
              <ItemCard
                key={item.id}
                title={item.title}
                to={`/menu/${item.id}${search}`}
                tag={categoryName.get(item.category)}
                badges={badges(item)}
              />
            ))}
          </>
        )}

        {data &&
          !searching &&
          sections.map(({ subcategory, items }) => (
            <section
              key={subcategory.id}
              aria-labelledby={`sub-${subcategory.id}`}
              className="flex flex-col gap-3.5"
            >
              {/* Sticky: the current subcategory stays visible while scrolling (DESIGN §5.1) */}
              <div className="sticky top-[env(safe-area-inset-top,0px)] z-10 bg-bg pt-2">
                <SectionTitle>
                  <span id={`sub-${subcategory.id}`}>{subcategory.name.toLowerCase()}</span>
                </SectionTitle>
              </div>
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  title={item.title}
                  to={`/menu/${item.id}${search}`}
                  badges={badges(item)}
                />
              ))}
            </section>
          ))}

        {data && <hr className="m-0 border-0 border-t border-line-soft" />}
      </div>
    </div>
  );
}
