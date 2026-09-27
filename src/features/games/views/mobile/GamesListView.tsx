import SectionTitle from '@/ui/SectionTitle';
import { GameCard } from '../../components/GameParts';
import { GAME_MODES } from '../../modes';

export default function GamesListView() {
  return (
    <div className="flex flex-col gap-3.5">
      <SectionTitle as="h1">ігри</SectionTitle>
      {GAME_MODES.map((g) => (
        <GameCard key={g.mode} to={`/games/${g.mode}`} title={g.title} description={g.description} />
      ))}
    </div>
  );
}
