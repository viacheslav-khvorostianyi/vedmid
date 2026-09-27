import React from 'react';
import { Award, Flame, Star, Trophy, Sparkles } from 'lucide-react';
import { PlayerStats } from '../types';

interface HeaderProps {
  stats: PlayerStats;
  onOpenStats: () => void;
}

export default function Header({ stats, onOpenStats }: HeaderProps) {
  // Calculate Level based on XP (e.g., every 250 XP is a level)
  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 250) + 1;
  };

  const level = calculateLevel(stats.xp);
  const xpInCurrentLevel = stats.xp % 250;
  const xpNeededForNextLevel = 250;
  const progressPercent = Math.min((xpInCurrentLevel / xpNeededForNextLevel) * 100, 100);

  // Waiter rank label based on Level
  const getRankLabel = (lvl: number) => {
    if (lvl >= 8) return 'Шеф-Сомельє';
    if (lvl >= 6) return 'Старший Офіціант';
    if (lvl >= 4) return 'Профі Офіціант';
    if (lvl >= 2) return 'Офіціант';
    return 'Стажер ЛІСу';
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#030a06]/90 backdrop-blur-xl border-b border-emerald-950/60 shadow-[0_4px_25px_rgba(3,10,6,0.5)] px-4 py-3.5" id="app-header">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] tracking-wider uppercase text-emerald-400 font-extrabold">Ресторан</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-extrabold text-amber-400 tracking-wide">Помічник</span>
            </div>
            <h1 className="text-base font-black text-white tracking-tight -mt-0.5 flex items-center gap-1 uppercase">
              <span>просто ліс</span>
              <span className="text-xs">🌲</span>
            </h1>
          </div>
        </div>

        {/* User stats widget */}
        <div className="flex items-center gap-3">
          {/* Streak Indicator */}
          {stats.streak > 0 && (
            <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-full text-emerald-300 font-bold text-xs animate-bounce">
              <Flame className="w-4 h-4 fill-emerald-500 text-emerald-500" />
              <span>{stats.streak} дн.</span>
            </div>
          )}

          {/* XP & Level Indicator */}
          <button
            onClick={onOpenStats}
            className="flex items-center gap-3 bg-[#05140d]/80 hover:bg-[#071b12] border border-emerald-900/50 px-3.5 py-2 rounded-xl transition duration-200 text-left cursor-pointer"
          >
            <div className="relative flex items-center justify-center">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-400 text-[#030a06] font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#030a06]">
                {level}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-wider">{getRankLabel(level)}</p>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-emerald-950 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-emerald-300/80">{stats.xp} XP</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
