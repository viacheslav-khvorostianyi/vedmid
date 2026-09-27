// Mirrors the achievements inserted by supabase/migrations/0001_init.sql (keep both in sync).
import type { Tables } from '../../src/lib/db.types';

export const ACHIEVEMENT_ROWS: Tables<'achievements'>[] = [
  {
    id: 'ach-1',
    title: 'Стажер ЛІСу',
    description: 'Наберіть перші 100 XP знань',
    icon: '🌱',
    xp_reward: 50,
    rule: { metric: 'xp', gte: 100 },
    sort: 1,
  },
  {
    id: 'ach-2',
    title: 'Винний Гурман',
    description: 'Досягніть серії з 5 правильних відповідей',
    icon: '🍷',
    xp_reward: 100,
    rule: { metric: 'max_streak', gte: 5 },
    sort: 2,
  },
  {
    id: 'ach-3',
    title: 'Гросмейстер Меню',
    description: 'Наберіть 1000 XP знань',
    icon: '🧠',
    xp_reward: 300,
    rule: { metric: 'xp', gte: 1000 },
    sort: 3,
  },
  {
    id: 'ach-4',
    title: 'Ідеальний Офіціант',
    description: 'Дайте 30 правильних відповідей у тестах',
    icon: '⭐',
    xp_reward: 200,
    rule: { metric: 'correct_answers', gte: 30 },
    sort: 4,
  },
  {
    id: 'ach-5',
    title: 'Незламний серцеїд',
    description: 'Дайте 10 правильних відповідей поспіль',
    icon: '🔥',
    xp_reward: 150,
    rule: { metric: 'max_streak', gte: 10 },
    sort: 5,
  },
];
