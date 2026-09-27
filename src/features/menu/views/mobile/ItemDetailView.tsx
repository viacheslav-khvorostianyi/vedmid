import { ChevronLeft } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import ItemDetailContent from '../../components/ItemDetailContent';
import { MenuError, MenuLoading } from '../../components/MenuStatus';
import { useItem } from '../../hooks/useMenu';

export default function ItemDetailView() {
  const { itemId } = useParams();
  const { item, data, isPending, isError, refetch } = useItem(itemId);
  const navigate = useNavigate();
  const location = useLocation();
  // Came from inside the app → go back (restores list scroll); opened directly → go to the item's category.
  const canGoBack = location.key !== 'default';

  if (isPending) return <MenuLoading cards={2} />;
  if (isError && !data) return <MenuError onRetry={() => refetch()} />;
  if (!item) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="m-0 font-mono text-xl font-extrabold text-green-hi">позицію не знайдено</h1>
        <p className="m-0 text-sm">Можливо, її прибрали з меню.</p>
        <Link to="/menu" className="text-sm underline">
          до меню
        </Link>
      </div>
    );
  }

  const back = (
    <>
      <ChevronLeft aria-hidden="true" className="size-5" strokeWidth={2} />
      {item.subcategory.toLowerCase()}
    </>
  );
  const backClass =
    'inline-flex min-h-11 items-center gap-1 self-start font-mono text-xl font-extrabold text-green-hi hover:text-line';

  return (
    <article className="flex flex-col gap-3.5">
      {canGoBack ? (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className={backClass}
          aria-label={`назад: ${item.subcategory}`}
        >
          {back}
        </button>
      ) : (
        <Link to={`/menu?c=${item.category}`} className={backClass} aria-label={`назад: ${item.subcategory}`}>
          {back}
        </Link>
      )}
      <ItemDetailContent key={item.id} item={item} variant="tabs" />
    </article>
  );
}
