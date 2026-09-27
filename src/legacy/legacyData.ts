// Removed features' static data (steak guide) and the old client-side achievement rules.
// Reference only while porting; achievements now live in the DB (supabase/migrations/0001_init.sql).
import { SteakDoneness, Achievement } from './types';

// Steak doneness guide
export const steakDonenessGuide: SteakDoneness[] = [
  {
    level: 'BLUE',
    temp: '46-49°C',
    desc: 'Сире всередині, злегка прогріте, швидко "закрите" на сильному вогні з усіх боків.',
    recommend: 'Для справжніх поціновувачів та шанувальників чистого м\'ясного смаку.'
  },
  {
    level: 'RARE',
    temp: '49-55°C',
    desc: 'Червоне всередині, з кров\'ю, тонка обсмажена скоринка.',
    recommend: 'Тим, хто цінує максимальну соковитість та ніжність волокон.'
  },
  {
    level: 'MED RARE',
    temp: '55-60°C',
    desc: 'Рожевий сік, без крові, насичено рожева серцевина. Золотий стандарт для яловичих стейків.',
    recommend: 'Рекомендоване просмажування для Філе Міньйон та більшості яловичих відрубів.'
  },
  {
    level: 'MEDIUM',
    temp: '60-65°C',
    desc: 'Світло-рожевий сік, ніжна рожева середина. Найпопулярніший вибір гостей.',
    recommend: 'Універсальний вибір, що підходить для більшості гостей.'
  },
  {
    level: 'MED WELL',
    temp: '65-69°C',
    desc: 'Прозорий сік, майже повністю просмажене м\'ясо, колір волокон сіро-коричневий.',
    recommend: 'Для гостей, які побоюються або не люблять рожевих відтінків у м\'ясі.'
  },
  {
    level: 'WELL DONE',
    temp: '71-100°C',
    desc: 'Повністю просмажене, сухувате м\'ясо без соку.',
    recommend: 'Готується виключно за наполегливою вимогою гостя (краще делікатно попередити про сухість).'
  }
];

// Achievements definition
export const achievementsList: Achievement[] = [
  {
    id: 'ach-1',
    title: 'Стажер ЛІСу',
    desc: 'Наберіть перші 100 XP знань',
    xpReward: 50,
    icon: '🌱',
    condition: (stats) => stats.xp >= 100
  },
  {
    id: 'ach-2',
    title: 'Винний Гурман',
    desc: 'Досягніть серії з 5 правильних відповідей',
    xpReward: 100,
    icon: '🍷',
    condition: (stats) => stats.maxStreak >= 5
  },
  {
    id: 'ach-3',
    title: 'Гросмейстер Меню',
    desc: 'Наберіть 1000 XP знань',
    xpReward: 300,
    icon: '🧠',
    condition: (stats) => stats.xp >= 1000
  },
  {
    id: 'ach-4',
    title: 'Ідеальний Офіціант',
    desc: 'Дайте 30 правильних відповідей у тестах',
    xpReward: 200,
    icon: '⭐',
    condition: (stats) => stats.correctAnswers >= 30
  },
  {
    id: 'ach-5',
    title: 'Незламний серцеїд',
    desc: 'Дайте 10 правильних відповідей поспіль',
    xpReward: 150,
    icon: '🔥',
    condition: (stats) => stats.maxStreak >= 10
  }
];
