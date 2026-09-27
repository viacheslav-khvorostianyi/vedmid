export type GameMode = 'quiz' | 'match' | 'recipe' | 'guest';

export const GAME_MODES: readonly { mode: GameMode; title: string; description: string }[] = [
  { mode: 'quiz', title: 'вікторина', description: '10 питань · 15 с на відповідь · 3 життя' },
  { mode: 'match', title: 'пари', description: "з'єднай страву з її «якорем»" },
  { mode: 'recipe', title: 'рецепт', description: 'обери правильні інгредієнти' },
  { mode: 'guest', title: 'гість', description: 'ситуація за столом: що порадиш?' },
];

export function isGameMode(value: string | undefined): value is GameMode {
  return GAME_MODES.some((g) => g.mode === value);
}
