// Copied verbatim from src/legacy/components/GameTab.tsx (guestScenarios) — seed source for public.guest_scenarios.
export interface SeedGuestScenario {
  id: string;
  avatar: string;
  role: string;
  quote: string;
  options: { text: string; isCorrect: boolean; feedback: string }[];
}

export const guestScenarios: SeedGuestScenario[] = [
  {
    id: 'g-1',
    avatar: '👩‍💼',
    role: 'Бізнес-леді',
    quote: 'У мене сильна алергія на лактозу, порадьте якесь гаряче з картоплі, але без молочних продуктів.',
    options: [
      {
        text: 'Картопляне пюре з сирною шапочкою та бринзою',
        isCorrect: false,
        feedback: 'Ні! Картопляне пюре з сирною шапочкою містить вершкове масло та сир (лактозу).',
      },
      {
        text: 'Картопля запечена з розмарином та часниковою саламахою',
        isCorrect: true,
        feedback: 'Правильно! Ця позиція веганська, запікається на олії з часником та травами.',
      },
      {
        text: 'Банош вершковий з бринзою',
        isCorrect: false,
        feedback: 'Ні! Банош вариться на вершках і посипається бринзою.',
      },
    ],
  },
  {
    id: 'g-2',
    avatar: '🧔',
    role: "Поціновувач м'яса",
    quote:
      'Я замовив ваші соковиті томлені свинячі реберця в соусі BBQ. Яке червоне вино найкраще підійде, щоб підкреслити їхній карамельний смак?',
    options: [
      {
        text: 'Chardonnay (CHARA & GARrA, Галичина) - біле сухе',
        isCorrect: false,
        feedback: 'Реберця BBQ мають насичений солодкуватий смак, біле легке вино загубиться.',
      },
      {
        text: 'Пізній збір / Late Harvest (Колоніст) - червоне напівсолодке',
        isCorrect: true,
        feedback:
          'Чудово! Соковиті свинячі реберця BBQ ідеально гармонують із насиченим червоним вином Пізній збір.',
      },
      {
        text: 'Prosecco DOC - ігристе',
        isCorrect: false,
        feedback: 'Ігристе Prosecco не підходить до важкого солодкуватого BBQ.',
      },
    ],
  },
  {
    id: 'g-3',
    avatar: '👴',
    role: 'Шановний гість',
    quote:
      "Хочу замовити ваші фірмові вареники з м'ясом зайця, але у мене непереносимість глютену. Чи безпечно це для мене?",
    options: [
      {
        text: "Так, звичайно, у нас все м'ясо чисте.",
        isCorrect: false,
        feedback: 'Небезпечно! Тісто вареників замішується на пшеничному борошні, що містить глютен.',
      },
      {
        text: 'Ні, краще замовте стейк Рібай, оскільки тісто вареників містить пшеничне борошно (глютен).',
        isCorrect: true,
        feedback:
          'Бездоганно! Ви попередили гостя про глютен у тісті та запропонували альтернативу без тіста.',
      },
    ],
  },
  {
    id: 'g-4',
    avatar: '👱‍♀️',
    role: 'Дівчина на дієті',
    quote: 'Я шукаю максимально солодке та свіже біле вино з приємною фруктовою кислотністю. Що порадити?',
    options: [
      {
        text: 'Odesa Black (Колоніст) - червоне сухе',
        isCorrect: false,
        feedback: 'Це сухе, терпке червоне вино.',
      },
      {
        text: 'Gewurztraminer (Колоніст) - біле напівсолодке',
        isCorrect: true,
        feedback: 'Абсолютно! Напівсолодкий Гевюрцтрамінер має чудовий свіжий тропічний смак.',
      },
      {
        text: 'Pinot Grigio - біле сухе',
        isCorrect: false,
        feedback: 'Піно Гріджо - сухе вино, в ньому немає напівсолодкої свіжості.',
      },
    ],
  },
  {
    id: 'g-5',
    avatar: '👨‍🦰',
    role: 'Водій за кермом',
    quote:
      'Я за кермом, але дуже хочу смачного пива. Що з безалкогольного у вас є цікавого і яка його фішка?',
    options: [
      { text: 'Rebrew Citadel IPA', isCorrect: false, feedback: 'Ні, це алкогольне міцне крафтове пиво!' },
      {
        text: 'Темне б/а пиво MOVA, яке отримало срібло на World Alcohol-Free Awards у Лондоні',
        isCorrect: true,
        feedback: 'Супер! Ви блискуче використали козирний факт про нагороду MOVA в Лондоні.',
      },
    ],
  },
];
