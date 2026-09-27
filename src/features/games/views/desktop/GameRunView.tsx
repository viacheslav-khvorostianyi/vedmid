import { useParams } from 'react-router';
import NotFound from '@/app/NotFound';
import DesktopPage from '@/shells/desktop/DesktopPage';
import GameRunner from '../../components/GameRunner';
import { isGameMode } from '../../modes';

/** Game centred at 720px; number keys pick answers in the quiz and guest games. */
export default function GameRunView() {
  const { mode } = useParams();
  if (!isGameMode(mode)) return <NotFound />;
  return (
    <DesktopPage>
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        <GameRunner mode={mode} keyboard />
      </div>
    </DesktopPage>
  );
}
