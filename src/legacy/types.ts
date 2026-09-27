export interface MenuItem {
  id: string;
  category: 'Їжа' | 'Вино' | 'Коктейлі' | 'Безалкогольні & Пиво' | 'Міцні напої';
  subcategory: string;
  title: string;
  anchor: string;
  ingredients: string;
  sales: string;
  profile?: {
    labels: string[]; // e.g., ["Т", "К", "С", "В"] or ["С", "К", "М", "Н"]
    values: number[]; // 1 to 3 scale
  };
  interestingFact?: string;
  pairing?: string;
  allergens?: string[];
  // Wine specific fields
  grapeVarieties?: string;
  sweetness?: 'сухе' | 'напівсухе' | 'напівсолодке' | 'солодке' | string;
  producer?: {
    uniqueness: string;
    facilities: string;
    rawMaterials: string;
  };
  isBestseller?: boolean;
  isFinalist?: boolean;
}

export interface SteakDoneness {
  level: string;
  temp: string;
  desc: string;
  recommend: string;
}

export interface PlayerStats {
  xp: number;
  streak: number;
  lives: number;
  maxStreak: number;
  correctAnswers: number;
  totalQuestions: number;
  unlockedAchievements: string[];
}

export interface Achievement {
  id: string;
  title: string;
  desc: string;
  xpReward: number;
  icon: string;
  condition: (stats: PlayerStats) => boolean;
}
