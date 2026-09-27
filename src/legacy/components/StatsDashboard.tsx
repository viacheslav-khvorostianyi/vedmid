import React from 'react';
import { Trophy, Star, Award, Flame, Zap, ShieldAlert, Sparkles, BookOpen, Crown } from 'lucide-react';
import { PlayerStats, Achievement } from '../types';
import { achievementsList } from '../legacyData';

interface StatsDashboardProps {
  stats: PlayerStats;
  onClose: () => void;
}

export default function StatsDashboard({ stats, onClose }: StatsDashboardProps) {
  const calculateLevel = (xp: number) => {
    return Math.floor(xp / 250) + 1;
  };

  const level = calculateLevel(stats.xp);
  const xpInCurrentLevel = stats.xp % 250;
  const xpNeededForNextLevel = 250;
  const progressPercent = Math.min((xpInCurrentLevel / xpNeededForNextLevel) * 100, 100);

  // Dynamic ranking label based on Level
  const getRankLabel = (lvl: number) => {
    if (lvl >= 8) return 'Шеф-Сомельє';
    if (lvl >= 6) return 'Старший Офіціант';
    if (lvl >= 4) return 'Профі Офіціант';
    if (lvl >= 2) return 'Офіціант';
    return 'Стажер ЛІСу';
  };

  // Verify which achievements are unlocked
  const unlockedAchievements = achievementsList.filter((ach) => ach.condition(stats));

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0f1e]/85 backdrop-blur-xl overflow-y-auto" id="stats-dashboard-modal">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        
        {/* Modal Top Nav Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5.5 h-5.5 text-cyan-400" />
            <h2 className="text-xl font-extrabold text-white tracking-tight">Кабінет Знань та Рекордів</h2>
          </div>
          <button
            onClick={onClose}
            className="text-xs bg-white/5 hover:bg-white/10 text-slate-200 font-bold px-3.5 py-1.5 rounded-lg border border-white/10 transition cursor-pointer"
          >
            Закрити ✕
          </button>
        </div>

        {/* Level and XP Badge Profile */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row gap-5 items-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border-2 border-cyan-400/50 flex flex-col items-center justify-center text-center shadow-lg relative shrink-0">
            <span className="text-[10px] text-cyan-400 font-extrabold uppercase tracking-wider">Рівень</span>
            <span className="text-3xl font-extrabold text-white leading-none mt-1">{level}</span>
            <Crown className="w-4 h-4 text-cyan-400 absolute -top-2.5 -right-2.5 rotate-12 drop-shadow" />
          </div>

          <div className="flex-1 w-full space-y-3">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight text-center sm:text-left">{getRankLabel(level)}</h3>
              <p className="text-xs text-slate-400 text-center sm:text-left">Професійний статус у ресторані ЛІС</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-300">
                <span>Прогрес знань</span>
                <span className="font-mono text-cyan-400">{stats.xp} / {(Math.floor(stats.xp / 250) + 1) * 250} XP</span>
              </div>
              <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 italic text-right">* Отримуйте XP за правильні відповіді та вивчення карток.</p>
            </div>
          </div>
        </div>

        {/* Key Waiter Metrics Grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
            <Flame className="w-5 h-5 text-purple-400 mx-auto mb-1 fill-purple-500/10" />
            <span className="text-lg font-mono font-extrabold text-white">{stats.streak}</span>
            <p className="text-[9px] uppercase font-extrabold text-slate-400 mt-0.5">Поточна серія</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
            <Zap className="w-5 h-5 text-cyan-400 mx-auto mb-1 fill-cyan-400/10" />
            <span className="text-lg font-mono font-extrabold text-white">{stats.correctAnswers}</span>
            <p className="text-[9px] uppercase font-extrabold text-slate-400 mt-0.5">Відповідей</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-3 rounded-xl text-center">
            <Award className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <span className="text-lg font-mono font-extrabold text-white">{unlockedAchievements.length}</span>
            <p className="text-[9px] uppercase font-extrabold text-slate-400 mt-0.5">Досягнень</p>
          </div>
        </div>


        {/* Achievements List */}
        <div className="space-y-3">
          <h3 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider px-1">
            Нагороди та Відзнаки ресторану (Achievements)
          </h3>
          <div className="grid grid-cols-1 gap-2.5">
            {achievementsList.map((ach) => {
              const isUnlocked = ach.condition(stats);
              return (
                <div
                  key={ach.id}
                  className={`border rounded-xl p-3 flex items-start justify-between gap-3.5 transition duration-200 ${
                    isUnlocked
                      ? 'bg-white/10 backdrop-blur-md border-cyan-500/30 shadow-lg'
                      : 'bg-white/5 border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center text-xl shrink-0 ${
                      isUnlocked
                        ? 'bg-cyan-500/10 border-cyan-500/20'
                        : 'bg-white/5 border-white/5'
                    }`}>
                      {ach.icon}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold flex items-center gap-1.5 ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                        {ach.title}
                        {isUnlocked && (
                          <span className="text-[9px] bg-cyan-500/10 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-500/20">
                            Отримано!
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-normal mt-0.5">{ach.desc}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded">
                      +{ach.xpReward} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Call to action footer */}
        <div className="text-center pt-4">
          <button
            onClick={onClose}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-[#0a0f1e] font-extrabold py-3.5 px-6 rounded-xl transition duration-150 cursor-pointer text-xs shadow-[0_0_15px_rgba(6,182,212,0.45)]"
          >
            Повернутися до навчання
          </button>
        </div>

      </div>
    </div>
  );
}
