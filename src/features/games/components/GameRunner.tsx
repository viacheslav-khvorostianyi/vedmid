import { useState } from 'react';
import { Link } from 'react-router';
import { MenuError, MenuLoading } from '@/features/menu/components/MenuStatus';
import { useMenu } from '@/features/menu/hooks/useMenu';
import { useGuestScenarios } from '../hooks/useGuestScenarios';
import type { GameMode } from '../modes';
import GuestGame from './GuestGame';
import MatchGame from './MatchGame';
import QuizGame from './QuizGame';
import RecipeGame from './RecipeGame';

/** Loads what a game needs and runs it; «ще раз» remounts the game with a fresh shuffle. */
export default function GameRunner({ mode, keyboard }: { mode: GameMode; keyboard: boolean }) {
  const [run, setRun] = useState(0);
  const menu = useMenu();
  const guest = useGuestScenarios(mode === 'guest');
  const restart = () => setRun((r) => r + 1);

  const source = mode === 'guest' ? guest : menu;
  if (source.isPending) return <MenuLoading cards={3} />;
  if (source.isError && !source.data) return <MenuError onRetry={() => source.refetch()} />;

  switch (mode) {
    case 'quiz':
      return <QuizGame key={run} items={menu.data!.items} keyboard={keyboard} onRestart={restart} />;
    case 'match':
      return <MatchGame key={run} items={menu.data!.items} onRestart={restart} />;
    case 'recipe':
      return <RecipeGame key={run} items={menu.data!.items} onRestart={restart} />;
    case 'guest':
      return guest.data!.length ? (
        <GuestGame key={run} scenarios={guest.data!} keyboard={keyboard} onRestart={restart} />
      ) : (
        <div className="flex flex-col gap-3">
          <h1 className="m-0 font-mono text-lg font-extrabold text-green-hi">гість</h1>
          <p className="m-0 text-sm">
            Сценаріїв поки немає. Менеджер може додати їх у розділі «керування меню».
          </p>
          <Link to="/games" className="text-sm underline">
            до ігор
          </Link>
        </div>
      );
  }
}
