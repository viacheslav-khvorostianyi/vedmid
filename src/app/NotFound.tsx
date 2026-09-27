import { Link } from 'react-router';
import Placeholder from '@/ui/Placeholder';

export default function NotFound() {
  return (
    <Placeholder title="сторінку не знайдено">
      <Link to="/menu" className="underline">
        повернутися до меню
      </Link>
    </Placeholder>
  );
}
