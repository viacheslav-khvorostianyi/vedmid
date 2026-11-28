import { expzTitle, htmlToText, parseExpzMenu, type ExpzMenu } from './expzParse';

const menu: ExpzMenu = {
  categories: [
    { id: 1, name: 'Цілі торти 🎂', menuId: 1 },
    { id: 2, name: 'Десерти', menuId: 1 },
    { id: 3, name: 'Наша крамничка', menuId: 2 },
    { id: 4, name: 'Червоне', menuId: 3 },
    { id: 5, name: 'Новинки', menuId: 1 },
  ],
  allergens: [{ id: 7, name: 'Глютен' }],
  dishes: [
    { id: 10, title: 'Наполеон', description: '<p>цілий</p>', categoryId: 1, imageUrl: 'https://x/10.jpg' },
    {
      id: 11,
      title: 'Наполеон 🍰',
      description: '<p>14 шарів&nbsp;тіста</p><p><br></p>',
      categoryId: 2,
      allergens: [7],
    },
    { id: 12, title: 'Свічка', description: '', categoryId: 3 },
    { id: 13, title: 'Каберне. Вудхевен, сухе', description: null, categoryId: 4 },
    { id: 14, title: 'Щось', categoryId: 5 },
    { id: 15, title: 'Старе', categoryId: 2, active: false },
    { id: 16, title: 'до чаю: мед', categoryId: 2 },
  ],
};

describe('expz menu parsing', () => {
  it('strips HTML, entities and emoji into lines', () => {
    expect(htmlToText('<p>Бітер&nbsp;Aperol ,лайм 🍋</p><p><br></p><p>білок &amp; сироп</p>')).toBe(
      'Бітер Aperol, лайм\nбілок & сироп',
    );
  });

  it('cleans titles and moves a wine’s sweetness out', () => {
    expect(expzTitle('🥐 масляний  круасан ✨')).toEqual({ title: 'Масляний круасан' });
    expect(expzTitle('Розе д’Анжу, напівсухе')).toEqual({ title: 'Розе д’Анжу', sweetness: 'напівсухе' });
  });

  it('places dishes by the table order, keeps one listing per dish and skips the shop', () => {
    const { items, unplaced } = parseExpzMenu(
      menu,
      {
        Десерти: ['Їжа', 'Десерти'],
        'Цілі торти': ['Їжа', 'Цілі торти'],
        'Наша крамничка': null,
        Червоне: ['Вино', 'Червоне'],
      },
      'v',
      /^до чаю/i,
    );
    expect(unplaced).toEqual(['Новинки']);
    expect(items).toEqual([
      {
        id: 'v-11',
        category: 'Їжа',
        subcategory: 'Десерти',
        title: 'Наполеон',
        anchor: '',
        ingredients: '14 шарів тіста',
        sales: '',
        allergens: ['глютен'],
      },
      {
        id: 'v-13',
        category: 'Вино',
        subcategory: 'Червоне',
        title: 'Каберне. Вудхевен',
        anchor: '',
        ingredients: '',
        sales: '',
        allergens: [],
        sweetness: 'сухе',
      },
    ]);
  });
});
