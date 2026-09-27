import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Eye, ChevronLeft, ChevronRight, RotateCw, Flame, CheckCircle, Sparkles, Filter } from 'lucide-react';
import { MenuItem } from '../types';

interface FlashcardTabProps {
  menuItems: MenuItem[];
  onAddXp: (amount: number) => void;
}

export default function FlashcardTab({ menuItems, onAddXp }: FlashcardTabProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>('Всі');
  const [cards, setCards] = useState<MenuItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsFDragging] = useState(false);
  const [lastAction, setLastAction] = useState<'know' | 'dont-know' | null>(null);

  const touchStartX = useRef<number>(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Categories list for filtering
  const filterOptions = useMemo(() => {
    return ['Всі', 'Їжа', 'Вино', 'Коктейлі', 'Безалкогольні & Пиво', 'Міцні напої'];
  }, []);

  // Set up and shuffle cards
  useEffect(() => {
    let filtered = menuItems;
    if (selectedFilter !== 'Всі') {
      filtered = menuItems.filter((item) => item.category === selectedFilter);
    }
    // Shuffle cards
    const shuffled = [...filtered].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSwipeOffset(0);
    setLastAction(null);
  }, [selectedFilter, menuItems]);

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setSwipeOffset(0);
    setLastAction(null);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    if (cards.length === 0) return;
    setIsFlipped(false);
    setSwipeOffset(0);
    setLastAction(null);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const handleAction = (type: 'know' | 'dont-know') => {
    setLastAction(type);
    if (type === 'know') {
      // Award 5 XP for knowing
      onAddXp(5);
      setSwipeOffset(150); // slide right
    } else {
      setSwipeOffset(-150); // slide left
    }

    setTimeout(() => {
      handleNext();
    }, 250);
  };

  // TOUCH GESTURE LISTENERS (highly responsive)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.changedTouches[0].clientX;
    const diff = currentX - touchStartX.current;
    // Visually shift card as they drag
    if (flashCardRef.current) {
      flashCardRef.current.style.transform = `translateX(${diff}px) rotate(${diff * 0.05}deg)`;
      setSwipeOffset(diff);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchendX = e.changedTouches[0].clientX;
    const diff = touchendX - touchStartX.current;

    if (flashCardRef.current) {
      flashCardRef.current.style.transform = ''; // reset style
    }

    // Threshold for swipe: 100 pixels
    if (diff > 100) {
      handleAction('know');
    } else if (diff < -100) {
      handleAction('dont-know');
    } else {
      setSwipeOffset(0);
    }
  };

  // Keyboard Navigation for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleFlip();
      } else if (e.code === 'ArrowRight') {
        handleAction('know');
      } else if (e.code === 'ArrowLeft') {
        handleAction('dont-know');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, isFlipped, cards]);

  const flashCardRef = useRef<HTMLDivElement>(null);

  if (cards.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">Немає карток для вивчення.</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-4 space-y-6" id="flashcards-tab-container">
      {/* Filters bar - Extra tactile height for simple selection */}
      <div className="flex flex-col gap-2">
        <label className="text-xs uppercase font-extrabold text-slate-400 flex items-center gap-1.5 px-1">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          Розділ навчання:
        </label>
        <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
          {filterOptions.map((opt) => (
            <button
              key={opt}
              onClick={() => setSelectedFilter(opt)}
              className={`px-4.5 py-3.5 rounded-xl text-xs font-black transition whitespace-nowrap cursor-pointer border min-h-[48px] ${
                selectedFilter === opt
                  ? 'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                  : 'bg-emerald-950/15 border-emerald-900/35 text-slate-400 hover:text-white hover:bg-emerald-900/10'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs text-slate-400 font-semibold">
          Картка: <span className="font-mono text-white font-extrabold">{currentIndex + 1}</span> з{' '}
          <span className="font-mono text-slate-400">{cards.length}</span>
        </span>
        <div className="flex gap-1">
          <span className="text-[10px] bg-emerald-500/10 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
            {selectedFilter}
          </span>
        </div>
      </div>

      {/* Flashcard 3D Stage */}
      <div className="relative h-[380px] w-full flex items-center justify-center">
        {/* Swiping Feedback Indicators overlay */}
        {swipeOffset > 40 && (
          <div className="absolute top-10 right-10 z-20 bg-emerald-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full rotate-12 shadow-[0_4px_12px_rgba(16,185,129,0.4)] animate-bounce">
            ЗНАЮ! +5 XP
          </div>
        )}
        {swipeOffset < -40 && (
          <div className="absolute top-10 left-10 z-20 bg-rose-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full -rotate-12 shadow-[0_4px_12px_rgba(225,29,72,0.4)] animate-bounce">
            ПОВТОРИТИ
          </div>
        )}

        <div
          ref={flashCardRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full cursor-pointer relative select-none touch-none transition-all duration-300 ease-out"
          style={{
            perspective: '1000px',
          }}
        >
          {/* Card Inner Rotator */}
          <div
            onClick={handleFlip}
            className={`w-full h-full duration-500 transition-transform relative`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* FRONT FACE (Question / Name / Anchor) */}
            <div
              className="absolute inset-0 w-full h-full rounded-2xl p-6 bg-gradient-to-br from-emerald-950/40 to-emerald-950/20 backdrop-blur-2xl border-2 border-emerald-500/25 shadow-[0_4px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between items-center backface-hidden"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="w-full flex justify-between items-center border-b border-emerald-900/45 pb-3">
                <span className="text-[9px] tracking-widest uppercase font-extrabold bg-emerald-500/10 border border-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded">
                  {currentCard.subcategory}
                </span>
                <span className="text-[9px] uppercase font-bold text-slate-500">ЛІС • КАРТКИ</span>
              </div>

              <div className="text-center space-y-4 my-auto max-w-[90%]">
                <h2 className="text-2xl font-extrabold text-white tracking-tight leading-snug">
                  {currentCard.title}
                </h2>
                <div className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                  <span className="text-[10px] text-emerald-400 font-extrabold">⚓ {currentCard.anchor}</span>
                </div>
              </div>

              <div className="w-full text-center space-y-2 pt-3 border-t border-emerald-900/45">
                <p className="text-[11px] text-slate-400 font-semibold flex items-center justify-center gap-1.5">
                  <RotateCw className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
                  Натисніть на картку, щоб перевернути
                </p>
                <p className="text-[9px] text-slate-500">
                  Мобільний: свайп праворуч (знаю) / ліворуч (не знаю)
                </p>
              </div>
            </div>

            {/* BACK FACE (Answers / Details / Sales) */}
            <div
              className="absolute inset-0 w-full h-full rounded-2xl p-5 bg-[#030a06]/98 backdrop-blur-3xl border-2 border-emerald-500/35 shadow-[0_4px_35px_rgba(16,185,129,0.2)] flex flex-col justify-between backface-hidden"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {/* Back header */}
              <div className="flex justify-between items-center border-b border-emerald-900/45 pb-2.5">
                <span className="text-[10px] tracking-wider uppercase font-extrabold text-emerald-400">⚓ {currentCard.anchor}</span>
                <span className="text-[9px] font-bold text-emerald-500/80 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                  ШПАРГАЛКА
                </span>
              </div>

              {/* Back Content - Scrollable area with stopPropagation to prevent accidental flip while scrolling */}
              <div 
                onClick={(e) => e.stopPropagation()}
                className="flex-1 my-3 overflow-y-auto pr-1 space-y-3.5 text-left no-scrollbar"
                style={{ maxHeight: 'calc(100% - 60px)' }}
              >
                {/* Ingredients */}
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Склад / Опис:</p>
                  <p className="text-xs text-slate-100 font-semibold leading-relaxed bg-[#05150e] p-2.5 rounded-xl border border-emerald-950">
                    {currentCard.ingredients}
                  </p>
                </div>

                {/* Wine Specific Specs (Grapes & Sweetness) */}
                {(currentCard.grapeVarieties || currentCard.sweetness) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentCard.grapeVarieties && currentCard.grapeVarieties !== 'Не вказано' && (
                      <div className="bg-[#05150e] p-2 rounded-xl border border-emerald-950/80">
                        <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">🍇 Сорти винограду:</p>
                        <p className="text-[11px] text-slate-200 font-bold mt-0.5">{currentCard.grapeVarieties}</p>
                      </div>
                    )}
                    {currentCard.sweetness && (
                      <div className="bg-[#05150e] p-2 rounded-xl border border-emerald-950/80">
                        <p className="text-[8px] uppercase font-bold text-slate-500 tracking-wider">🍬 Рівень цукру:</p>
                        <p className="text-[11px] text-purple-300 font-bold mt-0.5 capitalize">{currentCard.sweetness}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Selling Phrase */}
                <div className="space-y-1">
                  <p className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">Фраза для продажу (Мовний модуль):</p>
                  <div className="bg-[#05150e] border-l-3 border-emerald-500 p-2.5 rounded-r-xl rounded-l-md">
                    <p className="text-xs italic text-[#f1f5f9] font-medium leading-relaxed">
                      {currentCard.sales}
                    </p>
                  </div>
                </div>

                {/* Gastronomic Pairing */}
                {currentCard.pairing && (
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">🍽️ Гастрономічне поєднання:</p>
                    <p className="text-xs text-slate-200 font-semibold leading-relaxed bg-[#05150e] p-2.5 rounded-xl border border-emerald-950">
                      {currentCard.pairing}
                    </p>
                  </div>
                )}

                {/* Allergens Alert */}
                {currentCard.allergens && currentCard.allergens.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">⚠️ Контроль безпеки (Алергени):</p>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-rose-950/15 border border-rose-950/40 rounded-xl">
                      {currentCard.allergens.map((alg) => (
                        <span key={alg} className="text-[10px] text-rose-300 font-extrabold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/30 capitalize">
                          {alg}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interesting Fact (Storytelling hook) */}
                {currentCard.interestingFact && (
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-amber-400 tracking-wider">✨ Сторітелінг / Цікавий факт:</p>
                    <div className="bg-amber-950/10 border border-amber-900/25 p-2.5 rounded-xl text-xs text-amber-100/90 leading-relaxed">
                      💡 {currentCard.interestingFact}
                    </div>
                  </div>
                )}

                {/* Producer Details */}
                {currentCard.producer && (
                  <div className="space-y-1.5 bg-[#05150e] p-3 rounded-xl border border-emerald-950/80 text-[11px]">
                    <p className="text-[9px] uppercase font-bold text-purple-400 tracking-wider border-b border-purple-950/60 pb-1">🍷 Про терруар та виноробню:</p>
                    <div className="space-y-2 text-slate-300">
                      {currentCard.producer.uniqueness && (
                        <p className="leading-relaxed">
                          🌟 <b>Унікальність:</b> {currentCard.producer.uniqueness}
                        </p>
                      )}
                      {currentCard.producer.facilities && (
                        <p className="leading-relaxed">
                          🏢 <b>Потужності:</b> {currentCard.producer.facilities}
                        </p>
                      )}
                      {currentCard.producer.rawMaterials && (
                        <p className="leading-relaxed">
                          🌾 <b>Сировина:</b> {currentCard.producer.rawMaterials}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Wine/Bar/Cocktail Taste Profiles */}
                {currentCard.profile && (
                  <div className="space-y-1">
                    <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Профіль смаку:</p>
                    <div className="grid grid-cols-2 gap-2 bg-[#05150e] p-2.5 rounded-xl border border-emerald-950 text-[10px]">
                      {currentCard.profile.labels.map((lbl, idx) => {
                        const val = currentCard.profile?.values[idx] || 1;
                        return (
                          <div key={lbl} className="flex justify-between items-center px-1">
                            <span className="text-slate-400 font-semibold">{lbl}:</span>
                            <span className="text-amber-400 font-bold">{'★'.repeat(val)}{'☆'.repeat(3 - val)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Back Footer */}
              <div className="text-center pt-2 border-t border-emerald-900/45 text-[10px] text-slate-400 flex items-center justify-center gap-1">
                <RotateCw className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
                <span>Натисніть по ободку картки для повороту</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual buttons - Tactile high reliability buttons for busy waitstaff */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2.5">
          {/* Don't know button */}
          <button
            onClick={() => handleAction('dont-know')}
            className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 hover:border-rose-500/45 text-rose-300 font-bold py-4 px-4 rounded-xl transition duration-150 flex flex-col items-center justify-center cursor-pointer shadow-md text-xs gap-0.5 min-h-[52px]"
          >
            <span>Не знаю ✖</span>
            <span className="text-[9px] text-rose-400 font-normal">Показати ще раз</span>
          </button>

          {/* Know button */}
          <button
            onClick={() => handleAction('know')}
            className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/45 text-emerald-300 font-bold py-4 px-4 rounded-xl transition duration-150 flex flex-col items-center justify-center cursor-pointer shadow-md text-xs gap-0.5 min-h-[52px]"
          >
            <span>Знаю! ✔</span>
            <span className="text-[9px] text-emerald-400 font-extrabold flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> +5 XP
            </span>
          </button>
        </div>

        {/* Carousel buttons */}
        <div className="flex justify-between items-center border-t border-white/10 pt-3 px-1 text-slate-400">
          <button
            onClick={handlePrev}
            className="flex items-center gap-1 text-xs hover:text-white transition py-2 px-1 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            Попередня
          </button>
          <span className="text-[9px] uppercase font-bold text-slate-500">клавіші: ← (не знаю) | → (знаю)</span>
          <button
            onClick={handleNext}
            className="flex items-center gap-1 text-xs hover:text-white transition py-2 px-1 cursor-pointer"
          >
            Наступна
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
