import { useParams } from 'react-router';
import NotFound from '@/app/NotFound';
import GameRunner from '../../components/GameRunner';
import { isGameMode } from '../../modes';

/** Full-screen game (the route hides the bottom nav). */
export default function GameRunView() {
  const { mode } = useParams();
  if (!isGameMode(mode)) return <NotFound />;
  return (
    <div className="flex flex-col gap-4 pb-6">
      <GameRunner mode={mode} keyboard={false} />
    </div>
  );
}
