import React, { useState, useEffect, useMemo } from 'react';
import { Award, Flame, Heart, RefreshCw, Timer, Sparkles, CheckCircle2, XCircle, HelpCircle, ArrowRight, UserCheck, Check, Info } from 'lucide-react';
import { MenuItem } from '../types';

interface GameTabProps {
  menuItems: MenuItem[];
  onAddXp: (amount: number) => void;
  onUpdateStreak: (correct: boolean) => void;
}

type GameMode = 'idle' | 'quiz' | 'match' | 'recipe' | 'guest';

// Guest simulator static scenarios
const guestScenarios = [
  {
    id: 'g-1',
    avatar: '👩‍💼',
    role: 'Бізнес-леді',
    quote: 'У мене сильна алергія на лактозу, порадьте якесь гаряче з картоплі, але без молочних продуктів.',
    options: [
      { text: 'Картопляне пюре з сирною шапочкою та бринзою', isCorrect: false, feedback: 'Ні! Картопляне пюре з сирною шапочкою містить вершкове масло та сир (лактозу).' },
      { text: 'Картопля запечена з розмарином та часниковою саламахою', isCorrect: true, feedback: 'Правильно! Ця позиція веганська, запікається на олії з часником та травами.' },
      { text: 'Банош вершковий з бринзою', isCorrect: false, feedback: 'Ні! Банош вариться на вершках і посипається бринзою.' }
    ],
  },
  {
    id: 'g-2',
    avatar: '🧔',
    role: 'Поціновувач м\'яса',
    quote: 'Я замовив ваші соковиті томлені свинячі реберця в соусі BBQ. Яке червоне вино найкраще підійде, щоб підкреслити їхній карамельний смак?',
    options: [
      { text: 'Chardonnay (CHARA & GARrA, Галичина) - біле сухе', isCorrect: false, feedback: 'Реберця BBQ мають насичений солодкуватий смак, біле легке вино загубиться.' },
      { text: 'Пізній збір / Late Harvest (Колоніст) - червоне напівсолодке', isCorrect: true, feedback: 'Чудово! Соковиті свинячі реберця BBQ ідеально гармонують із насиченим червоним вином Пізній збір.' },
      { text: 'Prosecco DOC - ігристе', isCorrect: false, feedback: 'Ігристе Prosecco не підходить до важкого солодкуватого BBQ.' }
    ],
  },
  {
    id: 'g-3',
    avatar: '👴',
    role: 'Шановний гість',
    quote: 'Хочу замовити ваші фірмові вареники з м\'ясом зайця, але у мене непереносимість глютену. Чи безпечно це для мене?',
    options: [
      { text: 'Так, звичайно, у нас все м\'ясо чисте.', isCorrect: false, feedback: 'Небезпечно! Тісто вареників замішується на пшеничному борошні, що містить глютен.' },
      { text: 'Ні, краще замовте стейк Рібай, оскільки тісто вареників містить пшеничне борошно (глютен).', isCorrect: true, feedback: 'Бездоганно! Ви попередили гостя про глютен у тісті та запропонували альтернативу без тіста.' }
    ],
  },
  {
    id: 'g-4',
    avatar: '👱‍♀️',
    role: 'Дівчина на дієті',
    quote: 'Я шукаю максимально солодке та свіже біле вино з приємною фруктовою кислотністю. Що порадити?',
    options: [
      { text: 'Odesa Black (Колоніст) - червоне сухе', isCorrect: false, feedback: 'Це сухе, терпке червоне вино.' },
      { text: 'Gewurztraminer (Колоніст) - біле напівсолодке', isCorrect: true, feedback: 'Абсолютно! Напівсолодкий Гевюрцтрамінер має чудовий свіжий тропічний смак.' },
      { text: 'Pinot Grigio - біле сухе', isCorrect: false, feedback: 'Піно Гріджо - сухе вино, в ньому немає напівсолодкої свіжості.' }
    ],
  },
  {
    id: 'g-5',
    avatar: '👨‍🦰',
    role: 'Водій за кермом',
    quote: 'Я за кермом, але дуже хочу смачного пива. Що з безалкогольного у вас є цікавого і яка його фішка?',
    options: [
      { text: 'Rebrew Citadel IPA', isCorrect: false, feedback: 'Ні, це алкогольне міцне крафтове пиво!' },
      { text: 'Темне б/а пиво MOVA, яке отримало срібло на World Alcohol-Free Awards у Лондоні', isCorrect: true, feedback: 'Супер! Ви блискуче використали козирний факт про нагороду MOVA в Лондоні.' }
    ]
  }
];

