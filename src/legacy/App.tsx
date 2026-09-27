import React, { useState, useEffect } from 'react';
import { BookOpen, HelpCircle, Trophy, User, Sparkles, Award } from 'lucide-react';
import Header from './components/Header';
import MenuTab from './components/MenuTab';
import FlashcardTab from './components/FlashcardTab';
import GameTab from './components/GameTab';
import StatsDashboard from './components/StatsDashboard';
import { PlayerStats, MenuItem } from './types';
import { achievementsList } from './legacyData';
import { menuData as defaultMenuData } from '../data/menuData';

export default function App() {
  const [activeTab, setActiveTab] = useState<'menu' | 'flashcards' | 'games'>('menu');
  const [showStats, setShowStats] = useState(false);
  const [unlockedToast, setUnlockedToast] = useState<string | null>(null);

  // Master self-healing & duplicate removal & static merging function
  const healAndMergeItems = (loadedItems: MenuItem[]): MenuItem[] => {
    const seenIds = new Set<string>();
    const seenTitles = new Set<string>();
    const uniqueItems: MenuItem[] = [];

    loadedItems.forEach((item) => {
      // Clean and normalize keys
      const cleanId = item.id.trim();
      const cleanTitle = item.title.trim();
      const titleLower = cleanTitle.toLowerCase();

      // Find matching default item to restore/verify category/subcategory structure
      const defaultItem = defaultMenuData.find(
        (d) => d.id === cleanId || d.title.toLowerCase().trim() === titleLower
      );

      // Clone item and apply fixes from static default data if applicable
      let healedItem = { ...item, id: cleanId, title: cleanTitle };
      if (defaultItem) {
        healedItem = {
          ...defaultItem,
          ...item,
          id: cleanId,
          title: cleanTitle,
          category: defaultItem.category,
          subcategory: defaultItem.subcategory,
          profile: item.profile || defaultItem.profile,
          sweetness: item.sweetness || defaultItem.sweetness,
          grapeVarieties: item.grapeVarieties || defaultItem.grapeVarieties,
          producer: item.producer || defaultItem.producer,
          interestingFact: item.interestingFact || defaultItem.interestingFact,
          isBestseller: item.isBestseller !== undefined ? item.isBestseller : defaultItem.isBestseller,
          isFinalist: item.isFinalist !== undefined ? item.isFinalist : defaultItem.isFinalist,
          pairing: item.pairing || defaultItem.pairing,
          anchor: item.anchor || defaultItem.anchor
        };
      }

      if (!seenIds.has(cleanId) && !seenTitles.has(titleLower)) {
        seenIds.add(cleanId);
        seenTitles.add(titleLower);
        uniqueItems.push(healedItem);
      }
    });

    // Make sure we don't accidentally drop any essential default menu items
    defaultMenuData.forEach((defItem) => {
      const exists = uniqueItems.some(
        (item) => item.id === defItem.id || item.title.toLowerCase().trim() === defItem.title.toLowerCase().trim()
      );
      if (!exists) {
        uniqueItems.push(defItem);
      }
    });

    return uniqueItems;
  };

  // Initialize menu items state with local storage persistence and dynamic self-healing
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    const saved = localStorage.getItem('custom_restaurant_menu');
    let loadedItems: MenuItem[] = defaultMenuData;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loadedItems = parsed;
        }
      } catch (e) {
        console.error('Error loading custom menu from local storage', e);
      }
    }

    return healAndMergeItems(loadedItems);
  });

  // Custom setter that always heals and merges items to guarantee integrity of rich metadata
  const handleSetMenuItems = (newItems: MenuItem[] | ((prev: MenuItem[]) => MenuItem[])) => {
    setMenuItems((prev) => {
      const updated = typeof newItems === 'function' ? newItems(prev) : newItems;
      return healAndMergeItems(updated);
    });
  };

  // Persist menu items on changes
  useEffect(() => {
    localStorage.setItem('custom_restaurant_menu', JSON.stringify(menuItems));
  }, [menuItems]);

  // Initialize stats with local storage persistence
  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem('lis_waiter_stats_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading stats from local storage', e);
      }
    }
    return {
      xp: 0,
      level: 1,
      correctAnswers: 0,
      streak: 0,
      maxStreak: 0,
    };
  });

  // Save to local storage on changes
  useEffect(() => {
    localStorage.setItem('lis_waiter_stats_v2', JSON.stringify(stats));
  }, [stats]);

  // Handle XP addition
  const handleAddXp = (amount: number) => {
    setStats((prev) => {
      const nextXp = prev.xp + amount;
      
      // Calculate levels
      const prevLevel = Math.floor(prev.xp / 250) + 1;
      const nextLevel = Math.floor(nextXp / 250) + 1;

      // Trigger ranks milestone level up animation/sound simulation if rank increased
      if (nextLevel > prevLevel) {
        setUnlockedToast(`🎉 Новий Рівень! Ви отримали ранг ${nextLevel}-го ступеня!`);
        setTimeout(() => setUnlockedToast(null), 4000);
      }

      return {
        ...prev,
        xp: nextXp,
        level: nextLevel,
      };
    });
  };

  // Handle answers and streak tracking
  const handleUpdateStreak = (isCorrect: boolean) => {
    setStats((prev) => {
      const nextCorrectAnswers = isCorrect ? prev.correctAnswers + 1 : prev.correctAnswers;
      const nextStreak = isCorrect ? prev.streak + 1 : 0;
      const nextMaxStreak = Math.max(prev.maxStreak, nextStreak);

      // Simple achievement notifications check
      achievementsList.forEach((ach) => {
        const wasUnlockedBefore = ach.condition(prev);
        const isUnlockedNow = ach.condition({
          ...prev,
          correctAnswers: nextCorrectAnswers,
          streak: nextStreak,
          maxStreak: nextMaxStreak,
        });

        if (!wasUnlockedBefore && isUnlockedNow) {
          setUnlockedToast(`🏆 Досягнення розблоковано: "${ach.title}"!`);
          setTimeout(() => setUnlockedToast(null), 4500);
        }
      });

      return {
        ...prev,
        correctAnswers: nextCorrectAnswers,
        streak: nextStreak,
        maxStreak: nextMaxStreak,
      };
    });
  };

  return (
    <div className="min-h-screen bg-[#030a06] flex flex-col relative text-slate-100 overflow-x-hidden" id="app-root-shell">
      {/* Ambient forest background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/15 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-green-800/10 rounded-full blur-[130px] pointer-events-none z-0"></div>
      <div className="absolute top-[30%] right-[10%] w-[35%] h-[35%] bg-amber-600/5 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* Header bar (hidden on Menu tab since we merge it into MenuTab to avoid duplicate layout space) */}
      {activeTab !== 'menu' && <Header stats={stats} onOpenStats={() => setShowStats(true)} />}

      {/* Main Content Area */}
      <main className="flex-1 pb-28 relative z-10" id="main-content-stage">
        {activeTab === 'menu' && (
          <MenuTab 
            menuItems={menuItems} 
            onSetMenuItems={handleSetMenuItems} 
            onAddXp={handleAddXp} 
            stats={stats}
            onOpenStats={() => setShowStats(true)}
          />
        )}
        {activeTab === 'flashcards' && (
          <FlashcardTab 
            menuItems={menuItems} 
            onAddXp={handleAddXp} 
          />
        )}
        {activeTab === 'games' && (
          <GameTab 
            menuItems={menuItems} 
            onAddXp={handleAddXp} 
            onUpdateStreak={handleUpdateStreak} 
          />
        )}
      </main>

      {/* Real-time Unlocked Achievement Notification Popups Toast */}
      {unlockedToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-[#06150d]/90 backdrop-blur-xl border border-emerald-500/30 px-6 py-3.5 rounded-2xl shadow-[0_8px_32px_rgba(16,185,129,0.3)] flex items-center gap-3.5 animate-bounce">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl shrink-0">
            👑
          </div>
          <span className="text-xs font-black text-white leading-normal whitespace-nowrap">
            {unlockedToast}
          </span>
        </div>
      )}

      {/* Floating Personal Cabin Drawer Trigger button - Optimized for reliable touch in rush hours */}
      <div className="fixed bottom-24 right-5 z-40">
        <button
          onClick={() => setShowStats(true)}
          className="w-14 h-14 bg-[#05140d]/90 backdrop-blur-xl border-2 border-emerald-500/45 text-emerald-400 hover:text-emerald-300 rounded-full flex items-center justify-center shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all duration-200 cursor-pointer hover:scale-110 active:scale-95"
          title="Кабінет досягнень"
        >
          <Trophy className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Navigation Tabs Panel - Rebuilt with larger, heavy tactile targets for "moment of rush" */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#030a06]/95 backdrop-blur-2xl border-t-2 border-emerald-950 py-3.5 px-4 shadow-[0_-10px_35px_rgba(0,0,0,0.6)]">
        <div className="max-w-md mx-auto flex justify-around gap-2">
          {/* Menu browse tab */}
          <button
            onClick={() => setActiveTab('menu')}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-emerald-950/50 border-2 border-emerald-500/50 text-emerald-300 font-extrabold scale-102 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border-2 border-transparent hover:bg-white/5'
            }`}
            style={{ minHeight: '52px' }}
          >
            <BookOpen className="w-6 h-6 shrink-0" />
            <span className="text-[11px] tracking-wide uppercase font-black">Меню</span>
          </button>

          {/* Flashcards study tab */}
          <button
            onClick={() => setActiveTab('flashcards')}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'flashcards'
                ? 'bg-emerald-950/50 border-2 border-emerald-500/50 text-emerald-300 font-extrabold scale-102 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border-2 border-transparent hover:bg-white/5'
            }`}
            style={{ minHeight: '52px' }}
          >
            <Award className="w-6 h-6 shrink-0" />
            <span className="text-[11px] tracking-wide uppercase font-black">Картки</span>
          </button>

          {/* Gamified testing tab */}
          <button
            onClick={() => setActiveTab('games')}
            className={`flex-1 flex flex-col items-center justify-center gap-1.5 py-3 px-2 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'games'
                ? 'bg-emerald-950/50 border-2 border-emerald-500/50 text-emerald-300 font-extrabold scale-102 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                : 'text-slate-400 hover:text-slate-200 border-2 border-transparent hover:bg-white/5'
            }`}
            style={{ minHeight: '52px' }}
          >
            <HelpCircle className="w-6 h-6 shrink-0" />
            <span className="text-[11px] tracking-wide uppercase font-black">Тести й Ігри</span>
          </button>
        </div>
      </nav>

      {/* Achievements and Stats Cabinet Modal Component */}
      {showStats && <StatsDashboard stats={stats} onClose={() => setShowStats(false)} />}
    </div>
  );
}
