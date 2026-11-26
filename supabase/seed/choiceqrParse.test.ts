import { cleanTitle, isRenamed, parseDescription, pickIngredients, tidy } from './choiceqrParse';

describe('choiceqr parsing', () => {
  it('tidies doubled spaces and spaces before punctuation', () => {
    expect(tidy('Serena  Bianco , мята ,  лайм ')).toBe('Serena Bianco, мята, лайм');
    expect(tidy('вершковим кремом .Має')).toBe('вершковим кремом. Має');
    expect(cleanTitle('Салат з  буратою, томатами ')).toBe('Салат з буратою, томатами');
  });

  it('splits the 🍷 line of a dish into the pairing', () => {
    const parsed = parseDescription(
      'Ароматний салат з буратою.\n🍷Ярило\n Виноробня Янчинські пагорби \n',
      'other',
    );
    expect(parsed).toEqual({
      ingredients: 'Ароматний салат з буратою.',
      pairing: 'Ярило (Виноробня Янчинські пагорби)',
    });
  });

  it('reads sweetness and grapes from a wine and keeps the tasting notes', () => {
    const parsed = parseDescription(
      "Виноробня Янчинські пагорби  (Львівщина) \nСухе біле вино, сорт винограду - Мускат Голодриги. \nАромат:\nБілі квіти.\nСмак:\nМ'який.\n\n",
      'wine',
    );
    expect(parsed).toEqual({
      sweetness: 'сухе',
      grapeVarieties: 'Мускат Голодриги',
      ingredients: "Аромат: Білі квіти. Смак: М'який.",
    });
  });

  it('keeps a wine description without a grape line as text', () => {
    expect(
      parseDescription(
        'Рожеве ігристе вино, виготовлене за\nкласичним методом шампанізації\nВиноробня 46 Parallel Wine Group',
        'wine',
      ),
    ).toEqual({ ingredients: 'Рожеве ігристе вино, виготовлене за класичним методом шампанізації' });
  });

  it('returns nothing for an empty description', () => {
    expect(parseDescription('  \n', 'other')).toEqual({});
  });

  it('reads «Брют» and the grape list from separate lines', () => {
    expect(parseDescription('Біле ігристе вино.\nБрют\nСорти винограду - Піно Грі, Аліготе', 'wine')).toEqual(
      {
        ingredients: 'Біле ігристе вино.',
        sweetness: 'брют',
        grapeVarieties: 'Піно Грі, Аліготе',
      },
    );
  });

  it('keeps grape prose in the text and only the grape name in the field', () => {
    expect(
      parseDescription(
        'Сухе біле вино, сорт винограду - Леанка, один із традиційних сортів Закарпаття',
        'wine',
      ),
    ).toEqual({
      sweetness: 'сухе',
      grapeVarieties: 'Леанка',
      ingredients: 'Леанка, один із традиційних сортів Закарпаття',
    });
  });

  it('lets the site text win unless it is a short blurb for an unchanged dish', () => {
    const recipe = 'Натуральний сироп малини, свіжий лимонний фреш, содова, лід.';
    expect(pickIngredients(recipe, 'Освіжаючий лимонад', false)).toBe(recipe);
    expect(pickIngredients(recipe, 'Освіжаючий лимонад', true)).toBe('Освіжаючий лимонад');
    expect(pickIngredients(recipe, 'Сироп малини власного приготування, лимонний фреш, содова', false)).toBe(
      'Сироп малини власного приготування, лимонний фреш, содова',
    );
    expect(pickIngredients(recipe, undefined, true)).toBe(recipe);
    expect(pickIngredients('Еспресо, гаряча вода.', 'Зерно: Руанда Гітокі', false)).toBe(
      'Еспресо, гаряча вода. Зерно: Руанда Гітокі',
    );
  });

  it('tells a renamed dish from reworded or annotated titles', () => {
    expect(isRenamed('Малиновий лимонад', 'Лимонад Малина')).toBe(false);
    expect(isRenamed('Пепсі (скло)', 'Пепсі')).toBe(false);
    expect(isRenamed('Борщ з пампушкою та салом', 'Борщ з гречаним хлібом та салом')).toBe(true);
  });
});