export default function GameTab({ menuItems, onAddXp, onUpdateStreak }: GameTabProps) {
  const [activeMode, setActiveMode] = useState<GameMode>('idle');

  // QUIZ STATE
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizLives, setQuizLives] = useState(3);
  const [quizTimer, setQuizTimer] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizStatus, setQuizStatus] = useState<'playing' | 'ended'>('playing');

  // MATCH STATE
  const [matchItems, setMatchItems] = useState<{ id: string; text: string; type: 'item' | 'anchor' }[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<{ id: string; type: 'item' | 'anchor' } | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [matchPairsCount, setMatchPairsCount] = useState(0);
  const [matchTimer, setMatchTimer] = useState(0);
  const [isMatchFinished, setIsMatchFinished] = useState(false);

  // RECIPE BUILDER STATE
  const [recipeDish, setRecipeDish] = useState<MenuItem | null>(null);
  const [recipeOptions, setRecipeOptions] = useState<{ text: string; isCorrect: boolean; selected: boolean }[]>([]);
  const [recipeSubmitted, setRecipeSubmitted] = useState(false);
  const [recipeSuccess, setRecipeSuccess] = useState(false);

  // GUEST SIMULATOR STATE
  const [currentScenarioIdx, setCurrentScenarioIdx] = useState(0);
  const [guestChoiceIdx, setGuestChoiceIdx] = useState<number | null>(null);
  const [guestSubmitted, setGuestSubmitted] = useState(false);
  const [guestIsCorrect, setGuestIsCorrect] = useState(false);

  // Multi-mode global timers
  useEffect(() => {
    let interval: any;
    if (activeMode === 'quiz' && quizStatus === 'playing' && !isAnswered) {
      interval = setInterval(() => {
        setQuizTimer((prev) => {
          if (prev <= 1) {
            // Time out acts as a wrong answer
            handleQuizAnswer(-1);
            return 15;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeMode, quizStatus, isAnswered, currentQIndex]);

  useEffect(() => {
    let interval: any;
    if (activeMode === 'match' && !isMatchFinished) {
      interval = setInterval(() => {
        setMatchTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeMode, isMatchFinished]);

  // PROCEDURAL QUIZ QUESTION GENERATOR
  const startQuiz = () => {
    const questionsList: any[] = [];
    const pool = [...menuItems].sort(() => Math.random() - 0.5);

    // Generate 10 distinct questions
    for (let i = 0; i < Math.min(10, pool.length); i++) {
      const item = pool[i];
      const qType = Math.random() > 0.5 ? 'anchor' : 'ingredients';
      let questionText = '';
      let correctAnswer = '';
      let distractors: string[] = [];

      if (qType === 'anchor') {
        questionText = `Яка позиція меню ЛІС має унікальний "якір": «${item.anchor}»?`;
        correctAnswer = item.title;
        distractors = pool
          .filter((x) => x.id !== item.id && x.category === item.category)
          .slice(0, 3)
          .map((x) => x.title);
      } else {
        questionText = `Що входить до складу страви чи напою «${item.title}»?`;
        correctAnswer = item.ingredients;
        distractors = pool
          .filter((x) => x.id !== item.id && x.category === item.category)
          .slice(0, 3)
          .map((x) => x.ingredients);
      }

      // Add default distractors if not enough
      while (distractors.length < 3) {
        distractors.push('Спеціальний секретний інгредієнт шефа');
      }

      // Mix answers
      const allAnswers = [correctAnswer, ...distractors].sort(() => Math.random() - 0.5);
      const correctIdx = allAnswers.indexOf(correctAnswer);

      questionsList.push({
        item,
        questionText,
        answers: allAnswers,
        correctIdx,
        type: qType
      });
    }

    setQuizQuestions(questionsList);
    setCurrentQIndex(0);
    setQuizScore(0);
    setQuizLives(3);
    setQuizTimer(15);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setQuizStatus('playing');
    setActiveMode('quiz');
  };

  const handleQuizAnswer = (index: number) => {
    if (isAnswered) return;
    setSelectedAnswer(index);
    setIsAnswered(true);

    const isCorrect = index === quizQuestions[currentQIndex].correctIdx;

    if (isCorrect) {
      setQuizScore((prev) => prev + 10);
      onAddXp(10);
      onUpdateStreak(true);
    } else {
      setQuizLives((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          setQuizStatus('ended');
        }
        return next;
      });
      onUpdateStreak(false);
    }
  };

  const handleNextQuizQ = () => {
    setSelectedAnswer(null);
    setIsAnswered(false);
    setQuizTimer(15);
    if (currentQIndex + 1 < quizQuestions.length) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      setQuizStatus('ended');
      // Bonus XP for finishing
      onAddXp(25);
    }
  };

  // MATCH CARDS GENERATOR
  const startMatchGame = () => {
    // Pick 4 random items
    const selected = [...menuItems].sort(() => Math.random() - 0.5).slice(0, 4);
    const items = selected.map((x) => ({ id: x.id, text: x.title, type: 'item' as const }));
    const anchors = selected.map((x) => ({ id: x.id, text: `⚓ ${x.anchor}`, type: 'anchor' as const }));

    setMatchItems([...items, ...anchors].sort(() => Math.random() - 0.5));
    setSelectedMatch(null);
    setMatchedIds([]);
    setMatchPairsCount(0);
    setMatchTimer(0);
    setIsMatchFinished(false);
    setActiveMode('match');
  };

  const handleMatchTap = (clicked: { id: string; text: string; type: 'item' | 'anchor' }) => {
    if (matchedIds.includes(clicked.id)) return;

    if (!selectedMatch) {
      setSelectedMatch(clicked);
    } else {
      // If tapped same item, deselect
      if (selectedMatch.id === clicked.id && selectedMatch.type === clicked.type) {
        setSelectedMatch(null);
        return;
      }

      // Check if pair matches
      if (selectedMatch.id === clicked.id && selectedMatch.type !== clicked.type) {
        // Correct pair!
        setMatchedIds((prev) => [...prev, clicked.id]);
        setMatchPairsCount((prev) => {
          const next = prev + 1;
          if (next === 4) {
            setIsMatchFinished(true);
            onAddXp(30);
          }
          return next;
        });
        onAddXp(5);
        setSelectedMatch(null);
      } else {
        // Incorrect pair - flash red
        setSelectedMatch(clicked); // select new one
      }
    }
  };

  // RECIPE BUILDER GENERATOR
  const startRecipeBuilder = () => {
    // Pick a random dish that has multiple clear ingredients
    const dishes = menuItems.filter((x) => x.category === 'Їжа' && x.ingredients.includes(','));
    const dish = dishes[Math.floor(Math.random() * dishes.length)];
    
    // Parse correct ingredients from text
    const correctList = dish.ingredients.split(',').map((x) => x.trim().toLowerCase());

    // Get distractor pool
    const allIngredients = menuItems
      .filter((x) => x.category === 'Їжа')
      .flatMap((x) => x.ingredients.split(','))
      .map((x) => x.trim().toLowerCase())
      .filter((x) => !correctList.includes(x) && x.length > 2);

    const distractors = Array.from(new Set(allIngredients))
      .sort(() => Math.random() - 0.5)
      .slice(0, 4);

    // Prepare 8 choices
    const choices = [
      ...correctList.slice(0, 4).map((x) => ({ text: x, isCorrect: true, selected: false })),
      ...distractors.map((x) => ({ text: x, isCorrect: false, selected: false }))
    ].sort(() => Math.random() - 0.5);

    setRecipeDish(dish);
    setRecipeOptions(choices);
    setRecipeSubmitted(false);
    setRecipeSuccess(false);
    setActiveMode('recipe');
  };

  const toggleRecipeOption = (index: number) => {
    if (recipeSubmitted) return;
    setRecipeOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, selected: !opt.selected } : opt))
    );
  };

  const submitRecipe = () => {
    setRecipeSubmitted(true);
    
    // Check if user selected all correct ones and NO incorrect ones
    const correctSelected = recipeOptions.filter((x) => x.isCorrect && x.selected).length;
    const incorrectSelected = recipeOptions.filter((x) => !x.isCorrect && x.selected).length;
    const totalCorrectExpected = recipeOptions.filter((x) => x.isCorrect).length;

    const isPerfect = correctSelected === totalCorrectExpected && incorrectSelected === 0;

    setRecipeSuccess(isPerfect);
    if (isPerfect) {
      onAddXp(20);
    }
  };

  // GUEST SIMULATOR GENERATOR
  const startGuestSimulator = () => {
    setCurrentScenarioIdx(0);
    setGuestChoiceIdx(null);
    setGuestSubmitted(false);
    setGuestIsCorrect(false);
    setActiveMode('guest');
  };

  const handleGuestChoice = (idx: number) => {
    if (guestSubmitted) return;
    setGuestChoiceIdx(idx);
  };

  const submitGuestAnswer = () => {
    if (guestChoiceIdx === null) return;
    setGuestSubmitted(true);
    const correct = guestScenarios[currentScenarioIdx].options[guestChoiceIdx].isCorrect;
    setGuestIsCorrect(correct);

    if (correct) {
      onAddXp(15);
    }
  };

  const nextGuestScenario = () => {
    setGuestChoiceIdx(null);
    setGuestSubmitted(false);
    if (currentScenarioIdx + 1 < guestScenarios.length) {
      setCurrentScenarioIdx((prev) => prev + 1);
    } else {
      // Completed guest quest
      onAddXp(30);
      setActiveMode('idle');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4" id="game-tab-container">
      {/* 1. IDLE MODE: MAIN MENU OF GAMES */}
      {activeMode === 'idle' && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-extrabold text-white">🧠 Навчальний Симулятор Офіціанта</h2>
            <p className="text-xs text-slate-400">Оберіть режим для ігрової перевірки та швидкого вивчення меню ресторану ЛІС.</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Mode A: Quiz */}
            <button
              onClick={startQuiz}
              className="bg-emerald-950/15 hover:bg-emerald-950/30 border border-emerald-900/30 hover:border-emerald-500/50 rounded-2xl p-4.5 text-left transition duration-200 cursor-pointer shadow group min-h-[84px]"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg shrink-0">
                    🎯
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition">Розумна Вікторина (Smart Quiz)</h3>
                    <p className="text-xs text-slate-400">10 запитань про склад, алергени та "козирі" продажу з таймером.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 shrink-0">+100 XP max</span>
              </div>
            </button>

            {/* Mode B: Match Game */}
            <button
              onClick={startMatchGame}
              className="bg-emerald-950/15 hover:bg-emerald-950/30 border border-emerald-900/30 hover:border-amber-500/50 rounded-2xl p-4.5 text-left transition duration-200 cursor-pointer shadow group min-h-[84px]"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg shrink-0">
                    🔗
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-amber-300 transition">Знайди Пару (Match Slogans)</h3>
                    <p className="text-xs text-slate-400">Швидкісний підбір фірмових "якорів" до позицій menu.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 shrink-0">+50 XP max</span>
              </div>
            </button>

            {/* Mode C: Recipe Builder */}
            <button
              onClick={startRecipeBuilder}
              className="bg-emerald-950/15 hover:bg-emerald-950/30 border border-emerald-900/30 hover:border-emerald-500/50 rounded-2xl p-4.5 text-left transition duration-200 cursor-pointer shadow group min-h-[84px]"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-lg shrink-0">
                    👨‍🍳
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-emerald-400 transition">Кухар-Конструктор (Recipe Builder)</h3>
                    <p className="text-xs text-slate-400">Складіть страву з правильних інгредієнтів без жодної помилки.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 shrink-0">+20 XP max</span>
              </div>
            </button>

            {/* Mode D: Guest Simulator */}
            <button
              onClick={startGuestSimulator}
              className="bg-emerald-950/15 hover:bg-emerald-950/30 border border-emerald-900/30 hover:border-amber-500/50 rounded-2xl p-4.5 text-left transition duration-200 cursor-pointer shadow group min-h-[84px]"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-lg shrink-0">
                    💬
                  </div>
                  <div>
                    <h3 className="font-bold text-white group-hover:text-amber-300 transition">Симулятор Гостя (Guest Quests)</h3>
                    <p className="text-xs text-slate-400">Розв'яжіть складні та живі замовлення гостей за столом.</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 shrink-0">+100 XP max</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 2. MODE: SMART QUIZ */}
      {activeMode === 'quiz' && (
        <div className="space-y-5">
          {/* Quiz playing block */}
          {quizStatus === 'playing' && (
            <>
              {/* Header metrics */}
              <div className="flex justify-between items-center bg-[#132517] border border-[#23442a] p-3 rounded-xl text-xs font-semibold">
                <div className="flex items-center gap-1">
                  <span className="text-gray-400">Питання:</span>
                  <span className="font-mono text-white font-extrabold">{currentQIndex + 1}/10</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Timer className={`w-4 h-4 ${quizTimer < 5 ? 'text-red-500 animate-pulse' : 'text-emerald-400'}`} />
                  <span className="font-mono font-bold text-white">{quizTimer}с</span>
                </div>
                <div className="flex gap-0.5">
                  {[1, 2, 3].map((h) => (
                    <Heart
                      key={h}
                      className={`w-4 h-4 ${h <= quizLives ? 'fill-red-500 text-red-500' : 'text-gray-600'}`}
                    />
                  ))}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#0d1610] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${((currentQIndex + 1) / 10) * 100}%` }}
                />
              </div>

              {/* Question Text */}
              <div className="bg-[#142819] border border-[#22442b] p-5 rounded-2xl">
                <p className="text-[10px] uppercase font-bold text-[#d4af37] tracking-wider mb-1">
                  Питання про {quizQuestions[currentQIndex]?.type === 'anchor' ? 'фірмовий якір' : 'інгредієнти / склад'}
                </p>
                <h3 className="text-base font-extrabold text-white leading-relaxed">
                  {quizQuestions[currentQIndex]?.questionText}
                </h3>
              </div>

              {/* Answers choices */}
              <div className="space-y-2.5">
                {quizQuestions[currentQIndex]?.answers.map((ans: string, idx: number) => {
                  const isThisSelected = selectedAnswer === idx;
                  const isThisCorrect = quizQuestions[currentQIndex].correctIdx === idx;
                  let btnStyle = 'bg-[#101e14] hover:bg-[#15271a] border-[#1e3b25] text-gray-200';

                  if (isAnswered) {
                    if (isThisCorrect) {
                      btnStyle = 'bg-emerald-950/80 border-emerald-500 text-emerald-300';
                    } else if (isThisSelected) {
                      btnStyle = 'bg-red-950/80 border-red-500 text-red-300';
                    } else {
                      btnStyle = 'bg-[#0f1d13]/40 border-gray-900 text-gray-500';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isAnswered}
                      onClick={() => handleQuizAnswer(idx)}
                      className={`w-full p-3.5 rounded-xl border text-left text-xs font-semibold leading-relaxed transition flex justify-between items-center ${btnStyle} ${
                        !isAnswered ? 'cursor-pointer' : 'cursor-default'
                      }`}
                    >
                      <span>{ans}</span>
                      {isAnswered && isThisCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
                      {isAnswered && isThisSelected && !isThisCorrect && <XCircle className="w-4 h-4 text-red-400 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanatory Explanation drawer after answering */}
              {isAnswered && (
                <div className="bg-[#0b170f] border border-[#1b3422] p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-[#d4af37]" />
                    <span className="text-xs font-bold text-gray-300">Інфошпаргалка від шефа:</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-400">
                    <p>
                      <strong className="text-white">Позиція:</strong> {quizQuestions[currentQIndex].item.title}
                    </p>
                    <p>
                      <strong className="text-white">Склад:</strong> {quizQuestions[currentQIndex].item.ingredients}
                    </p>
                    <p>
                      <strong className="text-white">Козир продажу:</strong> «{quizQuestions[currentQIndex].item.sales}»
                    </p>
                  </div>
                  <button
                    onClick={handleNextQuizQ}
                    className="w-full bg-[#d4af37] hover:bg-[#bfa032] text-[#112417] font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer text-xs"
                  >
                    <span>Продовжити</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}

          {/* Quiz results block */}
          {quizStatus === 'ended' && (
            <div className="bg-[#122216] border-2 border-[#d4af37]/40 p-6 rounded-2xl text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/40 flex items-center justify-center text-3xl mx-auto">
                {quizLives > 0 ? '🏆' : '💀'}
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Вікторину Завершено!</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Ваш результат: <span className="font-mono text-[#d4af37] font-extrabold">{quizScore} балів</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {quizLives > 0 ? 'Гарний виступ! Ви заробили додатково +25 XP.' : 'Упс! Спробуйте ще раз, щоб закріпити знання.'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveMode('idle')}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-xl transition text-xs cursor-pointer"
                >
                  В меню ігор
                </button>
                <button
                  onClick={startQuiz}
                  className="flex-1 bg-[#d4af37] hover:bg-[#bfa032] text-[#112417] font-bold py-2.5 rounded-xl transition text-xs cursor-pointer"
                >
                  Грати знову 🔁
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. MODE: MATCH GAME */}
      {activeMode === 'match' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center bg-[#132517] border border-[#23442a] p-3 rounded-xl text-xs font-semibold">
            <span className="text-gray-300">Режим: <strong className="text-[#d4af37]">Знайди Пару</strong></span>
            <span className="font-mono text-gray-400">Час: <strong className="text-white">{matchTimer}с</strong></span>
          </div>

          {!isMatchFinished ? (
            <>
              <p className="text-xs text-gray-400 text-center">
                Знайдіть пари: натисніть спочатку на картку назви позиції, а потім на картку відповідного їй "козиря/якоря".
              </p>

              <div className="grid grid-cols-2 gap-2.5">
                {matchItems.map((item, idx) => {
                  const isMatched = matchedIds.includes(item.id);
                  const isSelected = selectedMatch?.id === item.id && selectedMatch?.type === item.type;

                  let borderStyle = 'border-[#1b3422] bg-[#101e14]';
                  if (isMatched) {
                    borderStyle = 'border-emerald-500 bg-emerald-950/40 opacity-40';
                  } else if (isSelected) {
                    borderStyle = 'border-[#d4af37] bg-gradient-to-tr from-amber-950/30 to-yellow-950/10 ring-1 ring-[#d4af37]';
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isMatched}
                      onClick={() => handleMatchTap(item)}
                      className={`min-h-[90px] p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${borderStyle}`}
                    >
                      {isMatched && <Check className="w-4 h-4 text-emerald-400 mb-1" />}
                      <span className="text-xs font-bold text-gray-100 leading-snug">{item.text}</span>
                      <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">
                        {item.type === 'item' ? 'Позиція' : 'Якір'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-[#122216] border-2 border-emerald-500/40 p-6 rounded-2xl text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-3xl mx-auto">
                🌟
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Всі пари знайдено!</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Ваш час: <span className="font-mono text-emerald-400 font-extrabold">{matchTimer} секунд</span>
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Неймовірно! Ви отримали <span className="text-[#d4af37] font-bold">+30 XP</span> за швидкісну пам'ять.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setActiveMode('idle')}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-xl transition text-xs cursor-pointer"
                >
                  В меню ігор
                </button>
                <button
                  onClick={startMatchGame}
                  className="flex-1 bg-[#d4af37] hover:bg-[#bfa032] text-[#112417] font-bold py-2.5 rounded-xl transition text-xs cursor-pointer"
                >
                  Грати знову 🔁
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. MODE: RECIPE BUILDER */}
      {activeMode === 'recipe' && (
        <div className="space-y-5">
          <div className="bg-[#142819] border border-[#22442b] p-5 rounded-2xl text-center space-y-1">
            <span className="text-[9px] uppercase font-bold text-[#d4af37] tracking-wider block">Зберіть рецепт страви</span>
            <h3 className="text-lg font-extrabold text-white leading-relaxed">
              «{recipeDish?.title}»
            </h3>
            <p className="text-[11px] text-gray-400">
              Позначте рівно ті інгредієнти, які входять до фірмового складу нашого кухаря.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {recipeOptions.map((opt, idx) => {
              let btnStyle = 'border-[#1b3422] bg-[#101e14] text-gray-300';
              if (opt.selected) {
                btnStyle = 'border-[#d4af37] bg-amber-950/30 text-amber-300 ring-1 ring-[#d4af37]/50';
              }

              if (recipeSubmitted) {
                if (opt.isCorrect) {
                  btnStyle = 'border-emerald-500 bg-emerald-950/60 text-emerald-400 font-bold';
                } else if (opt.selected && !opt.isCorrect) {
                  btnStyle = 'border-red-500 bg-red-950/60 text-red-400 line-through';
                } else {
                  btnStyle = 'border-gray-900 bg-gray-900/20 text-gray-600 opacity-40';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={recipeSubmitted}
                  onClick={() => toggleRecipeOption(idx)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold leading-relaxed transition flex justify-between items-center ${btnStyle} ${
                    !recipeSubmitted ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <span>{opt.text}</span>
                  {opt.selected && !recipeSubmitted && <Check className="w-3.5 h-3.5 text-[#d4af37]" />}
                  {recipeSubmitted && opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>

          {!recipeSubmitted ? (
            <button
              onClick={submitRecipe}
              className="w-full bg-[#d4af37] hover:bg-[#bfa032] text-[#112417] font-extrabold py-3 rounded-xl transition text-xs cursor-pointer shadow-md"
            >
              Приготувати страву 🍳
            </button>
          ) : (
            <div className="bg-[#0b170f] border border-[#1b3422] p-4 rounded-xl space-y-4">
              <div className="flex items-center gap-2.5">
                {recipeSuccess ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <span className="text-xs font-extrabold text-white">
                  {recipeSuccess ? 'Страва приготована ідеально! +20 XP' : 'Упс! Помилка у рецептурі.'}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                <strong className="text-white">Повний рецепт від Шефа:</strong> {recipeDish?.ingredients}
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveMode('idle')}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-2.5 rounded-xl transition text-xs cursor-pointer"
                >
                  В меню ігор
                </button>
                <button
                  onClick={startRecipeBuilder}
                  className="flex-1 bg-[#d4af37] hover:bg-[#bfa032] text-[#112417] font-bold py-2.5 rounded-xl transition text-xs cursor-pointer"
                >
                  Наступна страва 🔁
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MODE: GUEST SIMULATOR */}
      {activeMode === 'guest' && (
        <div className="space-y-5">
          {/* Progress bar */}
          <div className="flex justify-between items-center text-xs font-semibold text-gray-400">
            <span>Замовлення гостя: <strong className="text-white font-mono">{currentScenarioIdx + 1}/{guestScenarios.length}</strong></span>
          </div>

          <div className="w-full bg-[#0d1610] h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-lime-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${((currentScenarioIdx + 1) / guestScenarios.length) * 100}%` }}
            />
          </div>

          {/* Guest Character bubble card */}
          <div className="bg-gradient-to-br from-[#1b3020] to-[#0f1d13] border border-[#2c5336] p-5 rounded-2xl relative shadow-md">
            <div className="flex items-center gap-3 border-b border-[#2c5336]/60 pb-3 mb-3">
              <span className="text-3xl">{guestScenarios[currentScenarioIdx].avatar}</span>
              <div>
                <h4 className="text-xs font-extrabold text-emerald-400 tracking-wider uppercase">
                  {guestScenarios[currentScenarioIdx].role}
                </h4>
                <p className="text-[10px] text-gray-400 font-semibold">Робить запит за столом...</p>
              </div>
            </div>

            <p className="text-xs italic text-gray-100 font-semibold leading-relaxed bg-[#0c160e] p-3 rounded-xl border border-[#1d3522]">
              💬 «{guestScenarios[currentScenarioIdx].quote}»
            </p>
          </div>

          {/* Dialog options choices */}
          <div className="space-y-2">
            <p className="text-[10px] font-extrabold uppercase text-gray-400 tracking-wider px-1">Ваша рекомендація:</p>
            {guestScenarios[currentScenarioIdx].options.map((opt, idx) => {
              const isSelected = guestChoiceIdx === idx;
              let optionStyle = 'border-[#1b3422] bg-[#101e14] text-gray-300';

              if (isSelected) {
                optionStyle = 'border-lime-500 bg-lime-950/20 text-lime-300 ring-1 ring-lime-500/50';
              }

              if (guestSubmitted) {
                if (opt.isCorrect) {
                  optionStyle = 'border-emerald-500 bg-emerald-950/60 text-emerald-400 font-bold';
                } else if (isSelected && !opt.isCorrect) {
                  optionStyle = 'border-red-500 bg-red-950/60 text-red-400 line-through';
                } else {
                  optionStyle = 'border-gray-900 bg-gray-900/20 text-gray-600 opacity-40';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={guestSubmitted}
                  onClick={() => handleGuestChoice(idx)}
                  className={`w-full p-3.5 rounded-xl border text-left text-xs font-semibold leading-relaxed transition flex justify-between items-start gap-2.5 ${optionStyle} ${
                    !guestSubmitted ? 'cursor-pointer' : 'cursor-default'
                  }`}
                >
                  <span className="mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-gray-800 text-[10px] font-mono text-gray-400">
                    {idx + 1}
                  </span>
                  <span className="flex-1">{opt.text}</span>
                  {isSelected && !guestSubmitted && <Check className="w-4 h-4 text-lime-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {!guestSubmitted ? (
            <button
              onClick={submitGuestAnswer}
              disabled={guestChoiceIdx === null}
              className={`w-full font-extrabold py-3 rounded-xl transition text-xs shadow-md ${
                guestChoiceIdx !== null
                  ? 'bg-lime-500 hover:bg-lime-400 text-[#0d1c11] cursor-pointer'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              Порекомендувати гостю 💁‍♂️
            </button>
          ) : (
            <div className="bg-[#0b170f] border border-[#1b3422] p-4 rounded-xl space-y-4">
              <div className="flex items-start gap-2.5">
                {guestIsCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="text-xs font-extrabold text-white block">
                    {guestIsCorrect ? 'Гість задоволений вашою відповіддю! +15 XP' : 'Гість розчарований або у небезпеці!'}
                  </span>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    {guestScenarios[currentScenarioIdx].options[guestChoiceIdx!].feedback}
                  </p>
                </div>
              </div>

              <button
                onClick={nextGuestScenario}
                className="w-full bg-[#d4af37] hover:bg-[#bfa032] text-[#112417] font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-1 cursor-pointer text-xs"
              >
                <span>Наступне замовлення</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
