import DesktopPage from '@/shells/desktop/DesktopPage';
import SectionTitle from '@/ui/SectionTitle';
import { GameCard } from '../../components/GameParts';
import { GAME_MODES } from '../../modes';

export default function GamesGridView() {
  return (
    <DesktopPage>
      <div className="mx-auto flex max-w-[720px] flex-col gap-4">
        <SectionTitle as="h1">ігри</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          {GAME_MODES.map((g) => (
            <GameCard key={g.mode} to={`/games/${g.mode}`} title={g.title} description={g.description} />
          ))}
        </div>
      </div>
    </DesktopPage>
  );
}
