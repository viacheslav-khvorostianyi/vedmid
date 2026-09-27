import React, { useState, useMemo } from 'react';
import { 
  Search, Flame, Award, HelpCircle, Utensils, AlertTriangle, Lightbulb, 
  GlassWater, Sparkles, SlidersHorizontal, Table, Info, FileText, 
  Upload, RefreshCw, Check, Edit, Trash2, ChevronDown, ChevronUp, 
  CheckCircle, FilePlus, Settings, BookOpen, Trophy
} from 'lucide-react';
import { MenuItem, PlayerStats } from '../types';
import { steakDonenessGuide } from '../legacyData';
import { menuData as defaultMenuData } from '../../data/menuData';
import { parseMenuTxt } from '../menuParser';

function getWineTags(item: MenuItem): { label: string; colorClass: string }[] {
  if (item.category !== 'Вино') return [];
  const tags: { label: string; colorClass: string }[] = [];

  // 1. Sweetness
  if (item.sweetness) {
    const sw = item.sweetness.toLowerCase().trim();
    if (sw === 'сухе' || sw === 'dry') {
      tags.push({ label: '🍷 Сухе', colorClass: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' });
    } else if (sw === 'напівсухе' || sw === 'semi-dry' || sw === 'напів сухе') {
      tags.push({ label: '🥂 Напівсухе', colorClass: 'bg-teal-500/10 border-teal-500/30 text-teal-300' });
    } else if (sw === 'напівсолодке' || sw === 'semi-sweet' || sw === 'напів солодке') {
      tags.push({ label: '🍹 Напівсолодке', colorClass: 'bg-amber-500/10 border-amber-500/30 text-amber-300' });
    } else if (sw === 'солодке' || sw === 'sweet') {
      tags.push({ label: '🍯 Солодке', colorClass: 'bg-amber-600/10 border-amber-600/30 text-amber-400' });
    } else {
      tags.push({ label: `🍷 ${item.sweetness}`, colorClass: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' });
    }
  }

  // 2. Flavor profile (fruits, flowers, etc.)
  const searchText = `${item.anchor} ${item.ingredients} ${item.sales}`.toLowerCase();
  
  // Define profile categories
  const profiles = [
    { keys: ['квіт', 'пелюст', 'рож', 'троянд', 'бузин'], label: '🌸 Квіти' },
    { keys: ['яблук'], label: '🍏 Яблуко' },
    { keys: ['груш'], label: '🍐 Груша' },
    { keys: ['персик', 'абрикос'], label: '🍑 Персик' },
    { keys: ['полуниц', 'малин', 'ягід', 'ожин', 'порічк', 'гранат', 'вишн', 'слив', 'чорнослив'], label: '🍇 Фрукти/Ягоди' },
    { keys: ['цитрус', 'лимон', 'лайм', 'грейп', 'грейпфрут'], label: '🍋 Цитрус' },
    { keys: ['екзотик', 'маракуй', 'лічі', 'тропік', 'манго'], label: '🍍 Тропіки' },
    { keys: ['мед'], label: '🍯 Мед' },
    { keys: ['мінерал', 'крем', 'вапня', 'бензол'], label: '🪨 Мінерали' },
    { keys: ['трави', 'лугов'], label: '🌿 Трави' },
    { keys: ['дуб', 'боч', 'ваніл'], label: '🪵 Дуб/Ваніль' },
    { keys: ['верш', 'оксамит'], label: '🥛 Оксамит' },
    { keys: ['прян', 'перець', 'спеці'], label: '🌶️ Прянощі' },
  ];

  let addedCount = 0;
  for (const prof of profiles) {
    if (prof.keys.some(k => searchText.includes(k))) {
      tags.push({ label: prof.label, colorClass: 'bg-purple-500/10 border-purple-500/25 text-purple-300' });
      addedCount++;
      if (addedCount >= 2) break; // limit to max 2 flavor profile tags to avoid cluttering
    }
  }

  return tags;
}

interface MenuTabProps {
  menuItems: MenuItem[];
  onSetMenuItems: (items: MenuItem[]) => void;
  onAddXp: (amount: number) => void;
  stats: PlayerStats;
  onOpenStats: () => void;
}

export default function MenuTab({ menuItems, onSetMenuItems, onAddXp, stats, onOpenStats }: MenuTabProps) {
  const [selectedCategory, setSelectedCategory] = useState<MenuItem['category']>('Їжа');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('Всі');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  
  // Modals & Mode States
  const [showSteakGuide, setShowSteakGuide] = useState(false);
  const [showSummaryTable, setShowSummaryTable] = useState(false);
  const [handbookMode, setHandbookMode] = useState(false);
  const [showManagerPanel, setShowManagerPanel] = useState(false);
  
  // Gastro-Constructor States
  const [showConstructorModal, setShowConstructorModal] = useState(false);
  const [selectedGastroDish, setSelectedGastroDish] = useState<MenuItem | null>(null);
  const [selectedGastroGarnish, setSelectedGastroGarnish] = useState<MenuItem | null>(null);
  const [selectedGastroDrinkCategory, setSelectedGastroDrinkCategory] = useState<'wine' | 'cocktail' | 'bar' | 'spirit'>('wine');
  const [selectedGastroDrink, setSelectedGastroDrink] = useState<MenuItem | null>(null);
  const [constructorDishQuery, setConstructorDishQuery] = useState('');
  const [constructorDrinkQuery, setConstructorDrinkQuery] = useState('');
  const [constructorGarnishQuery, setConstructorGarnishQuery] = useState('');
  const [gastroMatchMode, setGastroMatchMode] = useState<'dish-first' | 'drink-first'>('dish-first');

  // Cocktail & Beverage Advisor States
  const [advisorBase, setAdvisorBase] = useState<string | null>(null);
  const [advisorTaste, setAdvisorTaste] = useState<string | null>(null);

  // Wine Advisor & Sparring States
  const [showWineAdvisor, setShowWineAdvisor] = useState(false);
  const [wineAdvisorTab, setWineAdvisorTab] = useState<'picker' | 'sparring' | 'finalists'>('picker');
  const [wineAdvisorColor, setWineAdvisorColor] = useState<string | null>(null);
  const [wineAdvisorSweetness, setWineAdvisorSweetness] = useState<string | null>(null);
  const [wineAdvisorProfile, setWineAdvisorProfile] = useState<string | null>(null);
  const [sparringWineAId, setSparringWineAId] = useState<string>('');
  const [sparringWineBId, setSparringWineBId] = useState<string>('');
  const [advisorExpandedItem, setAdvisorExpandedItem] = useState<string | null>(null);
  
  // Selected Detail Item for Handbook Mode popup
  const [selectedDetailItem, setSelectedDetailItem] = useState<MenuItem | null>(null);
  
  // Manager Panel States
  const [rawText, setRawText] = useState('');
  const [parsedItems, setParsedItems] = useState<MenuItem[]>([]);
  const [selectedEditItem, setSelectedEditItem] = useState<MenuItem | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Dynamic Subcategories for selected main Category
  const subcategories = useMemo(() => {
    const list = menuItems
      .filter((item) => item.category === selectedCategory)
      .map((item) => item.subcategory);
    return ['Всі', ...Array.from(new Set(list))];
  }, [selectedCategory, menuItems]);

  // Reset subcategory and search on main category change
  const handleCategoryChange = (cat: MenuItem['category']) => {
    setSelectedCategory(cat);
    setSelectedSubcategory('Всі');
    setExpandedItem(null);
    setSearchQuery(''); // Clear search on category tab change
  };

  // Filtered menu items for the browser mode (smart & robust search)
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return menuItems.filter((item) => {
      // If there is no search query, filter strictly by selected category & subcategory
      if (!query) {
        const matchesCategory = item.category === selectedCategory;
        const matchesSubcategory = selectedSubcategory === 'Всі' || item.subcategory === selectedSubcategory;
        return matchesCategory && matchesSubcategory;
      }
      
      // If there is a search query, we search globally across the entire menu!
      // This ensures extremely stable and powerful searching for anything in the database.
      const matchesSearch = 
        item.title.toLowerCase().includes(query) ||
        item.anchor.toLowerCase().includes(query) ||
        item.ingredients.toLowerCase().includes(query) ||
        item.sales.toLowerCase().includes(query) ||
        (item.interestingFact && item.interestingFact.toLowerCase().includes(query)) ||
        (item.pairing && item.pairing.toLowerCase().includes(query)) ||
        item.category.toLowerCase().includes(query) ||
        item.subcategory.toLowerCase().includes(query);

      return matchesSearch;
    });
  }, [selectedCategory, selectedSubcategory, searchQuery, menuItems]);

  // Grouped menu items for Handbook mode
  const groupedHandbookItems = useMemo(() => {
    const categories: Record<string, Record<string, MenuItem[]>> = {};
    
    // Sort and group all menu items
    menuItems.forEach((item) => {
      if (!categories[item.category]) {
        categories[item.category] = {};
      }
      if (!categories[item.category][item.subcategory]) {
        categories[item.category][item.subcategory] = [];
      }
      categories[item.category][item.subcategory].push(item);
    });
    
    return categories;
  }, [menuItems]);

  // Dynamic Cocktail & Beverage Advisor recommendations calculation (excluding wines)
  const advisorRecommendations = useMemo(() => {
    if (!showSummaryTable) return [];

    // Filter out food and wine items, we only recommend cocktails, spirits, beers, soft drinks
    const drinkItems = menuItems.filter(item => item.category !== 'Їжа' && item.category !== 'Вино');

    return drinkItems.filter(item => {
      let matchBase = true;
      let matchTaste = true;

      const titleLower = item.title.toLowerCase();
      const ingredientsLower = item.ingredients.toLowerCase();
      const salesLower = item.sales.toLowerCase();
      const subLower = item.subcategory.toLowerCase();

      // Base Spirit filters
      if (advisorBase) {
        if (advisorBase === 'джин') {
          matchBase = titleLower.includes('джин') || titleLower.includes('gin') ||
                      ingredientsLower.includes('джин') || ingredientsLower.includes('gin');
        } else if (advisorBase === 'ром') {
          matchBase = titleLower.includes('ром') || titleLower.includes('rum') ||
                      ingredientsLower.includes('ром') || ingredientsLower.includes('rum');
        } else if (advisorBase === 'текіла') {
          matchBase = titleLower.includes('тек') || titleLower.includes('teq') || titleLower.includes('меск') || titleLower.includes('mezc') ||
                      ingredientsLower.includes('тек') || ingredientsLower.includes('teq') || ingredientsLower.includes('меск') || ingredientsLower.includes('mezc');
        } else if (advisorBase === 'горілка') {
          matchBase = titleLower.includes('водк') || titleLower.includes('vodk') || titleLower.includes('горілк') ||
                      ingredientsLower.includes('водк') || ingredientsLower.includes('vodk') || ingredientsLower.includes('горілк');
        } else if (advisorBase === 'віскі') {
          matchBase = titleLower.includes('віск') || titleLower.includes('whisk') || titleLower.includes('бурб') || titleLower.includes('bourb') ||
                      ingredientsLower.includes('віск') || ingredientsLower.includes('whisk') || ingredientsLower.includes('бурб') || ingredientsLower.includes('bourb') ||
                      subLower.includes('віскі') || subLower.includes('whisky');
        } else if (advisorBase === 'вино') {
          matchBase = item.category === 'Вино' || titleLower.includes('верм') || titleLower.includes('prosecco') || titleLower.includes('херес') ||
                      ingredientsLower.includes('вин') || ingredientsLower.includes('верм') || ingredientsLower.includes('prosecco');
        } else if (advisorBase === 'безалкогольний') {
          matchBase = item.category === 'Безалкогольні & Пиво' || titleLower.includes('б/а') || titleLower.includes('безалкогол') || titleLower.includes('virgin') ||
                      ingredientsLower.includes('б/а') || ingredientsLower.includes('безалкогол');
        }
      }

      // Taste filters
      if (advisorTaste) {
        const sweetnessIndex = item.profile?.labels.indexOf('Солодкість') ?? -1;
        const sweetnessVal = sweetnessIndex !== -1 ? item.profile?.values[sweetnessIndex] : null;

        const acidityIndex = item.profile?.labels.indexOf('Кислотність') ?? item.profile?.labels.indexOf('Кислотність') ?? -1;
        const acidityVal = acidityIndex !== -1 ? item.profile?.values[acidityIndex] : null;

        const strengthIndex = item.profile?.labels.indexOf('Міцність') ?? -1;
        const strengthVal = strengthIndex !== -1 ? item.profile?.values[strengthIndex] : null;

        if (advisorTaste === 'кислий') {
          const hasAcidity = (acidityVal && acidityVal >= 2) || 
                             ingredientsLower.includes('кисл') || salesLower.includes('кисл') || 
                             ingredientsLower.includes('лимон') || ingredientsLower.includes('лайм') ||
                             salesLower.includes('лимон') || salesLower.includes('лайм') ||
                             ingredientsLower.includes('sour');
          matchTaste = !!hasAcidity;
        } else if (advisorTaste === 'солодкий') {
          const hasSweetness = (sweetnessVal && sweetnessVal >= 2) || 
                               ingredientsLower.includes('солодк') || salesLower.includes('солодк') ||
                               ingredientsLower.includes('караме') || ingredientsLower.includes('сироп') ||
                               ingredientsLower.includes('sweet') || salesLower.includes('sweet') ||
                               salesLower.includes('мед') || ingredientsLower.includes('мед');
          matchTaste = !!hasSweetness;
        } else if (advisorTaste === 'гіркий') {
          const hasBitter = titleLower.includes('негрон') || titleLower.includes('negroni') ||
                             ingredientsLower.includes('гірк') || salesLower.includes('гірк') ||
                             ingredientsLower.includes('кампар') || ingredientsLower.includes('campari') ||
                             ingredientsLower.includes('амаро') || ingredientsLower.includes('amaro') ||
                             ingredientsLower.includes('трав') || salesLower.includes('трав') ||
                             ingredientsLower.includes('гіркот') || salesLower.includes('гіркот');
          matchTaste = hasBitter;
        } else if (advisorTaste === 'міцний') {
          const hasStrength = (strengthVal && strengthVal >= 2) || 
                              item.category === 'Міцні напої' ||
                              ingredientsLower.includes('міцн') || salesLower.includes('міцн') ||
                              ingredientsLower.includes('strong') || salesLower.includes('strong');
          matchTaste = !!hasStrength;
        } else if (advisorTaste === 'легкий') {
          const hasLight = (strengthVal && strengthVal <= 1) || 
                            ingredientsLower.includes('легк') || salesLower.includes('легк') ||
                            ingredientsLower.includes('освіж') || salesLower.includes('освіж') ||
                            ingredientsLower.includes('свіж') || salesLower.includes('свіж') ||
                            ingredientsLower.includes('refresh') || salesLower.includes('refresh');
          matchTaste = !!hasLight;
        } else if (advisorTaste === 'фруктовий') {
          const hasFruity = ingredientsLower.includes('ягід') || ingredientsLower.includes('фрукт') ||
                             salesLower.includes('ягід') || salesLower.includes('фрукт') ||
                             ingredientsLower.includes('полун') || ingredientsLower.includes('вишн') ||
                             ingredientsLower.includes('малин') || ingredientsLower.includes('ананас') ||
                             ingredientsLower.includes('яблук') || ingredientsLower.includes('груш') ||
                             salesLower.includes('полун') || salesLower.includes('вишн') ||
                             salesLower.includes('малин') || salesLower.includes('ананас') ||
                             salesLower.includes('яблук') || salesLower.includes('груш');
          matchTaste = hasFruity;
        } else if (advisorTaste === 'несолодкий') {
          const isNotSweet = (sweetnessVal !== null && sweetnessVal <= 1) || 
                              (!ingredientsLower.includes('солодк') && !salesLower.includes('солодк') && !ingredientsLower.includes('сироп'));
          matchTaste = isNotSweet;
        }
      }

      return matchBase && matchTaste;
    });
  }, [showSummaryTable, menuItems, advisorBase, advisorTaste]);

  // Dynamic Wine Advisor recommendations calculation
  const wineAdvisorRecommendations = useMemo(() => {
    if (!showWineAdvisor) return [];

    const wines = menuItems.filter(item => item.category === 'Вино');

    return wines.filter(item => {
      let matchColor = true;
      let matchSweetness = true;
      let matchProfile = true;

      // 1. Color/Subcategory filter
      if (wineAdvisorColor) {
        const subLower = item.subcategory.toLowerCase();
        if (wineAdvisorColor === 'ігристе') {
          matchColor = subLower.includes('ігрист') || subLower.includes('pet-nat') || subLower.includes('пет-нат');
        } else if (wineAdvisorColor === 'біле') {
          matchColor = subLower.includes('біл') || subLower.includes('white');
        } else if (wineAdvisorColor === 'рожеве') {
          matchColor = subLower.includes('рожев') || subLower.includes('оранж') || subLower.includes('rose') || subLower.includes('orange');
        } else if (wineAdvisorColor === 'червоне') {
          matchColor = subLower.includes('червон') || subLower.includes('red');
        }
      }

      // 2. Sweetness filter
      if (wineAdvisorSweetness) {
        matchSweetness = item.sweetness?.toLowerCase().trim() === wineAdvisorSweetness.toLowerCase().trim();
      }

      // 3. Profile Characteristics filter
      if (wineAdvisorProfile) {
        const sweetnessIndex = item.profile?.labels.indexOf('Солодкість') ?? -1;
        const sweetnessVal = sweetnessIndex !== -1 ? item.profile?.values[sweetnessIndex] : null;

        const acidityIndex = item.profile?.labels.indexOf('Кислотність') ?? -1;
        const acidityVal = acidityIndex !== -1 ? item.profile?.values[acidityIndex] : null;

        const tanninIndex = item.profile?.labels.indexOf('Танінність') ?? -1;
        const tanninVal = tanninIndex !== -1 ? item.profile?.values[tanninIndex] : null;

        const bodyIndex = item.profile?.labels.indexOf('Важкість/Тіло') ?? -1;
        const bodyVal = bodyIndex !== -1 ? item.profile?.values[bodyIndex] : null;

        if (wineAdvisorProfile === 'кисле') {
          matchProfile = !!(acidityVal && acidityVal >= 2);
        } else if (wineAdvisorProfile === 'солодке') {
          matchProfile = !!(sweetnessVal && sweetnessVal >= 2);
        } else if (wineAdvisorProfile === 'танінне') {
          matchProfile = !!(tanninVal && tanninVal >= 2);
        } else if (wineAdvisorProfile === 'повнотіле') {
          matchProfile = !!(bodyVal && bodyVal >= 3);
        } else if (wineAdvisorProfile === 'легке') {
          matchProfile = !!(bodyVal && bodyVal <= 1);
        }
      }

      return matchColor && matchSweetness && matchProfile;
    });
  }, [showWineAdvisor, menuItems, wineAdvisorColor, wineAdvisorSweetness, wineAdvisorProfile]);

  // Gastro-Constructor Helper Calculations
  const getPairingScore = (dish: MenuItem | null, drink: MenuItem | null) => {
    if (!dish || !drink) {
      return { score: 0, title: 'Оберіть компоненти', reason: 'Оберіть і страву, і напій для повної аналітики.' };
    }

    const dishTitle = dish.title.toLowerCase();
    const dishIng = dish.ingredients.toLowerCase();
    const drinkTitle = drink.title.toLowerCase();
    const drinkCategory = drink.category;
    const drinkSales = drink.sales.toLowerCase();

    let score = 80; // default baseline
    let title = 'Гармонійний дует 🌟';
    let reason = 'Приємне смакове тло';

    if (drinkCategory === 'Вино') {
      const isRedWine = drinkTitle.includes('червон') || drinkTitle.includes('саперав') || drinkTitle.includes('мерло') || drinkTitle.includes('каберне') || drinkTitle.includes('піно нуар') || drinkTitle.includes('шираз') || drinkTitle.includes('одеськ');
      const isWhiteWine = drinkTitle.includes('біле') || drinkTitle.includes('совіньйон') || drinkTitle.includes('шардоне') || drinkTitle.includes('рислінг') || drinkTitle.includes('грюнер') || drinkTitle.includes('сухолиман');
      const isSparkling = drinkTitle.includes('ігрист') || drinkTitle.includes('просекко') || drinkTitle.includes('бісер') || drinkTitle.includes('брют') || drinkTitle.includes('розе');

      const hasRedMeat = dishIng.includes('яловичин') || dishIng.includes('свин') || dishTitle.includes('щічк') || dishTitle.includes('ребер') || dishTitle.includes('каре') || dishTitle.includes('телят') || dishTitle.includes('качк') || dishTitle.includes('стейк') || dishTitle.includes('люля') || dishTitle.includes('шашлик');
      const hasFish = dishIng.includes('сом') || dishIng.includes('форел') || dishIng.includes('риба') || dishTitle.includes('пструг') || dishTitle.includes('креветк') || dishTitle.includes('сом');
      const hasCheese = dishIng.includes('сир') || dishIng.includes('бринз') || dishIng.includes('камамбер') || dishIng.includes('бурат') || dishIng.includes('пармезан');

      if (hasRedMeat && isRedWine) {
        score = 98;
        title = 'Ідеальне поєднання (КЛАСИКА) 👑';
        reason = 'Насичені таніни червоного вина розчиняють м\'ясні волокна';
      } else if (hasFish && isWhiteWine) {
        score = 96;
        title = 'Прекрасний свіжий баланс 🐟';
        reason = 'Хрустка кислотність білого вина ідеально освіжає ніжну рибу';
      } else if (hasCheese && isSparkling) {
        score = 95;
        title = 'Шляхетна гармонія контрастів ✨';
        reason = 'Грайливий перляж ігристого очищує рецептори від насиченого сиру';
      } else if (hasFish && isRedWine) {
        score = 55;
        title = 'Конфлікт смаків (Небажано) ⚠️';
        reason = 'Червоне вино може викликати металевий присмак з рибою';
      } else if (hasRedMeat && isWhiteWine) {
        score = 70;
        title = 'Легкий та нетиповий дует 🍽️';
        reason = 'Біле вино занадто легке для насиченого червоного м\'яса';
      }
    } else if (drinkCategory === 'Коктейлі') {
      const isSweet = drinkSales.includes('солод') || drinkSales.includes('ягід') || drinkSales.includes('медов') || drinkTitle.includes('вишн') || drinkTitle.includes('сауер') || drinkTitle.includes('мохіто');
      const isBitterOrStrong = drinkSales.includes('гірк') || drinkSales.includes('міцн') || drinkTitle.includes('негроні') || drinkTitle.includes('олд') || drinkTitle.includes('бульвар') || drinkTitle.includes('перон');
      const hasSweetSauce = dishIng.includes('вишн') || dishIng.includes('мед') || dishIng.includes('джем') || dishIng.includes('слив') || dishTitle.includes('вишневому соусі') || dishTitle.includes('качка з ягідним соусом');
      const isFatty = dishIng.includes('ребер') || dishIng.includes('щок') || dishTitle.includes('щочки') || dishTitle.includes('копченості') || dishTitle.includes('люля') || dishTitle.includes('шашлик');

      if (hasSweetSauce && isSweet) {
        score = 95;
        title = 'Ягідний синергізм (Прекрасно) 🍓';
        reason = 'Ягідна солодкість напою підсилює фруктові соуси страви';
      } else if (isFatty && isBitterOrStrong) {
        score = 94;
        title = 'Чоловічий характер та сила смаку 🥃';
        reason = 'Гіркота та міцність напою розчиняють важкі м\'ясні жири';
      } else if (isFatty && isSweet) {
        score = 65;
        title = 'Занадто нудотно ⚠️';
        reason = 'Солодкі коктейлі погано сумісні з ситними м\'ясними стравами';
      }
    } else if (drinkCategory === 'Безалкогольні & Пиво') {
      const isCucumberAloe = drinkTitle.includes('огірок') || drinkTitle.includes('алоє') || drinkTitle.includes('лимонад');
      const isGingerCitrus = drinkTitle.includes('імбир') || drinkTitle.includes('обліпих') || drinkTitle.includes('цитрус');
      const isFattyOrRich = dishIng.includes('ребер') || dishIng.includes('щок') || dishTitle.includes('щочки') || dishTitle.includes('каре') || dishTitle.includes('качка') || dishTitle.includes('банош');

      if (isCucumberAloe && isFattyOrRich) {
        score = 94;
        title = 'Ультра-свіжий контраст 🥒';
        reason = 'Огірковий напій ідеально змиває вершкову або м\'ясну важкість';
      } else if (isGingerCitrus && (dishIng.includes('вишн') || dishIng.includes('соус'))) {
        score = 92;
        title = 'Пряний зігріваючий союз 🍊';
        reason = 'Імбирні ноти напою дають пікантність солодкуватим соусам';
      }
    } else if (drinkCategory === 'Міцні напої') {
      const isWhiskeyOrCognac = drinkTitle.includes('віскі') || drinkTitle.includes('коньяк') || drinkTitle.includes('бренді') || drinkTitle.includes('бурбон');
      const isVodkaOrTequila = drinkTitle.includes('горілк') || drinkTitle.includes('дистилят') || drinkTitle.includes('настоянк') || drinkTitle.includes('зубровк');
      const hasSmokedOrMeat = dishIng.includes('копчен') || dishIng.includes('щок') || dishIng.includes('яловичин') || dishIng.includes('свин') || dishTitle.includes('шашлик') || dishTitle.includes('ребер');
      const hasSalineOrLard = dishIng.includes('сал') || dishIng.includes('оселед') || dishTitle.includes('форшмак');

      if (hasSmokedOrMeat && isWhiskeyOrCognac) {
        score = 96;
        title = 'Шляхетне деревне поєднання 🥃';
        reason = 'Димні ноти м\'яса перегукуються з дубовими відтінками віскі';
      } else if (hasSalineOrLard && isVodkaOrTequila) {
        score = 95;
        title = 'Автентичний український контраст 🌾';
        reason = 'Солона та жирна закуска підкреслюється крижаним дистилятом';
      }
    }

    return { score, title, reason };
  };

  const constructorDishes = useMemo(() => {
    let list = menuItems.filter(item => 
      item.category === 'Їжа' && 
      item.subcategory !== 'Гарніри' && 
      item.subcategory !== 'Десерти' &&
      item.subcategory !== 'Дитяче меню'
    );

    if (gastroMatchMode === 'drink-first' && selectedGastroDrink) {
      list = [...list].sort((a, b) => {
        const scoreA = getPairingScore(a, selectedGastroDrink).score;
        const scoreB = getPairingScore(b, selectedGastroDrink).score;
        return scoreB - scoreA;
      });
    }

    if (!constructorDishQuery.trim()) return list;
    const q = constructorDishQuery.toLowerCase().trim();
    return list.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.ingredients.toLowerCase().includes(q) ||
      item.anchor.toLowerCase().includes(q)
    );
  }, [menuItems, constructorDishQuery, selectedGastroDrink, gastroMatchMode]);

  const constructorDrinks = useMemo(() => {
    let list = menuItems.filter(item => {
      if (selectedGastroDrinkCategory === 'wine') {
        return item.category === 'Вино';
      }
      if (selectedGastroDrinkCategory === 'cocktail') {
        return item.category === 'Коктейлі';
      }
      if (selectedGastroDrinkCategory === 'bar') {
        return item.category === 'Безалкогольні & Пиво';
      }
      if (selectedGastroDrinkCategory === 'spirit') {
        return item.category === 'Міцні напої';
      }
      return false;
    });

    if (gastroMatchMode === 'dish-first' && selectedGastroDish) {
      list = [...list].sort((a, b) => {
        const scoreA = getPairingScore(selectedGastroDish, a).score;
        const scoreB = getPairingScore(selectedGastroDish, b).score;
        return scoreB - scoreA;
      });
    }

    if (!constructorDrinkQuery.trim()) return list;
    const q = constructorDrinkQuery.toLowerCase().trim();
    return list.filter(item => 
      item.title.toLowerCase().includes(q) || 
      item.ingredients.toLowerCase().includes(q) ||
      item.anchor.toLowerCase().includes(q)
    );
  }, [selectedGastroDrinkCategory, menuItems, constructorDrinkQuery, selectedGastroDish, gastroMatchMode]);

  const suggestedCompanions = useMemo(() => {
    if (!selectedGastroDish && !selectedGastroDrink) {
      const defaults = menuItems.filter(item => 
        item.category === 'Їжа' && 
        (item.subcategory === 'Гарніри' || item.subcategory === 'Салати' || item.subcategory === 'Перші страви' || item.subcategory === 'Холодні закуски')
      ).slice(0, 8);
      
      return defaults.map(item => ({
        item,
        score: 50,
        reason: 'Оберіть страву або напій, щоб побачити персональні рекомендації!'
      }));
    }

    const dishTitle = selectedGastroDish ? selectedGastroDish.title.toLowerCase() : '';
    const dishIng = selectedGastroDish ? selectedGastroDish.ingredients.toLowerCase() : '';
    const drinkTitle = selectedGastroDrink ? selectedGastroDrink.title.toLowerCase() : '';
    const drinkCat = selectedGastroDrink ? selectedGastroDrink.category : '';

    let candidates = menuItems.filter(item => 
      item.id !== selectedGastroDish?.id && 
      item.id !== selectedGastroDrink?.id &&
      item.category === 'Їжа'
    );

    let scored = candidates.map(item => {
      let score = 50;
      let reason = 'Чудове доповнення для багатства вашого обіду';

      const itemTitle = item.title.toLowerCase();
      const itemIng = item.ingredients.toLowerCase();
      const itemSub = item.subcategory;

      const isRichMeat = dishTitle.includes('щічк') || dishTitle.includes('ребер') || dishTitle.includes('люля') || dishTitle.includes('шашлик') || dishTitle.includes('стейк') || dishIng.includes('яловичин') || dishIng.includes('свин');
      const isFish = dishTitle.includes('сом') || dishTitle.includes('форел') || dishTitle.includes('риба') || dishIng.includes('сом') || dishIng.includes('форел');
      const isHeavyDrink = drinkCat === 'Міцні напої' || drinkTitle.includes('червон') || drinkTitle.includes('негроні') || drinkTitle.includes('олд');
      const isFreshDrink = drinkTitle.includes('огірок') || drinkTitle.includes('лимонад') || drinkTitle.includes('просекко') || drinkTitle.includes('біле');

      if (isRichMeat) {
        if (itemSub === 'Салати') {
          score += 40;
          reason = 'Свіжий хрусткий салат чудово розвантажить рецептори від насиченого м\'яса';
        } else if (itemSub === 'Гарніри' && (itemTitle.includes('картоп') || itemTitle.includes('овоч'))) {
          score += 30;
          reason = 'Традиційний гарячий гарнір, який підкреслить ситність м\'ясної страви';
        } else if (itemSub === 'Перші страви' && itemTitle.includes('борщ')) {
          score += 20;
          reason = 'Для повноцінного ситного обіду в традиційному українському стилі';
        }
      }

      if (isFish) {
        if (itemSub === 'Гарніри' && itemTitle.includes('овоч')) {
          score += 45;
          reason = 'Запечені овочі — ідеальний легкий та ніжний гарнір до річкової риби';
        } else if (itemSub === 'Салати' && (itemTitle.includes('зелен') || itemTitle.includes('овоч'))) {
          score += 35;
          reason = 'Легкий зелений салат гармонійно підтримає делікатну текстуру риби';
        } else if (itemTitle.includes('картопляне пюре')) {
          score += 25;
          reason = 'Класичне вершкове картопляне пюре ідеально пасує до риби у соусі';
        }
      }

      if (drinkCat === 'Вино') {
        if (itemSub === 'Салати' && itemTitle.includes('сир')) {
          score += 30;
          reason = 'Ніжний сир у салаті чудово розкриє витончену палітру нашого вина';
        }
        if (itemSub === 'Холодні закуски' && itemTitle.includes('паштет')) {
          score += 35;
          reason = 'Паштет на хрустких гренках — класичний аперитив під благородний келих';
        }
      }

      if (drinkCat === 'Міцні напої') {
        if (itemTitle.includes('сало') || itemTitle.includes('форшмак') || itemTitle.includes('оселед')) {
          score += 50;
          reason = 'Найкраща автентична закуска, що пом\'якшить міцний алкоголь';
        }
        if (itemSub === 'Перші страви' && itemTitle.includes('борщ')) {
          score += 40;
          reason = 'Гарячий борщ та чарка міцного дистиляту — легендарний український тандем';
        }
      }

      if (isRichMeat && isHeavyDrink) {
        if (itemSub === 'Салати' && (itemTitle.includes('томат') || itemTitle.includes('зелен'))) {
          score += 25;
          reason = 'Освіжаючі томати та зелень чудово розбавлять танінну щільність напою';
        }
      }

      if (isFish && isFreshDrink) {
        if (itemSub === 'Гарніри' && itemTitle.includes('рис')) {
          score += 30;
          reason = 'Нейтральний гарнір збереже витончений мінеральний дует білої риби та легкого напою';
        }
      }

      const isUkrainian = dishTitle.includes('борщ') || dishTitle.includes('банош') || dishTitle.includes('дерун') || dishTitle.includes('вареник');
      if (isUkrainian) {
        if (itemTitle.includes('сало')) {
          score += 35;
          reason = 'Додає фірмової автентики та ситості до обраного українського шедевру';
        }
      }

      return { item, score, reason };
    });

    if (constructorGarnishQuery.trim()) {
      const q = constructorGarnishQuery.toLowerCase().trim();
      scored = scored.filter(c => 
        c.item.title.toLowerCase().includes(q) || 
        c.item.subcategory.toLowerCase().includes(q) ||
        c.item.ingredients.toLowerCase().includes(q)
      );
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [selectedGastroDish, selectedGastroDrink, menuItems, constructorGarnishQuery]);

  const computedPairingAnalysis = useMemo(() => {
    if (!selectedGastroDish && !selectedGastroDrink) {
      return {
        score: 0,
        stars: 0,
        title: 'Оберіть компоненти 🔗',
        description: 'Оберіть головну страву зліва або напій справа. Система миттєво підкаже найкращі взаємозалежні варіанти та прорахує баланс смаків.',
        quote: 'Наш сомельє готовий розкрити таємниці ідеального пейрінгу! Спробуйте клікнути на страву або коктейль.',
        profileMatches: { sweetness: 0, acidity: 0, body: 0, intensity: 0 }
      };
    }

    if (selectedGastroDish && !selectedGastroDrink) {
      return {
        score: 40,
        stars: 2,
        title: 'Обрано страву: очікуємо напій 🍷',
        description: `Ви обрали чудову позицію "${selectedGastroDish.title}". Тепер виберіть напій у третій колонці. Система вже відсортувала карту напоїв так, щоб найкращі сумісні варіанти опинилися вгорі!`,
        quote: `«Чудовий вибір страви! Тепер зверніть увагу на перші позиції в колонці напоїв — я підготував для вас ідеальних кандидатів під "${selectedGastroDish.title}".»`,
        profileMatches: { sweetness: 25, acidity: 30, body: 40, intensity: 50 }
      };
    }

    if (!selectedGastroDish && selectedGastroDrink) {
      return {
        score: 40,
        stars: 2,
        title: 'Обрано напій: очікуємо страву 🥩',
        description: `Ви обрали напій "${selectedGastroDrink.title}". Тепер підберіть ідеальну гастрономічну пару з першої колонки. Найбільш відповідні страви за рекомендацією сомельє вже піднялися на самий верх!`,
        quote: `«Прекрасний напій! Спеціально під "${selectedGastroDrink.title}" я виставив на перші місця в меню страви, які створять з ним неперевершений союз смаків.»`,
        profileMatches: { sweetness: 40, acidity: 50, body: 25, intensity: 30 }
      };
    }

    const dish = selectedGastroDish!;
    const drink = selectedGastroDrink!;
    const dishTitle = dish.title;
    const dishIng = dish.ingredients.toLowerCase();
    const garnishTitle = selectedGastroGarnish ? selectedGastroGarnish.title : 'Без супроводу';
    const drinkTitle = drink.title;
    const drinkCategory = drink.category;
    const drinkSales = drink.sales.toLowerCase();

    const pairingInfo = getPairingScore(dish, drink);
    const score = pairingInfo.score;
    const title = pairingInfo.title;
    
    let description = '';
    let quote = '';
    let sweetness = 40;
    let acidity = 50;
    let body = 60;
    let intensity = 70;

    if (drinkCategory === 'Вино') {
      const isRedWine = drinkTitle.toLowerCase().includes('червон') || drinkTitle.toLowerCase().includes('саперав') || drinkTitle.toLowerCase().includes('мерло') || drinkTitle.toLowerCase().includes('каберне') || drinkTitle.toLowerCase().includes('піно нуар') || drinkTitle.toLowerCase().includes('шираз') || drinkTitle.toLowerCase().includes('одеськ');
      const isWhiteWine = drinkTitle.toLowerCase().includes('біле') || drinkTitle.toLowerCase().includes('совіньйон') || drinkTitle.toLowerCase().includes('шардоне') || drinkTitle.toLowerCase().includes('рислінг') || drinkTitle.toLowerCase().includes('грюнер') || drinkTitle.toLowerCase().includes('сухолиман');
      const isSparkling = drinkTitle.toLowerCase().includes('ігрист') || drinkTitle.toLowerCase().includes('prosecco') || drinkTitle.toLowerCase().includes('бісер') || drinkTitle.toLowerCase().includes('брют');

      const hasRedMeat = dishIng.includes('яловичин') || dishIng.includes('свин') || dishTitle.toLowerCase().includes('щічк') || dishTitle.toLowerCase().includes('ребер') || dishTitle.toLowerCase().includes('каре') || dishTitle.toLowerCase().includes('телят') || dishTitle.toLowerCase().includes('качк') || dishTitle.toLowerCase().includes('стейк');
      const hasFish = dishIng.includes('сом') || dishIng.includes('форел') || dishIng.includes('риба') || dishTitle.toLowerCase().includes('пструг') || dishTitle.toLowerCase().includes('креветк');
      const hasCheese = dishIng.includes('сир') || dishIng.includes('бринз') || dishIng.includes('камамбер') || dishIng.includes('бурат');

      if (hasRedMeat && isRedWine) {
        description = `Оксамитові таніни червоного вина "${drinkTitle}" розчиняють насичені волокна томленого або грильованого м'яса в страві "${dishTitle}". ${selectedGastroGarnish ? `Супровід "${garnishTitle}" додає додаткової текстури та насиченості.` : ''} Жирність м'яса округлює кислотність вина, створюючи надзвичайно м'який та довгий фініш у роті.`;
        quote = `«Наполегливо рекомендую замовити до "${dishTitle}" саме келих червоного вина "${drinkTitle}". Його глибока танінність та ягідні тони фантастично розкриють смак томленого м'яса, роблячи його текстуру буквально шовковою.»`;
        sweetness = 20; acidity = 65; body = 90; intensity = 95;
      } else if (hasFish && isWhiteWine) {
        description = `Ніжна річкова риба або морепродукти у страві "${dishTitle}" вимагають сухого білого вина "${drinkTitle}". Це класичний баланс, де лимонні та квіткові ноти вина діють як природний освіжаючий соус до волокон риби. ${selectedGastroGarnish ? `Разом із "${garnishTitle}" це стає повноцінним шедевром.` : ''}`;
        quote = `«До нашої ніжної риби "${dishTitle}" ${selectedGastroGarnish ? `з гарніром "${garnishTitle}"` : ''} ідеально пасуватиме келих білого вина "${drinkTitle}". Його хрустка мінеральність та цитрусовий аромат підкреслять делікатність морепродуктів та збалансують соус.»`;
        sweetness = 15; acidity = 85; body = 45; intensity = 75;
      } else if (hasCheese && isSparkling) {
        description = `Кремова, тягуча або солона сирна основа страви "${dishTitle}" фантастично поєднується з грайливими бульбашками ігристого вина "${drinkTitle}". Перляж очищує піднебіння від насиченої жирності розтопленого сиру, створюючи святковий і легкий гастрономічний ритм.`;
        quote = `«Поєднайте цей розкішний сирний шедевр "${dishTitle}" із келихом охолодженого ігристого "${drinkTitle}". Кожна бульбашка буде освіжати ваші рецептори, роблячи кожен шматочок сиру таким же виразним та смачним, як перший.»`;
        sweetness = 30; acidity = 90; body = 50; intensity = 80;
      } else if (hasFish && isRedWine) {
        description = `Поєднання червоного танінного вина "${drinkTitle}" із ніжною рибою у страві "${dishTitle}" є ризикованим через можливу появу металевого присмаку. Однак, якщо риба подається з насиченими лісовими грибами, це може спрацювати. Проте, безпечніше делікатно запропонувати біле чи легке рожеве вино.`;
        quote = `«Це досить неординарний вибір! Червоне вино "${drinkTitle}" має помітні таніни, які можуть сперечатися з делікатною рибою "${dishTitle}". Якщо ви любите контрасти, це цікавий досвід, але я б також порадив звернути увагу на наше біле вино.»`;
        sweetness = 15; acidity = 50; body = 70; intensity = 85;
      } else if (hasRedMeat && isWhiteWine) {
        description = `Біле вино "${drinkTitle}" зазвичай занадто легке для насиченого червоного м'яса "${dishTitle}". Однак, якщо м'ясо має легкий соус або подається з вершковим гарніром "${garnishTitle}", вино з високою кислотністю допоможе збалансувати жирність страви.`;
        quote = `«Цікава комбінація! Кислотність білого вина "${drinkTitle}" допоможе розбити жирність у страві "${dishTitle}", хоча класично сюди пасує червоне. Спробуйте цей контраст, якщо шукаєте легкість!»`;
        sweetness = 25; acidity = 80; body = 55; intensity = 70;
      } else {
        description = `Вино "${drinkTitle}" добре пасуватиме до страви "${dishTitle}". Кислотний профіль вина та текстурні компоненти ${selectedGastroGarnish ? `супроводу "${garnishTitle}"` : 'страви'} перегукуються між собою, створюючи збалансоване смакове тло без різких домінант.`;
        quote = `«Чудовий, перевірений часом вибір. Сухе вино "${drinkTitle}" гармонійно доповнить страву "${dishTitle}" і дозволить вам повною мірою насолодитися смаком.»`;
        sweetness = 20; acidity = 70; body = 60; intensity = 75;
      }
    } else if (drinkCategory === 'Коктейлі') {
      const isSweet = drinkSales.includes('солод') || drinkSales.includes('ягід') || drinkSales.includes('медов') || drinkTitle.toLowerCase().includes('вишн') || drinkTitle.toLowerCase().includes('сауер') || drinkTitle.toLowerCase().includes('мохіто');
      const isBitterOrStrong = drinkSales.includes('гірк') || drinkSales.includes('міцн') || drinkTitle.toLowerCase().includes('негроні') || drinkTitle.toLowerCase().includes('олд') || drinkTitle.toLowerCase().includes('бульвар');
      const hasSweetSauce = dishIng.includes('вишн') || dishIng.includes('мед') || dishIng.includes('джем') || dishIng.includes('слив') || dishTitle.toLowerCase().includes('вишневому соусі') || dishTitle.toLowerCase().includes('качка з ягідним соусом');
      const isFatty = dishIng.includes('ребер') || dishIng.includes('щок') || dishTitle.toLowerCase().includes('щочки') || dishTitle.toLowerCase().includes('копченості') || dishTitle.toLowerCase().includes('люля') || dishTitle.toLowerCase().includes('шашлик');

      if (hasSweetSauce && isSweet) {
        description = `Солодкі або кисло-солодкі фруктові ноти фірмового коктейлю "${drinkTitle}" ідеально перегукуються з карамелізованим вишневим або ягідним соусом у страві "${dishTitle}". ${selectedGastroGarnish ? `Супровід "${garnishTitle}"` : 'Страва'} об'єднує ці солодкі ноти, створюючи відчуття вишуканого святкового обіду.`;
        quote = `«Ягідна кислинка та насиченість коктейлю "${drinkTitle}" неймовірно поєднуються з соусом у "${dishTitle}". Вони підсилюють солодкуваті ноти один одного, залишаючи яскравий фруктовий післясмак!»`;
        sweetness = 75; acidity = 65; body = 60; intensity = 85;
      } else if (isFatty && isBitterOrStrong) {
        description = `Насичені, жирні м'ясні волокна "${dishTitle}" та соуси на основі демігласу вимагають сильного партнера. Міцний, гіркуватий або пряний коктейль "${drinkTitle}" своєю міцністю чудово розчиняє жири, а легка гіркота стимулює роботу рецепторів і збуджує апетит.`;
        quote = `«До нашої соковитої страви "${dishTitle}" я б дуже радив підібрати коктейль "${drinkTitle}". Його глибока міцність та благородна сухість збалансують м'ясні соки, створюючи ідеальне гастрономічне тло.»`;
        sweetness = 35; acidity = 45; body = 85; intensity = 95;
      } else {
        description = `Вибір коктейлю "${drinkTitle}" до страви "${dishTitle}" свідчить про сучасний підхід до фудпейрінгу. Складний багатогранний смак коктейлю розкриває приховані пряні або цитрусові нюанси в інгредієнтах страви, створюючи нове, третє смакове вимірювання.`;
        quote = `«Спробуйте поєднати "${dishTitle}" з нашим фірмовим коктейлем "${drinkTitle}". Це дуже модне і цікаве поєднання, де свіжі ноти напою розкриють пряні спеції у страві.»`;
        sweetness = 55; acidity = 60; body = 65; intensity = 80;
      }
    } else if (drinkCategory === 'Безалкогольні & Пиво') {
      const isCucumberAloe = drinkTitle.toLowerCase().includes('огірок') || drinkTitle.toLowerCase().includes('алоє');
      const isGingerCitrus = drinkTitle.toLowerCase().includes('імбир') || drinkTitle.toLowerCase().includes('обліпих') || drinkTitle.toLowerCase().includes('цитрус');
      const isFattyOrRich = dishIng.includes('ребер') || dishIng.includes('щок') || dishTitle.toLowerCase().includes('щочки') || dishTitle.toLowerCase().includes('каре') || dishTitle.toLowerCase().includes('качка') || dishTitle.toLowerCase().includes('банош');

      if (isCucumberAloe && isFattyOrRich) {
        description = `Дивовижний ефект! Багата, насичена та калорійна страва "${dishTitle}" ${selectedGastroGarnish ? `із супроводом "${garnishTitle}"` : ''} супроводжується ультра-легким, трав'янистим і свіжим лимонадом "${drinkTitle}". Огірок та алое миттєво змивають щільний м'ясний чи вершковий смак із рецепторів, роблячи кожен наступний шматочок легким та соковитим.`;
        quote = `«До досить насиченої страви "${dishTitle}" ми маємо секретне поєднання — безалкогольний лимонад "${drinkTitle}". Він працює як природне освіження: огірок та алое змивають вершкову важкість, даруючи абсолютну свіжість під час вечері!»`;
        sweetness = 45; acidity = 75; body = 30; intensity = 85;
      } else if (isGingerCitrus && (dishIng.includes('вишн') || dishIng.includes('мед') || dishIng.includes('слив') || dishTitle.toLowerCase().includes('вишневому соусі') || dishTitle.toLowerCase().includes('качка з ягідним соусом'))) {
        description = `Пряні, гоструваті ноти імбиру та кисло-солодкі цитрусові відтінки напою "${drinkTitle}" чудово гармоніюють із солодким соусом страви "${dishTitle}". Вони не пригнічують солодощі, а додають їм благородної пікантності та теплоти.`;
        quote = `«Спробуйте цей неймовірно затишний дует: лимонад чи чай "${drinkTitle}" до нашої страви "${dishTitle}". Цитрусова свіжість та імбирний зігріваючий ефект зроблять смак солодких нот неймовірно глибоким.»`;
        sweetness = 65; acidity = 75; body = 40; intensity = 80;
      } else {
        description = `Безалкогольний напій "${drinkTitle}" — чудовий універсальний супровід для страви "${dishTitle}". Він підтримує водний баланс організму, приносить легку фруктову кислинку та дозволяє повністю сконцентруватися на смакових нюансах самої страви.`;
        quote = `«До страви "${dishTitle}" чудово підійде освіжаючий напій "${drinkTitle}". Він легкий, натуральний, приємно втамує спрагу та підкреслить багатство смаку страви.»`;
        sweetness = 50; acidity = 65; body = 35; intensity = 70;
      }
    } else if (drinkCategory === 'Міцні напої') {
      const isWhiskeyOrCognac = drinkTitle.toLowerCase().includes('віскі') || drinkTitle.toLowerCase().includes('коньяк') || drinkTitle.toLowerCase().includes('бренді') || drinkTitle.toLowerCase().includes('бурбон');
      const isVodkaOrTequila = drinkTitle.toLowerCase().includes('горілк') || drinkTitle.toLowerCase().includes('дистилят') || drinkTitle.toLowerCase().includes('настоянк');
      const hasSmokedOrMeat = dishIng.includes('копчен') || dishIng.includes('щок') || dishIng.includes('яловичин') || dishIng.includes('свин') || dishTitle.toLowerCase().includes('шашлик') || dishTitle.toLowerCase().includes('ребер');
      const hasSalineOrLard = dishIng.includes('сал') || dishIng.includes('оселед') || dishTitle.toLowerCase().includes('форшмак') || dishTitle.toLowerCase().includes('копченості');

      if (hasSmokedOrMeat && isWhiskeyOrCognac) {
        description = `Карамелізована скоринка та димні ноти грильованого або копченого м'яса у страві "${dishTitle}" неймовірно перегукуються з глибокими дубовими, торф'яними або ванільними відтінками витриманого напою "${drinkTitle}". Це шляхетний чоловічий вибір з максимальною інтенсивністю умамі.`;
        quote = `«Шанувальникам сильних смаків я гаряче рекомендую доповнити "${dishTitle}" порцією витриманого напою "${drinkTitle}". Їхні спільні димні та деревні ноти створюють просто космічний гастрономічний тандем.»`;
        sweetness = 15; acidity = 25; body = 95; intensity = 100;
      } else if (hasSalineOrLard && isVodkaOrTequila) {
        description = `Традиційні холодні закуски, сало з часником, копченості чи солона риба в страві "${dishTitle}" класично розкриваються під крижаний чистий дистилят чи горілку "${drinkTitle}". Спирти миттєво зв'язують солені та жирні компоненти, залишаючи відчуття чистоти та тепла.`;
        quote = `«До нашої традиційної закуски "${dishTitle}" ідеально підійде чарка крижаного напою "${drinkTitle}". Це класика нашої кухні: міцний чистий напій миттєво підкреслить солонуваті ноти сала та хліба й зігріє рецептори.»`;
        sweetness = 5; acidity = 15; body = 70; intensity = 95;
      } else {
        description = `Вибір міцного алкоголю "${drinkTitle}" до страви "${dishTitle}" створює інтенсивне смакове навантаження. Рекомендується пити напій маленькими ковтками, супроводжуючи кожен шматочок страви ${selectedGastroGarnish ? `із супроводом "${garnishTitle}"` : ''}, щоб спиртуозність не затьмарила делікатні спеції.`;
        quote = `«Для поціновувачів міцного супроводу рекомендую поєднати "${dishTitle}" з порцією "${drinkTitle}". Робіть невеликі ковтки після їжі, щоб відчути, як благородна міцність напою підсилює теплоту страви.»`;
        sweetness = 10; acidity = 20; body = 80; intensity = 90;
      }
    }

    const stars = Math.round(score / 20);

    return {
      score,
      stars,
      title,
      description,
      quote,
      profileMatches: { sweetness, acidity, body, intensity }
    };
  }, [selectedGastroDish, selectedGastroGarnish, selectedGastroDrink]);

  // File Uploader Parser handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        setRawText(text);
        const parsed = parseMenuTxt(text);
        setParsedItems(parsed);
        onAddXp(20); // Award XP for analyzing restaurant files
      }
    };
    reader.readAsText(file);
  };

  // Manual Paste handler
  const handleManualPaste = () => {
    if (!rawText.trim()) return;
    const parsed = parseMenuTxt(rawText);
    setParsedItems(parsed);
    onAddXp(15);
  };

  // Edit single parsed item
  const handleSaveEditItem = (updated: MenuItem) => {
    setParsedItems(prev => prev.map(item => item.id === updated.id ? updated : item));
    setSelectedEditItem(null);
  };

  // Commit and Merge parsed items into global menu state
  const handleCommitImport = () => {
    if (parsedItems.length === 0) return;
    
    // Merge strategy: replace items with same title (case insensitive) or add as new
    const updatedMenu = [...menuItems];
    
    parsedItems.forEach((newItem) => {
      const existingIndex = updatedMenu.findIndex(
        (m) => m.title.toLowerCase().replace(/\s/g, '') === newItem.title.toLowerCase().replace(/\s/g, '')
      );
      if (existingIndex !== -1) {
        // Overwrite existing with manager's updated version
        updatedMenu[existingIndex] = {
          ...updatedMenu[existingIndex],
          ...newItem,
          id: updatedMenu[existingIndex].id // keep existing ID to preserve references
        };
      } else {
        // Insert as a brand-new position
        updatedMenu.push(newItem);
      }
    });

    onSetMenuItems(updatedMenu);
    onAddXp(50); // Award major XP for successful restaurant menu synchronization!
    setImportMessage(`🎉 Успішно завантажено та синхронізовано ${parsedItems.length} позицій! Всі модулі та тести оновлено.`);
    setParsedItems([]);
    setRawText('');
    setTimeout(() => setImportMessage(null), 6000);
  };

  // Restore Default LIS Menu
  const handleRestoreDefault = () => {
    if (window.confirm('Ви впевнені, що хочете видалити всі завантажені зміни та відновити базове меню ЛІС?')) {
      onSetMenuItems(defaultMenuData);
      setImportMessage('🟢 Базове меню ресторану «ЛІС» повністю відновлено.');
      setTimeout(() => setImportMessage(null), 4000);
    }
  };

  // Interactive pairing click-to-jump jump handler
  const handlePairingJump = (targetTitle: string) => {
    // Also close modals if open
    setShowWineAdvisor(false);
    setShowSummaryTable(false);
    setShowConstructorModal(false);

    const cleanTarget = targetTitle.toLowerCase();
    
    // Find closest match in current menuItems
    const found = menuItems.find((item) => {
      const title = item.title.toLowerCase();
      return title.includes(cleanTarget) || cleanTarget.includes(title);
    });

    if (found) {
      setSelectedCategory(found.category);
      setSelectedSubcategory(found.subcategory);
      setExpandedItem(found.id);
      
      // Auto scroll to card
      setTimeout(() => {
        const el = document.getElementById(`item-${found.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
      onAddXp(5); // Award micro XP for exploring food pairings!
    } else {
      // Search-like fallback
      setSearchQuery(targetTitle);
    }
  };

  // Expand / collapse card toggle
  const toggleItem = (itemId: string) => {
    setExpandedItem(expandedItem === itemId ? null : itemId);
  };

  // Highlight search matches
  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <mark key={index} className="bg-cyan-500/30 text-cyan-200 border-b border-cyan-400 px-0.5 rounded-sm">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Allergen styling badges mapper
  const getAllergenBadge = (alg: string) => {
    const lower = alg.trim().toLowerCase();
    if (lower.includes('лактоз')) return { label: '🥛 Лактоза', color: 'border-blue-500/30 bg-blue-500/10 text-blue-300' };
    if (lower.includes('глютен')) return { label: '🌾 Глютен', color: 'border-amber-500/30 bg-amber-500/10 text-amber-300' };
    if (lower.includes('яйц')) return { label: '🥚 Яйця', color: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300' };
    if (lower.includes('риб')) return { label: '🐟 Риба', color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300' };
    if (lower.includes('горіх') || lower.includes('ліщин')) return { label: '🥜 Горіхи', color: 'border-amber-700/30 bg-amber-700/10 text-amber-400' };
    if (lower.includes('ракопод')) return { label: '🦐 Ракоподібні', color: 'border-rose-500/30 bg-rose-500/10 text-rose-300' };
    return { label: `⚠️ ${alg}`, color: 'border-red-500/30 bg-red-500/10 text-red-300' };
  };

  // Check comparison diff status between parsed item and database
  const getDiffStatus = (parsedItem: MenuItem) => {
    const matched = menuItems.find(
      (m) => m.title.toLowerCase().replace(/\s/g, '') === parsedItem.title.toLowerCase().replace(/\s/g, '')
    );
    if (!matched) return { label: 'Нова позиція 🆕', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
    
    const ingredientsDiff = matched.ingredients.toLowerCase() !== parsedItem.ingredients.toLowerCase();
    const descriptionDiff = matched.sales.toLowerCase() !== parsedItem.sales.toLowerCase();
    
    if (ingredientsDiff || descriptionDiff) {
      return { label: 'Зміни у техкарті ⚠️', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
    }
    return { label: 'Збігається повністю 🟢', color: 'text-slate-400 border-white/10 bg-white/5' };
  };

  const level = Math.floor(stats.xp / 250) + 1;
  const xpInCurrentLevel = stats.xp % 250;
  const xpNeededForNextLevel = 250;
  const progressPercent = Math.min((xpInCurrentLevel / xpNeededForNextLevel) * 100, 100);

  const getRankLabel = (lvl: number) => {
    if (lvl >= 8) return 'Шеф-Сомельє';
    if (lvl >= 6) return 'Старший Офіціант';
    if (lvl >= 4) return 'Профі Офіціант';
    if (lvl >= 2) return 'Офіціант';
    return 'Стажер ЛІСу';
  };

  return (
    <div className="space-y-6" id="menu-tab-container">
      {/* Category selector panel & search */}
      <div className="bg-[#030a06]/90 backdrop-blur-xl border-b border-emerald-950/60 shadow-[0_4px_25px_rgba(3,10,6,0.5)]">
        <div className="max-w-7xl mx-auto px-4 py-3.5 space-y-3.5">
          
          {/* Main Top Title Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-3">
            {/* Brand Logo & Name */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] tracking-wider uppercase text-emerald-400 font-extrabold">просто ліс</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-[10px] font-extrabold text-amber-400 tracking-wide">База знань</span>
                  {handbookMode && (
                    <>
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Довідник
                      </span>
                    </>
                  )}
                </div>
                <h1 className="text-base font-black text-white tracking-tight -mt-0.5 flex items-center gap-1 uppercase">
                  <span>просто ліс</span>
                  <span className="text-xs">🌲</span>
                </h1>
              </div>
            </div>

            {/* Quick Actions Panel & Stats widget */}
            <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                {/* Gastro-Constructor Button */}
                <button
                  onClick={() => {
                    setShowConstructorModal(true);
                    // Clean slate to start fresh
                    setSelectedGastroDish(null);
                    setSelectedGastroGarnish(null);
                    setSelectedGastroDrink(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-400 transition cursor-pointer shadow-[0_0_8px_rgba(6,182,212,0.15)] hover:shadow-[0_0_12px_rgba(6,182,212,0.3)]"
                  title="Інтерактивний гастрономічний конструктор страв, гарнірів та напоїв"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Гастро-Конструктор 🍽️</span>
                </button>

                {/* Handbook Mode Toggle Button */}
                <button
                  onClick={() => setHandbookMode(!handbookMode)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 border transition cursor-pointer ${
                    handbookMode 
                      ? 'bg-cyan-500 text-[#0a0f1e] border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]' 
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                  }`}
                  title="Переглянути все меню однією сторінкою"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{handbookMode ? 'Звичайний вигляд' : 'Повний довідник 📄'}</span>
                </button>
              </div>

              {/* User stats widget */}
              <div className="flex items-center gap-2">
                {/* Streak Indicator */}
                {stats.streak > 0 && (
                  <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1.5 rounded-full text-emerald-300 font-bold text-xs">
                    <Flame className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500 animate-bounce" />
                    <span>{stats.streak} дн.</span>
                  </div>
                )}

                {/* XP & Level Indicator */}
                <button
                  onClick={onOpenStats}
                  className="flex items-center gap-2.5 bg-[#05140d]/80 hover:bg-[#071b12] border border-emerald-900/50 px-3.5 py-1.5 rounded-xl transition duration-200 text-left cursor-pointer"
                >
                  <div className="relative flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-emerald-400" />
                    <span className="absolute -top-1.5 -right-1.5 bg-emerald-400 text-[#030a06] font-black text-[8px] w-4 h-4 rounded-full flex items-center justify-center border border-[#030a06]">
                      {level}
                    </span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">{getRankLabel(level)}</p>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-emerald-950 h-1 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-mono text-emerald-300/80">{stats.xp} XP</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Manager Action Alerts Block */}
          {importMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-2xl text-xs font-bold animate-pulse flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{importMessage}</span>
            </div>
          )}

          {/* COLLAPSIBLE MANAGER PANEL EXPERT PANEL */}
          {showManagerPanel && (
            <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-5 space-y-4 animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Імпорт та налаштування меню будь-якого ресторану 📥</h3>
                </div>
                <button
                  onClick={handleRestoreDefault}
                  className="text-slate-400 hover:text-rose-400 text-xs font-extrabold flex items-center gap-1 bg-white/5 hover:bg-rose-500/10 px-2.5 py-1 rounded-lg border border-white/10 transition cursor-pointer"
                  title="Скинути всі імпортовані меню та повернути ЛІС"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Відновити ЛІС ↩️</span>
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Inputs Panel */}
                <div className="space-y-3">
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300 leading-normal">
                    💡 <strong>Універсальний завантажувач:</strong> Твій колега може легко завантажити меню свого нового закладу у форматі тексту чи .txt файлу! Всі тести, картки та інтерактивний підбір напоїв у додатку миттєво перебудуються під нове робоче меню!
                  </div>
                  
                  <label className="block text-xs font-bold text-slate-400">
                    Крок 1: Завантажте файл нового ресторану (.txt) або вставте текст техкарт
                  </label>
                  
                  {/* File input */}
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-white/10 rounded-xl cursor-pointer bg-white/5 hover:bg-white/10 hover:border-purple-500/40 transition">
                      <div className="flex flex-col items-center justify-center pt-4 pb-4">
                        <Upload className="w-7 h-7 text-purple-400 mb-1" />
                        <p className="text-xs text-slate-300 font-bold">Оберіть меню .txt</p>
                        <p className="text-[10px] text-slate-500">навчальна рецепта ЛІС.txt або будь-яка інша</p>
                      </div>
                      <input 
                        type="file" 
                        accept=".txt" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                      />
                    </label>
                  </div>

                  {/* Manual Paste Area */}
                  <div className="space-y-1.5">
                    <textarea
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Або вставте текст техкарт у будь-якому форматі..."
                      className="w-full h-28 bg-[#070b13] border border-white/10 rounded-xl p-3 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={handleManualPaste}
                      disabled={!rawText.trim()}
                      className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-extrabold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <FilePlus className="w-4 h-4" />
                      <span>Проаналізувати та порівняти текст 🔍</span>
                    </button>
                  </div>
                </div>

                {/* Validation Compare Diffs List */}
                <div className="space-y-3 flex flex-col h-[320px] justify-between border-l border-white/10 pl-0 lg:pl-5">
                  <div className="space-y-2 flex-1 overflow-y-auto no-scrollbar pr-1">
                    <span className="text-xs font-bold text-slate-400 block mb-1">
                      Крок 2: Перевірка та редагування змін ({parsedItems.length} позицій знайдено):
                    </span>

                    {parsedItems.length === 0 ? (
                      <div className="text-center py-12 border border-white/10 bg-white/5 rounded-xl p-4 flex flex-col items-center justify-center">
                        <Info className="w-8 h-8 text-purple-400/50 mb-2 animate-bounce" />
                        <p className="text-xs text-slate-400 leading-normal">Завантажте файл або вставте текст техкарт.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {parsedItems.map((item) => {
                          const diff = getDiffStatus(item);
                          return (
                            <div 
                              key={item.id}
                              className="bg-black/40 border border-white/5 rounded-xl p-3 flex items-start justify-between gap-3 text-xs transition hover:border-purple-500/30"
                            >
                              <div className="space-y-1 flex-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border ${diff.color}`}>
                                    {diff.label}
                                  </span>
                                  <span className="text-slate-500 font-bold text-[10px]">{item.subcategory}</span>
                                </div>
                                <h4 className="font-extrabold text-white text-xs">{item.title}</h4>
                                <p className="text-[10px] text-slate-400 line-clamp-1 italic">
                                  Склад: {item.ingredients}
                                </p>
                              </div>
                              <button
                                onClick={() => setSelectedEditItem(item)}
                                className="bg-white/5 hover:bg-purple-600/20 border border-white/10 hover:border-purple-500/30 text-purple-300 font-bold p-1.5 rounded-lg transition cursor-pointer"
                                title="Редагувати вміст страви"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {parsedItems.length > 0 && (
                    <div className="pt-3 border-t border-white/10">
                      <button
                        onClick={handleCommitImport}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-[#0a0f1e] font-black text-xs py-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
                      >
                        <Check className="w-4 h-4 font-bold" />
                        <span>ЗАТВЕРДИТИ ТА ІМПОРТУВАТИ В МЕНЮ ({parsedItems.length}) 🚀</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* In-Line Editing Modal/Form */}
              {selectedEditItem && (
                <div className="border-t border-white/10 pt-4 mt-4 space-y-3 animate-fade-in bg-black/30 p-4 rounded-xl border border-purple-500/20">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-purple-400 uppercase tracking-wider">
                      Редагування позиції: "{selectedEditItem.title}"
                    </h4>
                    <button 
                      onClick={() => setSelectedEditItem(null)}
                      className="text-slate-400 hover:text-white text-xs"
                    >
                      ✕ Скасувати
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">Назва страви / Напою</label>
                      <input 
                        type="text" 
                        value={selectedEditItem.title} 
                        onChange={(e) => setSelectedEditItem({...selectedEditItem, title: e.target.value})}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">Якір (для легкого запам'ятовування)</label>
                      <input 
                        type="text" 
                        value={selectedEditItem.anchor} 
                        onChange={(e) => setSelectedEditItem({...selectedEditItem, anchor: e.target.value})}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400">Складники / Рецепт</label>
                      <textarea 
                        value={selectedEditItem.ingredients} 
                        onChange={(e) => setSelectedEditItem({...selectedEditItem, ingredients: e.target.value})}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-lg p-2 text-white h-12"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400">Козир продажу (Опис для гостя)</label>
                      <textarea 
                        value={selectedEditItem.sales} 
                        onChange={(e) => setSelectedEditItem({...selectedEditItem, sales: e.target.value})}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-lg p-2 text-white h-12"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">Алергени (через кому)</label>
                      <input 
                        type="text" 
                        value={selectedEditItem.allergens?.join(', ')} 
                        onChange={(e) => setSelectedEditItem({...selectedEditItem, allergens: e.target.value.split(',').map(x => x.trim()).filter(Boolean)})}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-lg p-2 text-white"
                        placeholder="лактоза, глютен"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400">Цікавий факт про користь</label>
                      <input 
                        type="text" 
                        value={selectedEditItem.interestingFact || ''} 
                        onChange={(e) => setSelectedEditItem({...selectedEditItem, interestingFact: e.target.value})}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-lg p-2 text-white"
                        placeholder="Багатий на антиоксиданти..."
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-slate-400">Гастрономічна пара (Фудпейрінг)</label>
                      <input 
                        type="text" 
                        value={selectedEditItem.pairing || ''} 
                        onChange={(e) => setSelectedEditItem({...selectedEditItem, pairing: e.target.value})}
                        className="w-full bg-[#0d1117] border border-white/10 rounded-lg p-2 text-white"
                        placeholder="Чудово пасує до..."
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSaveEditItem(selectedEditItem)}
                    className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    Зберегти зміни для цієї позиції
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Regular Browser Filters (Hidden in Handbook Mode) */}
          {!handbookMode && (
            <div className="space-y-4">
              {/* Main Categories Tabs Grid - High-tactility buttons for rush hours */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2" id="category-selector-nav">
                {(['Їжа', 'Вино', 'Коктейлі', 'Безалкогольні & Пиво', 'Міцні напої'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`py-3.5 px-2 rounded-xl text-[10px] sm:text-xs font-black tracking-wider uppercase transition-all duration-200 cursor-pointer border text-center flex items-center justify-center min-h-[48px] ${
                      selectedCategory === cat
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_4px_16px_rgba(16,185,129,0.35)] scale-102 font-black'
                        : 'bg-emerald-950/20 border-emerald-900/35 hover:bg-emerald-900/15 text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Subcategories & Search Input Area */}
              <div className="flex flex-col lg:flex-row gap-3">
                {/* Search Input Bar - High contrast focus for forest theme */}
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                    <Search className="h-4 w-4 text-emerald-500/70" />
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Пошук страви, вина, інгредієнта, алергену..."
                    className="w-full bg-[#05140c] border border-emerald-900/40 hover:border-emerald-700/65 focus:border-emerald-500 text-slate-100 placeholder-slate-500 text-xs rounded-xl pl-10 pr-4 py-3 transition focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quick-reference Guide Buttons - Heavy touch targets (min 48px height) */}
                <div className="grid grid-cols-2 sm:flex gap-2">
                  {selectedCategory === 'Їжа' && (
                    <button
                      onClick={() => setShowSteakGuide(true)}
                      className="bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 px-4.5 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer whitespace-nowrap min-h-[48px] flex-1 sm:flex-initial"
                    >
                      <Utensils className="w-4 h-4 text-purple-400" />
                      <span>Гід просмажування 🥩</span>
                    </button>
                  )}
                  <button
                    onClick={() => setShowSummaryTable(true)}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 px-4.5 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer whitespace-nowrap min-h-[48px] flex-1 sm:flex-initial"
                    title="Інтерактивний підбір напою під смак гостя"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-amber-400" />
                    <span>Підбір коктейлів 🍹</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowWineAdvisor(true);
                      setWineAdvisorTab('picker');
                    }}
                    className="col-span-2 sm:col-span-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 px-4.5 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer whitespace-nowrap min-h-[48px] flex-1 sm:flex-initial"
                    title="Інтерактивний підбір вина та винний спаринг"
                  >
                    <Award className="w-4 h-4 text-emerald-400" />
                    <span>Підбір вина 🍷</span>
                  </button>
                </div>
              </div>

              {/* Subcategory Scrollbar Tabs - Larger buttons for mobile finger safety */}
              {subcategories.length > 1 && (
                <div className="flex overflow-x-auto no-scrollbar gap-2 py-1.5">
                  {subcategories.map((sub) => (
                    <button
                      key={sub}
                      onClick={() => {
                        setSelectedSubcategory(sub);
                        setExpandedItem(null);
                      }}
                      className={`px-4.5 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-150 cursor-pointer border ${
                        selectedSubcategory === sub
                          ? 'bg-emerald-500 text-[#030a06] border-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : 'bg-emerald-950/15 border-emerald-900/30 text-slate-400 hover:text-white hover:bg-emerald-900/10'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RENDER MODES CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 py-2">
        {handbookMode ? (
          /* HANDBOOK MODE: SINGLE PAGE CONSOLIDATED TRAINING MANUAL VIEW */
          <div className="space-y-8 bg-white/5 border border-white/10 rounded-3xl p-6 lg:p-10 text-slate-200 animate-fade-in" id="handbook-consolidated-view">
            <div className="border-b border-white/10 pb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-black text-white tracking-tight">КОНСОЛІДОВАНИЙ ДОВІДНИК ОФІЦІАНТА</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Єдина навчальна сторінка зі всіма позиціями кухні та бару, складниками, якорями та фудпейрінгом.
                </p>
              </div>
              <button 
                onClick={() => window.print()}
                className="bg-white/10 hover:bg-white/15 text-white font-extrabold text-xs px-4 py-2 rounded-xl border border-white/10 transition cursor-pointer"
              >
                🖨️ Друкувати посібник
              </button>
            </div>

            {/* Quick Search inside Handbook */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-500" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Фільтрувати довідник за ключовим словом..."
                className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 text-slate-200 placeholder-slate-600 text-xs rounded-xl pl-10 pr-4 py-2.5 focus:outline-none"
              />
            </div>

            {/* Categories Loop */}
            {Object.entries(groupedHandbookItems).map(([category, subcategoriesMap]) => {
              // Check if category has any items matching current filter/search
              const hasItems = Object.values(subcategoriesMap).some(list => 
                list.some(item => !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.ingredients.toLowerCase().includes(searchQuery.toLowerCase()))
              );
              
              if (!hasItems) return null;

              return (
                <div key={category} className="space-y-6">
                  <div className="flex items-center gap-3 border-b border-cyan-500/30 pb-2">
                    <span className="w-2.5 h-6 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-sm"></span>
                    <h2 className="text-lg font-black text-white tracking-widest uppercase">{category}</h2>
                  </div>

                  {/* Subcategories Loop */}
                  {Object.entries(subcategoriesMap).map(([subcategory, list]) => {
                    const filteredList = list.filter(item => 
                      !searchQuery || 
                      item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      item.ingredients.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      item.anchor.toLowerCase().includes(searchQuery.toLowerCase())
                    );
                    
                    if (filteredList.length === 0) return null;

                    return (
                      <div key={subcategory} className="pl-0 md:pl-4 space-y-4">
                        <h3 className="text-xs font-extrabold text-cyan-400 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 inline-block">
                          📁 {subcategory}
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {filteredList.map((item) => (
                            <div 
                              key={item.id}
                              onClick={() => setSelectedDetailItem(item)}
                              className="bg-black/30 border border-white/5 hover:border-cyan-500/30 hover:bg-white/5 p-5 rounded-2xl space-y-3 transition duration-150 cursor-pointer group"
                              title="Натисніть для перегляду детальної картки страви/напою"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <h4 className="font-extrabold text-white text-base tracking-tight leading-snug group-hover:text-cyan-400 transition-colors">
                                    {highlightText(item.title, searchQuery)}
                                  </h4>
                                  <div className="flex items-center gap-1.5 mt-1 text-cyan-400 text-xs font-bold">
                                    <span className="opacity-60 text-slate-400 text-[10px]">⚓ Якір:</span>
                                    <span>{highlightText(item.anchor, searchQuery)}</span>
                                  </div>
                                </div>
                                <span className="text-[9px] font-mono font-bold bg-white/5 border border-white/10 px-2 py-0.5 rounded text-slate-500 group-hover:border-cyan-500/30 group-hover:text-cyan-400 transition-colors">
                                  {item.id.toUpperCase()}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 gap-2 text-xs">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-0.5">Склад / Опис:</span>
                                  <p className="text-slate-300 leading-normal bg-white/5 p-2 rounded-lg font-medium">{highlightText(item.ingredients, searchQuery)}</p>
                                </div>

                                <div>
                                  <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-0.5">Козир продажу:</span>
                                  <p className="text-cyan-200/90 italic leading-normal bg-cyan-950/20 border-l-2 border-cyan-400 p-2 rounded-r-lg font-semibold">«{highlightText(item.sales, searchQuery)}»</p>
                                </div>

                                {item.pairing && (
                                  <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold bg-purple-950/20 border border-purple-500/10 p-2 rounded-lg">
                                    <GlassWater className="w-3.5 h-3.5 shrink-0" />
                                    <span>Гастро-пара: {highlightText(item.pairing, searchQuery)}</span>
                                  </div>
                                )}

                                {item.interestingFact && (
                                  <div className="flex items-start gap-1.5 text-cyan-300 text-[11px] bg-cyan-950/10 border border-cyan-500/10 p-2 rounded-lg leading-normal">
                                    <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                    <span>Факт: {highlightText(item.interestingFact, searchQuery)}</span>
                                  </div>
                                )}

                                {item.allergens && item.allergens.length > 0 && (
                                  <div className="pt-1 flex flex-wrap gap-1">
                                    {item.allergens.map(a => {
                                      const badge = getAllergenBadge(a);
                                      return (
                                        <span key={a} className={`text-[9px] font-black border px-2 py-0.5 rounded-full ${badge.color}`}>
                                          {badge.label}
                                        </span>
                                      );
                                    })}
                                  </div>
                                )}

                                <div className="text-[10px] text-cyan-500/50 group-hover:text-cyan-400 flex items-center justify-between font-bold pt-2 border-t border-white/5 transition-colors">
                                  <span>Повна інфо-картка</span>
                                  <span>Детальніше →</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          /* BROWSER VIEW MODE: EXPANDABLE ACCORDIONS CARDS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {searchQuery && (
              <div className="md:col-span-2 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4 text-xs text-cyan-300 flex items-center justify-between gap-4 animate-fade-in">
                <span className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Пошук по всій базі: знайдено <strong>{filteredItems.length}</strong> збігів для "<strong>{searchQuery}</strong>"</span>
                </span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-[10px] text-cyan-400 hover:text-white underline cursor-pointer font-bold whitespace-nowrap"
                >
                  Очистити ✕
                </button>
              </div>
            )}
            {filteredItems.length === 0 ? (
              selectedCategory === 'Їжа' && selectedSubcategory === 'Гарячі страви' ? (
                <div className="text-center py-16 bg-gradient-to-br from-cyan-950/30 to-purple-950/30 border border-cyan-500/20 rounded-3xl p-8 md:col-span-2 space-y-5 animate-fade-in">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex items-center justify-center mx-auto text-3xl shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                    🔥
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-white tracking-tight">Гарячі страви перенесено до Гастро-Конструктора!</h4>
                    <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                      Ми створили потужний інтерактивний інструмент для підбору гарнірів, соусів та напоїв під кожну гарячу страву з аналізом смакових профілів від шеф-кухаря та сомельє!
                    </p>
                  </div>
                  <button
                    onClick={() => setShowConstructorModal(true)}
                    className="mx-auto bg-cyan-500 hover:bg-cyan-400 text-[#0a0f1e] font-extrabold text-xs px-6 py-3 rounded-xl transition cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-[#0a0f1e] animate-pulse" />
                    <span>Відкрити Гастро-Конструктор поєднань</span>
                  </button>
                </div>
              ) : (
                <div className="text-center py-16 bg-white/5 border border-white/10 rounded-2xl p-6 md:col-span-2">
                  <Info className="w-12 h-12 text-cyan-400/50 mx-auto mb-3 animate-bounce" />
                  <p className="text-slate-300 text-sm font-extrabold">Позицій не знайдено.</p>
                  <p className="text-xs text-slate-500 mt-1">Спробуйте інший запит або змініть вкладку.</p>
                </div>
              )
            ) : (
              filteredItems.map((item) => {
                const isExpanded = expandedItem === item.id;
                return (
                  <div
                    key={item.id}
                    id={`item-${item.id}`}
                    onClick={() => toggleItem(item.id)}
                    className={`bg-emerald-950/10 border transition-all duration-300 rounded-2xl overflow-hidden cursor-pointer shadow-md ${
                      isExpanded
                        ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 bg-[#05150e] shadow-[0_8px_30px_rgba(16,185,129,0.15)]'
                        : 'border-emerald-950/40 hover:border-emerald-800/30 hover:bg-emerald-950/20'
                    }`}
                  >
                    {/* Card Header Summary */}
                    <div className="p-4 flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          <span className="text-[9px] uppercase tracking-widest font-extrabold bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded">
                            {item.subcategory}
                          </span>
                          {item.category === 'Вино' && getWineTags(item).map((tag, idx) => (
                            <span key={idx} className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${tag.colorClass}`}>
                              {tag.label}
                            </span>
                          ))}
                          {item.isBestseller && (
                            <span className="text-[9px] font-extrabold bg-amber-500/10 border border-amber-500/30 text-amber-300 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                              🏆 Ходове вино
                            </span>
                          )}
                          {item.isFinalist && (
                            <span className="text-[9px] font-extrabold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                              👑 Фіналіст Топ-3
                            </span>
                          )}
                          {item.allergens && item.allergens.length > 0 && (
                            <span className="text-[9px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Алерген
                            </span>
                          )}
                        </div>
                        <h3 className="text-base font-bold text-white tracking-tight leading-snug">
                          {highlightText(item.title, searchQuery)}
                        </h3>
                        <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1 mt-1">
                          <span className="opacity-70 text-slate-400">⚓ Якір:</span>
                          <span>{highlightText(item.anchor, searchQuery)}</span>
                        </p>
                      </div>
                      <div className="text-xs font-mono text-emerald-500/60 bg-[#05140d] border border-emerald-950 px-2 py-1 rounded-lg">
                        {item.id.toUpperCase()}
                      </div>
                    </div>

                    {/* Expandable Body details */}
                    <div
                      className="transition-all duration-300 ease-in-out border-t border-emerald-950 overflow-hidden"
                      style={{
                        maxHeight: isExpanded ? '1000px' : '0px',
                        opacity: isExpanded ? 1 : 0,
                      }}
                    >
                      <div className="p-4 bg-black/20 space-y-4 text-sm" onClick={(e) => e.stopPropagation()}>
                        {/* Ingredients */}
                        <div>
                          <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex items-center gap-1">
                            <Utensils className="w-3.5 h-3.5 text-emerald-400" />
                            Склад / Опис
                          </h4>
                          <p className="text-slate-200 font-medium leading-relaxed bg-emerald-950/10 p-2.5 rounded-lg border border-emerald-900/10">
                            {highlightText(item.ingredients, searchQuery)}
                          </p>
                        </div>

                        {/* Selling Phrase */}
                        <div>
                          <h4 className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-1.5 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            Фраза для продажу (Козир)
                          </h4>
                          <div className="relative bg-amber-500/5 border-l-4 border-amber-500 p-3 rounded-r-xl rounded-l-md">
                            <p className="text-[#f1f5f9] italic font-semibold leading-relaxed">
                              💬 «{highlightText(item.sales, searchQuery)}»
                            </p>
                          </div>
                        </div>

                        {/* Wine-specific technical details */}
                        {item.category === 'Вино' && (
                          <div className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {item.grapeVarieties && (
                                <div className="bg-purple-950/20 border border-purple-500/15 p-3 rounded-xl">
                                  <span className="text-purple-400 uppercase font-extrabold text-[9px] tracking-wider block mb-1">🍇 Сорт винограду:</span>
                                  <span className="text-white font-semibold text-xs leading-normal">{item.grapeVarieties}</span>
                                </div>
                              )}
                              {item.sweetness && (
                                <div className="bg-emerald-950/20 border border-emerald-500/15 p-3 rounded-xl">
                                  <span className="text-emerald-400 uppercase font-extrabold text-[9px] tracking-wider block mb-1">🍭 Тип солодкості:</span>
                                  <span className="text-emerald-300 font-extrabold text-xs uppercase tracking-wide">{item.sweetness}</span>
                                </div>
                              )}
                            </div>

                            {item.producer && (
                              <div className="bg-emerald-950/10 border border-emerald-900/10 p-3.5 rounded-xl space-y-2">
                                <span className="text-slate-400 uppercase font-extrabold text-[9px] tracking-wider block border-b border-white/5 pb-1">
                                  🏰 Інформація про виробника:
                                </span>
                                <div className="space-y-1.5 text-xs leading-normal">
                                  <p className="text-slate-300"><strong className="text-emerald-400 font-bold">Чим особливі:</strong> {item.producer.uniqueness}</p>
                                  <p className="text-slate-300"><strong className="text-emerald-400 font-bold">Де потужності:</strong> {item.producer.facilities}</p>
                                  <p className="text-slate-300"><strong className="text-emerald-400 font-bold">Звідки сировина:</strong> {item.producer.rawMaterials}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Tasting Profile Custom Bar/Dots Chart */}
                        {item.profile && (
                          <div>
                            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1">
                              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                              Смаковий профіль (Теруар)
                            </h4>
                            <div className="grid grid-cols-2 gap-3 bg-white/5 p-3 rounded-xl border border-white/5">
                              {item.profile.labels.map((label, index) => {
                                const val = item.profile?.values[index] || 1;
                                return (
                                  <div key={label} className="space-y-1">
                                    <div className="flex justify-between text-xs font-semibold text-slate-300">
                                      <span>{label}</span>
                                      <span className="text-amber-400 font-mono">{val}/3</span>
                                    </div>
                                    <div className="flex gap-1.5 h-2">
                                      {[1, 2, 3].map((dot) => (
                                        <div
                                          key={dot}
                                          className={`flex-1 rounded-sm transition-colors duration-300 ${
                                            dot <= val
                                              ? 'bg-gradient-to-r from-emerald-500 to-amber-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
                                              : 'bg-white/10'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Interactive Food Pairing Section */}
                        {item.pairing && (
                          <div className="bg-purple-500/5 border border-purple-500/10 p-3 rounded-xl space-y-2">
                            <div className="flex items-start gap-2.5 text-slate-200 text-xs font-semibold">
                              <GlassWater className="w-4.5 h-4.5 text-purple-400 shrink-0 mt-0.5 animate-pulse" />
                              <div className="space-y-0.5 flex-1">
                                <span className="text-purple-300 uppercase font-black text-[9px] tracking-wider block">Ідеальна гастро-пара:</span>
                                <span className="leading-normal block">{highlightText(item.pairing, searchQuery)}</span>
                              </div>
                            </div>
                            
                            {/* Smart pairing button jump */}
                            <div className="pt-1">
                              <button
                                onClick={() => handlePairingJump(item.pairing!)}
                                className="bg-purple-600/10 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                              >
                                <span>Знайти цю позицію в меню 🔍</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Interesting Fact */}
                        {item.interestingFact && (
                          <div className="flex items-start gap-2.5 bg-emerald-500/5 border border-emerald-500/10 p-2.5 rounded-lg text-slate-300 text-xs font-semibold">
                            <Lightbulb className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <div>
                              <span className="text-emerald-400 uppercase font-extrabold text-[9px] tracking-wider block">Цікавий факт / Секрет шефа:</span>
                              <span>{highlightText(item.interestingFact, searchQuery)}</span>
                            </div>
                          </div>
                        )}

                        {/* Allergens warning */}
                        {item.allergens && item.allergens.length > 0 && (
                          <div>
                            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block mb-1.5">Увага! Містить алергени:</span>
                            <div className="flex flex-wrap gap-1.5">
                              {item.allergens.map((alg) => {
                                const b = getAllergenBadge(alg);
                                return (
                                  <span
                                    key={alg}
                                    className={`text-[10px] font-bold border px-2.5 py-0.5 rounded-full ${b.color}`}
                                  >
                                    {b.label}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Modal A: Steak Doneness Guide */}
      {showSteakGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#112417] border border-[#2e593c] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-[#22442b] flex justify-between items-center bg-[#0d1c11]">
              <div className="flex items-center gap-2">
                <Utensils className="w-5 h-5 text-[#d4af37]" />
                <h3 className="text-lg font-extrabold text-white">Гід по ступенях просмажування стейків 🥩</h3>
              </div>
              <button
                onClick={() => setShowSteakGuide(false)}
                className="text-gray-400 hover:text-white bg-[#193220] p-1.5 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                * Важливо: у меню ЛІС всі м'ясні позиції гриль (крім половини курчати) продаються за вагою (ціна за 100 г сирого продукту). Використовуйте цю шпаргалку для консультування гостей.
              </p>
              
              <div className="space-y-3">
                {steakDonenessGuide.map((g) => (
                  <div key={g.level} className="bg-[#0b170f] border border-[#1b3422] rounded-xl p-3.5 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-[#d4af37] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                        {g.level}
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">{g.temp}</span>
                    </div>
                    <p className="text-xs text-gray-200 leading-relaxed font-semibold">
                      <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block">Опис:</span>
                      {g.desc}
                    </p>
                    <p className="text-xs text-amber-200/90 italic">
                      <span className="text-gray-400 font-bold uppercase text-[9px] tracking-wider block mt-1">Кому радити:</span>
                      {g.recommend}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-4 border-t border-[#22442b] flex justify-end bg-[#0d1c11]">
              <button
                onClick={() => setShowSteakGuide(false)}
                className="bg-[#2e593c] hover:bg-[#3d754f] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
              >
                Зрозуміло
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal B: Interactive Beverage Advisor / Cocktail Picker */}
      {showSummaryTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0b1021] border border-cyan-500/20 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Інтерактивний Помічник Бармена 🍹</h3>
              </div>
              <button
                onClick={() => setShowSummaryTable(false)}
                className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 space-y-5">
              <p className="text-xs text-slate-400 leading-normal">
                Допоможе миттєво підібрати коктейль чи міцний напій під конкретне побажання гостя безпосередньо в залі ресторану! Оберіть основу та смаковий профіль.
              </p>

              {/* Base Spirit Selectors */}
              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                  🥃 Крок 1: Оберіть алкогольну основу гостя:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'джин', label: 'Джин (Gin)' },
                    { id: 'ром', label: 'Ром (Rum)' },
                    { id: 'текіла', label: 'Текіла / Мескаль' },
                    { id: 'віскі', label: 'Віскі / Бурбон' },
                    { id: 'горілка', label: 'Горілка' },
                    { id: 'вино', label: 'Вино / Вермут / Ігристе' },
                    { id: 'безалкогольний', label: 'Безалкогольні (Б/А)' }
                  ].map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setAdvisorBase(advisorBase === b.id ? null : b.id)}
                      className={`text-xs px-3 py-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                        advisorBase === b.id
                          ? 'bg-cyan-500 text-[#0a0f1e] border-cyan-400 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Taste Profile Selectors */}
              <div className="space-y-2">
                <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                  🍋 Крок 2: Оберіть смаковий характер:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'кислий', label: 'Кислий / Свіжий' },
                    { id: 'солодкий', label: 'Солодкий / Десертний' },
                    { id: 'гіркий', label: 'Гіркий / Трав\'яний' },
                    { id: 'міцний', label: 'Міцний' },
                    { id: 'легкий', label: 'Легкий / Освіжаючий' },
                    { id: 'фруктовий', label: 'Фрукти / Ягоди' },
                    { id: 'несолодкий', label: 'Несолодкий / Сухий' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setAdvisorTaste(advisorTaste === t.id ? null : t.id)}
                      className={`text-xs px-3 py-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                        advisorTaste === t.id
                          ? 'bg-purple-600 text-white border-purple-500 font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matches List */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h4 className="text-xs font-black uppercase text-cyan-400 tracking-wider">
                    Рекомендовані збіги у меню ({advisorRecommendations.length}):
                  </h4>
                  {(advisorBase || advisorTaste) && (
                    <button
                      onClick={() => { setAdvisorBase(null); setAdvisorTaste(null); }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 underline"
                    >
                      Скинути фільтри ✕
                    </button>
                  )}
                </div>

                {advisorRecommendations.length === 0 ? (
                  <div className="text-center py-10 border border-white/10 bg-white/5 rounded-2xl p-4">
                    <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-xs text-slate-400 leading-normal">
                      {(advisorBase || advisorTaste) 
                        ? 'Не знайдено точних збігів у меню для цієї комбінації. Спробуйте змінити критерії.' 
                        : 'Оберіть фільтри основи та смаку вище, щоб миттєво підібрати ідеальний напій.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto no-scrollbar pr-1">
                    {advisorRecommendations.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-white/5 border border-white/10 hover:border-cyan-500/30 p-3.5 rounded-xl space-y-2 transition duration-200"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-wider bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 px-1.5 py-0.5 rounded">
                              {item.subcategory}
                            </span>
                            <h5 className="font-extrabold text-white text-xs mt-1">{item.title}</h5>
                          </div>
                          <span className="text-[9px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded uppercase">
                            {item.id}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-normal">
                          <span className="text-slate-500 font-bold text-[9px] uppercase">Склад:</span> {item.ingredients}
                        </p>

                        <div className="bg-cyan-950/20 border-l-2 border-cyan-400 p-2 rounded-r">
                          <p className="text-[11px] italic font-semibold text-cyan-200/95 leading-normal">
                            💬 «{item.sales}»
                          </p>
                        </div>

                        {item.pairing && (
                          <p className="text-[10px] text-purple-300 font-bold flex items-center gap-1">
                            <span>🍷</span>
                            <span>Пара: {item.pairing}</span>
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 flex justify-end bg-white/5">
              <button
                onClick={() => setShowSummaryTable(false)}
                className="bg-cyan-500 hover:bg-cyan-400 text-[#0a0f1e] font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal B-2: Dedicated Wine Advisor & Sparring Arena */}
      {showWineAdvisor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-[#0b1021] border border-emerald-500/20 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5 shrink-0">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="text-lg font-black text-white uppercase tracking-wider">Винна Резиденція ЛІС 🍷</h3>
              </div>
              <button
                onClick={() => setShowWineAdvisor(false)}
                className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-full transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Navigation Tabs inside Modal */}
            <div className="bg-black/35 border-b border-white/5 px-5 py-2.5 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
              {[
                { id: 'picker', label: '🍇 Підбір за смаком', desc: 'Фільтрування за типом та профілем' },
                { id: 'sparring', label: '⚔️ Винний спаринг', desc: 'Порівняння двох позицій' },
                { id: 'finalists', label: '👑 Фіналісти Топ-3', desc: 'Найкращі релізи сезону' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setWineAdvisorTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer text-left border ${
                    wineAdvisorTab === tab.id
                      ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <div className="font-extrabold">{tab.label}</div>
                </button>
              ))}
            </div>

            <div className="p-5 overflow-y-auto space-y-6">

              {/* TAB 1: PICKER */}
              {wineAdvisorTab === 'picker' && (
                <div className="space-y-5">
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 leading-normal">
                    💡 <strong>Інтерактивний сомельє:</strong> Допомагає підібрати ідеальне українське вино під побажання гостя. Оберіть колір, тип солодкості та бажану характеристику смаку!
                  </div>

                  {/* 1. Wine Color Filter */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">🎨 Крок 1: Колір чи тип вина:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'ігристе', label: '🥂 Ігристі & Пет-Нати' },
                        { id: 'біле', label: '🤍 Білі вина' },
                        { id: 'рожеве', label: '🧡 Рожеві & Оранжеві' },
                        { id: 'червоне', label: '❤️ Червоні вина' }
                      ].map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setWineAdvisorColor(wineAdvisorColor === c.id ? null : c.id)}
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                            wineAdvisorColor === c.id
                              ? 'bg-emerald-500 text-[#0a0f1e] border-emerald-400 font-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Sweetness Filter */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">🍭 Крок 2: Бажана солодкість:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'сухе', label: 'Сухе' },
                        { id: 'напівсухе', label: 'Напівсухе' },
                        { id: 'напівсолодке', label: 'Напівсолодке' }
                      ].map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setWineAdvisorSweetness(wineAdvisorSweetness === s.id ? null : s.id)}
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                            wineAdvisorSweetness === s.id
                              ? 'bg-emerald-500 text-[#0a0f1e] border-emerald-400 font-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Taste Profile Filter */}
                  <div className="space-y-2">
                    <span className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">👅 Крок 3: Смаковий акцент (Теруарний характер):</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'кисле', label: '🍋 Висока кислотність' },
                        { id: 'солодке', label: '🍯 Виражена солодкість' },
                        { id: 'танінне', label: '🪵 Оксамитові таніни' },
                        { id: 'повнотіле', label: '🍇 Важке / Повнотіле' },
                        { id: 'легке', label: '🌱 Легке / Освіжаюче' }
                      ].map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setWineAdvisorProfile(wineAdvisorProfile === p.id ? null : p.id)}
                          className={`text-xs px-3.5 py-2 rounded-xl border transition-all duration-150 cursor-pointer ${
                            wineAdvisorProfile === p.id
                              ? 'bg-purple-600 text-white border-purple-500 font-black shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filter Button */}
                  {(wineAdvisorColor || wineAdvisorSweetness || wineAdvisorProfile) && (
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          setWineAdvisorColor(null);
                          setWineAdvisorSweetness(null);
                          setWineAdvisorProfile(null);
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 px-3 py-1.5 rounded-lg transition"
                      >
                        Скинути всі фільтри вина ✕
                      </button>
                    </div>
                  )}

                  {/* Recommendations Results list */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider border-b border-white/10 pb-2 flex justify-between items-center">
                      <span>Знайдено вин за критеріями ({wineAdvisorRecommendations.length}):</span>
                    </h4>

                    {wineAdvisorRecommendations.length === 0 ? (
                      <div className="text-center py-12 border border-white/10 bg-white/5 rounded-2xl p-6">
                        <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 leading-normal max-w-md mx-auto">
                          {(wineAdvisorColor || wineAdvisorSweetness || wineAdvisorProfile)
                            ? 'Не знайдено точних збігів у карті вин під дану комбінацію фільтрів. Спробуйте змінити критерії чи скинути фільтри.'
                            : 'Оберіть фільтри кольору, солодкості або профілю вище, щоб миттєво відфільтрувати карту вин!'}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto no-scrollbar pr-1">
                        {wineAdvisorRecommendations.map((item) => {
                          const isExpanded = advisorExpandedItem === item.id;
                          return (
                            <div
                              key={item.id}
                              onClick={() => setAdvisorExpandedItem(isExpanded ? null : item.id)}
                              className={`bg-[#0d1527] border ${isExpanded ? 'border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-white/10 hover:border-emerald-500/30'} p-4 rounded-2xl space-y-3 transition duration-200 cursor-pointer`}
                            >
                              {/* Header part */}
                              <div className="flex justify-between items-start gap-2">
                                <div>
                                  <div className="flex flex-wrap gap-1 items-center">
                                    <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 px-1.5 py-0.5 rounded">
                                      {item.subcategory}
                                    </span>
                                    {getWineTags(item).map((tag, idx) => (
                                      <span key={idx} className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border ${tag.colorClass}`}>
                                        {tag.label}
                                      </span>
                                    ))}
                                    {item.isBestseller && (
                                      <span className="text-[8px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-400/20 text-amber-400 px-1 py-0.5 rounded flex items-center gap-0.5">
                                        🏆 Топ-Ходове
                                      </span>
                                    )}
                                    {item.isFinalist && (
                                      <span className="text-[8px] font-black uppercase tracking-wider bg-purple-500/10 border border-purple-400/20 text-purple-300 px-1 py-0.5 rounded flex items-center gap-0.5">
                                        👑 Топ-3
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="font-extrabold text-white text-xs mt-1.5">{item.title}</h5>
                                  <p className="text-[10px] text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                                    <span className="opacity-70 text-slate-400">⚓ Якір:</span>
                                    <span>{item.anchor}</span>
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                  <span className="text-[8px] font-mono text-slate-500 bg-white/5 px-1.5 py-0.5 rounded uppercase">
                                    {item.id}
                                  </span>
                                  <span className="text-[10px] text-emerald-400 font-bold">
                                    {isExpanded ? '▲ Згорнути' : '▼ Детальніше'}
                                  </span>
                                </div>
                              </div>

                              {/* Base info summary (always visible) */}
                              <div className="grid grid-cols-2 gap-2 text-[10px] bg-black/25 p-2.5 rounded-xl border border-white/5">
                                <div>
                                  <span className="text-slate-400 block uppercase font-bold text-[8px]">🍇 Сорт винограду:</span>
                                  <span className="text-slate-200 font-medium">{item.grapeVarieties || 'Не вказано'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block uppercase font-bold text-[8px]">🍭 Солодкість:</span>
                                  <span className="text-cyan-300 font-black uppercase">{item.sweetness || 'Не вказано'}</span>
                                </div>
                              </div>

                              {/* Always show small preview of sales phrase */}
                              {!isExpanded && (
                                <p className="text-[10px] text-slate-300 bg-emerald-500/5 p-2.5 rounded-lg leading-normal italic line-clamp-2">
                                  💬 «{item.sales}»
                                </p>
                              )}

                              {/* Reusable detail section identical to main menu card */}
                              <div
                                className="transition-all duration-300 ease-in-out border-t border-white/5 overflow-hidden"
                                style={{
                                  maxHeight: isExpanded ? '1000px' : '0px',
                                  opacity: isExpanded ? 1 : 0,
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="pt-3 space-y-3.5 text-xs">
                                  {/* Description */}
                                  <div className="space-y-1">
                                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Склад / Опис:</span>
                                    <p className="text-slate-200 font-medium leading-relaxed bg-black/15 p-2.5 rounded-lg border border-white/5">
                                      {item.ingredients}
                                    </p>
                                  </div>

                                  {/* Selling Phrase */}
                                  <div className="space-y-1">
                                    <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-wider block">Козир продажу:</span>
                                    <div className="bg-cyan-500/5 border-l-4 border-cyan-400 p-2.5 rounded-r-xl rounded-l-sm">
                                      <p className="text-slate-200 italic font-semibold leading-normal">
                                        💬 «{item.sales}»
                                      </p>
                                    </div>
                                  </div>

                                  {/* Producer details */}
                                  {item.producer && (
                                    <div className="bg-black/15 border border-white/5 p-3 rounded-xl space-y-1.5">
                                      <span className="text-slate-400 uppercase font-extrabold text-[8px] tracking-wider block border-b border-white/5 pb-1">
                                        🏰 Інформація про виробника:
                                      </span>
                                      <div className="space-y-1 text-[11px] leading-normal">
                                        <p className="text-slate-300"><strong className="text-cyan-400 font-bold">Особливість:</strong> {item.producer.uniqueness}</p>
                                        <p className="text-slate-300"><strong className="text-cyan-400 font-bold">Де виробляють:</strong> {item.producer.facilities}</p>
                                        <p className="text-slate-300"><strong className="text-cyan-400 font-bold">Сировина:</strong> {item.producer.rawMaterials}</p>
                                      </div>
                                    </div>
                                  )}

                                  {/* Tasting Profile (Custom Bar dots Chart) */}
                                  {item.profile && (
                                    <div className="space-y-1.5">
                                      <span className="text-[8px] uppercase font-bold text-slate-400 tracking-wider block">Смаковий профіль (Теруар):</span>
                                      <div className="grid grid-cols-2 gap-2.5 bg-black/15 p-2.5 rounded-xl border border-white/5">
                                        {item.profile.labels.map((label, index) => {
                                          const val = item.profile?.values[index] || 1;
                                          return (
                                            <div key={label} className="space-y-1">
                                              <div className="flex justify-between text-[10px] font-semibold text-slate-300">
                                                <span>{label}</span>
                                                <span className="text-cyan-400 font-mono">{val}/3</span>
                                              </div>
                                              <div className="flex gap-1 h-1.5">
                                                {[1, 2, 3].map((dot) => (
                                                  <div
                                                    key={dot}
                                                    className={`flex-1 rounded-sm transition-colors duration-300 ${
                                                      dot <= val
                                                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_6px_rgba(34,211,238,0.4)]'
                                                        : 'bg-white/10'
                                                    }`}
                                                  />
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Food Pairing */}
                                  {item.pairing && (
                                    <div className="bg-purple-500/5 border border-purple-500/10 p-2.5 rounded-xl space-y-2">
                                      <div className="flex items-start gap-2 text-slate-200 text-xs font-semibold">
                                        <div className="space-y-0.5 flex-1">
                                          <span className="text-purple-300 uppercase font-black text-[8px] tracking-wider block">Ідеальна гастро-пара:</span>
                                          <span className="leading-normal block text-[11px]">{item.pairing}</span>
                                        </div>
                                      </div>
                                      
                                      <div className="pt-0.5">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handlePairingJump(item.pairing!);
                                          }}
                                          className="bg-purple-600/10 hover:bg-purple-600/30 text-purple-300 border border-purple-500/20 hover:border-purple-500/40 text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer w-full justify-center"
                                        >
                                          <span>Знайти цю позицію в меню 🔍</span>
                                        </button>
                                      </div>
                                    </div>
                                  )}

                                  {/* Interesting Fact */}
                                  {item.interestingFact && (
                                    <div className="p-2.5 bg-cyan-500/5 border border-cyan-500/10 rounded-lg text-slate-300 text-[11px] font-medium leading-relaxed italic">
                                      💡 <strong>Секрет сомельє:</strong> {item.interestingFact}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: SPARRING */}
              {wineAdvisorTab === 'sparring' && (
                <div className="space-y-5 animate-fade-in">
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 leading-normal">
                    ⚔️ <strong>Винна Арена Спарингу:</strong> Оберіть два вина для прямого лобового порівняння! Ми миттєво зіставимо їх смакові профілі, сорти винограду, теруар виробників та визначимо особливості кожного.
                  </div>

                  {/* Selector slots */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Wine A Slot */}
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                      <label className="block text-[10px] font-black uppercase text-emerald-400 tracking-wider">🟥 Оберіть перше вино (Вино А):</label>
                      <select
                        value={sparringWineAId}
                        onChange={(e) => setSparringWineAId(e.target.value)}
                        className="w-full bg-[#070b14] border border-white/15 hover:border-emerald-500/30 text-xs text-slate-200 p-2.5 rounded-xl outline-none"
                      >
                        <option value="">-- Оберіть вино А --</option>
                        {menuItems.filter(item => item.category === 'Вино').map(wine => (
                          <option key={wine.id} value={wine.id}>{wine.subcategory} — {wine.title}</option>
                        ))}
                      </select>
                    </div>

                    {/* Wine B Slot */}
                    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-2">
                      <label className="block text-[10px] font-black uppercase text-purple-400 tracking-wider">🟦 Оберіть друге вино (Вино В):</label>
                      <select
                        value={sparringWineBId}
                        onChange={(e) => setSparringWineBId(e.target.value)}
                        className="w-full bg-[#070b14] border border-white/15 hover:border-purple-500/30 text-xs text-slate-200 p-2.5 rounded-xl outline-none"
                      >
                        <option value="">-- Оберіть вино В --</option>
                        {menuItems.filter(item => item.category === 'Вино').map(wine => (
                          <option key={wine.id} value={wine.id}>{wine.subcategory} — {wine.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Direct comparison rendering */}
                  {(() => {
                    const wineA = menuItems.find(item => item.id === sparringWineAId);
                    const wineB = menuItems.find(item => item.id === sparringWineBId);

                    if (!wineA || !wineB) {
                      return (
                        <div className="text-center py-14 border border-white/10 bg-white/5 rounded-2xl p-6">
                          <SlidersHorizontal className="w-10 h-10 text-slate-600 mx-auto mb-2 animate-bounce" />
                          <h5 className="text-sm font-bold text-slate-300">Очікуємо вибору бійців!</h5>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-normal">
                            Оберіть два вина у полях вище, щоб відкрити інтерактивну панель порівняння та розпочати спаринг.
                          </p>
                        </div>
                      );
                    }

                    // Profiles parsing helper
                    const getProfileVal = (item: MenuItem, label: string) => {
                      const idx = item.profile?.labels.indexOf(label) ?? -1;
                      return idx !== -1 ? item.profile?.values[idx] || 1 : 1;
                    };

                    const characteristics = ['Кислотність', 'Солодкість', 'Танінність', 'Важкість/Тіло'];

                    return (
                      <div className="space-y-4 border border-emerald-500/20 bg-emerald-950/10 rounded-2xl p-4 sm:p-5 animate-scale-up">
                        <div className="text-center">
                          <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                            ⚡ БАТТЛ-АНАЛІТИКА ЛІС ⚡
                          </span>
                        </div>

                        {/* Title Matchup */}
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center border-b border-white/10 pb-4 text-center sm:text-left">
                          <div className="sm:col-span-2 bg-[#121c32] p-3 rounded-xl border border-emerald-500/20 space-y-1">
                            <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Червоний Кут (Вино А)</span>
                            <h5 className="font-bold text-white text-sm leading-tight">{wineA.title}</h5>
                            <span className="text-[9px] font-semibold text-emerald-300 uppercase block">{wineA.subcategory}</span>
                          </div>
                          <div className="text-center font-black text-slate-400 text-lg">VS</div>
                          <div className="sm:col-span-2 bg-[#1b122c] p-3 rounded-xl border border-purple-500/20 space-y-1 sm:text-right">
                            <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider">Синій Кут (Вино В)</span>
                            <h5 className="font-bold text-white text-sm leading-tight">{wineB.title}</h5>
                            <span className="text-[9px] font-semibold text-purple-300 uppercase block">{wineB.subcategory}</span>
                          </div>
                        </div>

                        {/* Technical Comparison Grid */}
                        <div className="space-y-3">
                          <h6 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">📋 Основні Характеристики:</h6>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            
                            {/* Grapes */}
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-2">
                              <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">🍇 Сорти винограду</span>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="border-r border-white/5 pr-2">
                                  <span className="text-[8px] text-emerald-400 block">Вино А:</span>
                                  <span className="text-white font-bold leading-normal">{wineA.grapeVarieties || 'Не вказано'}</span>
                                </div>
                                <div className="pl-1">
                                  <span className="text-[8px] text-purple-400 block">Вино В:</span>
                                  <span className="text-white font-bold leading-normal">{wineB.grapeVarieties || 'Не вказано'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Sweetness type */}
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-2">
                              <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">🍭 Тип солодкості</span>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="border-r border-white/5 pr-2">
                                  <span className="text-[8px] text-emerald-400 block">Вино А:</span>
                                  <span className="text-emerald-300 font-extrabold uppercase text-[10px]">{wineA.sweetness || 'Не вказано'}</span>
                                </div>
                                <div className="pl-1">
                                  <span className="text-[8px] text-purple-400 block">Вино В:</span>
                                  <span className="text-purple-300 font-extrabold uppercase text-[10px]">{wineB.sweetness || 'Не вказано'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Statuses */}
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-2">
                              <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">🎖️ Спеціальні статуси</span>
                              <div className="grid grid-cols-2 gap-2 text-[10px]">
                                <div className="border-r border-white/5 pr-2 space-y-1">
                                  {wineA.isBestseller && <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-1 py-0.5 rounded font-bold block text-center">🏆 Бестселер</span>}
                                  {wineA.isFinalist && <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-1 py-0.5 rounded font-bold block text-center">👑 Фіналіст</span>}
                                  {!wineA.isBestseller && !wineA.isFinalist && <span className="text-slate-500 italic block text-center">Класика</span>}
                                </div>
                                <div className="pl-1 space-y-1">
                                  {wineB.isBestseller && <span className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-1 py-0.5 rounded font-bold block text-center">🏆  Бестселер</span>}
                                  {wineB.isFinalist && <span className="bg-purple-500/10 border border-purple-500/30 text-purple-300 px-1 py-0.5 rounded font-bold block text-center">👑 Фіналіст</span>}
                                  {!wineB.isBestseller && !wineB.isFinalist && <span className="text-slate-500 italic block text-center">Класика</span>}
                                </div>
                              </div>
                            </div>

                          </div>
                        </div>

                        {/* Interactive Profiling Comparison */}
                        <div className="space-y-3 bg-black/35 p-4 rounded-xl border border-white/5">
                          <h6 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">🔬 Смакові шкали (Теруарний баланс):</h6>
                          <div className="space-y-3.5">
                            {characteristics.map(char => {
                              const valA = getProfileVal(wineA, char);
                              const valB = getProfileVal(wineB, char);
                              return (
                                <div key={char} className="space-y-1">
                                  <div className="flex justify-between items-center text-xs text-slate-300 font-bold">
                                    <span className="text-emerald-400 font-mono text-[10px] bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/10">А: {valA}/3</span>
                                    <span className="uppercase text-[9px] tracking-widest text-slate-400 font-black">{char}</span>
                                    <span className="text-purple-400 font-mono text-[10px] bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-500/10">В: {valB}/3</span>
                                  </div>

                                  <div className="flex gap-2 items-center">
                                    {/* Wine A bar (pointing left / styled right to left) */}
                                    <div className="flex-1 flex gap-1 h-2 justify-end">
                                      {[1, 2, 3].map(dot => (
                                        <div
                                          key={dot}
                                          className={`w-1/3 rounded-sm transition-all duration-300 ${
                                            dot <= valA ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]' : 'bg-white/5'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                                    {/* Wine B bar */}
                                    <div className="flex-1 flex gap-1 h-2">
                                      {[1, 2, 3].map(dot => (
                                        <div
                                          key={dot}
                                          className={`w-1/3 rounded-sm transition-all duration-300 ${
                                            dot <= valB ? 'bg-purple-600 shadow-[0_0_6px_rgba(147,51,234,0.3)]' : 'bg-white/5'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Producer Comparison */}
                        <div className="space-y-3">
                          <h6 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">🏰 Теруар та Виробники:</h6>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed">
                            <div className="bg-emerald-950/10 border border-emerald-500/10 p-3.5 rounded-xl space-y-1.5">
                              <span className="text-[9px] font-black uppercase text-emerald-400 block border-b border-white/5 pb-1">Виробник Вина А:</span>
                              {wineA.producer ? (
                                <>
                                  <p className="text-slate-300"><strong className="text-emerald-400 font-bold">Особливість:</strong> {wineA.producer.uniqueness}</p>
                                  <p className="text-slate-300"><strong className="text-emerald-400 font-bold">Потужності:</strong> {wineA.producer.facilities}</p>
                                  <p className="text-slate-300"><strong className="text-emerald-400 font-bold">Сировина:</strong> {wineA.producer.rawMaterials}</p>
                                </>
                              ) : (
                                <p className="text-slate-500 italic">Специфікації виробника відсутні</p>
                              )}
                            </div>
                            <div className="bg-purple-950/10 border border-purple-500/10 p-3.5 rounded-xl space-y-1.5">
                              <span className="text-[9px] font-black uppercase text-purple-400 block border-b border-white/5 pb-1">Виробник Вина В:</span>
                              {wineB.producer ? (
                                <>
                                  <p className="text-slate-300"><strong className="text-purple-400 font-bold">Особливість:</strong> {wineB.producer.uniqueness}</p>
                                  <p className="text-slate-300"><strong className="text-purple-400 font-bold">Потужності:</strong> {wineB.producer.facilities}</p>
                                  <p className="text-slate-300"><strong className="text-purple-400 font-bold">Сировина:</strong> {wineB.producer.rawMaterials}</p>
                                </>
                              ) : (
                                <p className="text-slate-500 italic">Специфікації виробника відсутні</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Verdict / Anchor comparison */}
                        <div className="bg-[#121829] border border-cyan-500/10 rounded-xl p-3.5 space-y-1">
                          <span className="text-[9px] font-black uppercase text-cyan-400 tracking-wider block">🗣️ КОЗИРНА РЕКОМЕНДАЦІЯ СЛУЖБИ ЛІС:</span>
                          <div className="text-xs text-slate-300 leading-normal space-y-1.5">
                            <p>
                              👉 <strong>{wineA.title}</strong> краще всього презентувати фразу: <span className="italic font-bold text-slate-100">«{wineA.sales}»</span>. Його головний якір — <strong className="text-emerald-400 font-bold">{wineA.anchor}</strong>.
                            </p>
                            <p>
                              👉 <strong>{wineB.title}</strong> ідеально продається через: <span className="italic font-bold text-slate-100">«{wineB.sales}»</span>. Його опорний якір — <strong className="text-purple-400 font-bold">{wineB.anchor}</strong>.
                            </p>
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 3: FINALISTS GRID */}
              {wineAdvisorTab === 'finalists' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs text-emerald-300 leading-normal">
                    👑 <strong>Зал Слави (Топ-3 Фіналісти спарингу):</strong> У кожній категорії вин ми провели ретельний професійний спаринг та обрали трійку абсолютних лідерів-фіналістів, що представляють кращі зразки українського виноробства!
                  </div>

                  {/* Render Categories with top-3 finalists side-by-side */}
                  {['Ігристі та Пет-Нати', 'Білі вина', 'Рожеві та Оранжеві вина', 'Червоні вина'].map((categoryName) => {
                    const finalistsInCategory = menuItems.filter(item => item.subcategory === categoryName && item.isFinalist === true);
                    return (
                      <div key={categoryName} className="space-y-3">
                        <h5 className="text-xs font-black text-slate-200 uppercase tracking-widest border-l-4 border-emerald-500 pl-2.5 flex items-center justify-between">
                          <span>{categoryName}</span>
                          <span className="text-[10px] text-emerald-400 font-bold font-mono">Фіналісти 👑</span>
                        </h5>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {finalistsInCategory.map((item) => (
                            <div
                              key={item.id}
                              className="bg-white/5 border border-emerald-500/20 p-4 rounded-2xl flex flex-col justify-between space-y-3 relative overflow-hidden"
                            >
                              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
                              <div className="space-y-2">
                                <div className="flex flex-wrap justify-between items-start gap-1.5">
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded font-black uppercase">
                                      Топ-3 Фіналіст
                                    </span>
                                    {getWineTags(item).map((tag, idx) => (
                                      <span key={idx} className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border ${tag.colorClass}`}>
                                        {tag.label}
                                      </span>
                                    ))}
                                  </div>
                                  <span className="text-xs">⭐</span>
                                </div>
                                <h6 className="font-extrabold text-white text-xs leading-snug">{item.title}</h6>
                                <p className="text-[10px] text-emerald-400 font-bold italic">⚓ Якір: {item.anchor}</p>
                                
                                <div className="space-y-1 pt-1 border-t border-white/5 text-[10px] leading-relaxed text-slate-300">
                                  <p>🍇 <strong>Сорт:</strong> {item.grapeVarieties}</p>
                                  <p>🍭 <strong>Тип солодкості:</strong> <span className="text-cyan-300 uppercase font-bold text-[9px]">{item.sweetness}</span></p>
                                  {item.producer && (
                                    <p className="line-clamp-2">🏰 <strong>Виробник:</strong> {item.producer.uniqueness}</p>
                                  )}
                                </div>
                              </div>

                              <p className="text-[10px] text-[#f1f5f9] italic bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/10 leading-normal">
                                💬 «{item.sales}»
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-white/10 flex justify-end bg-white/5 shrink-0">
              <button
                onClick={() => setShowWineAdvisor(false)}
                className="bg-emerald-500 hover:bg-emerald-400 text-[#0a0f1e] font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              >
                Закрити Винний Клуб
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal C: Detailed Item Card (for Handbook mode) */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0b1021] border border-cyan-500/20 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up">
            <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Детальна Картка Страви / Напою</h3>
              </div>
              <button
                onClick={() => setSelectedDetailItem(null)}
                className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-1.5 rounded-lg transition"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold bg-cyan-500/10 border border-cyan-400/20 text-cyan-300 px-2.5 py-1 rounded-lg">
                    {selectedDetailItem.category}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest font-extrabold bg-purple-500/10 border border-purple-400/20 text-purple-300 px-2.5 py-1 rounded-lg">
                    {selectedDetailItem.subcategory}
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-white/5 border border-white/10 px-2 py-1 rounded-lg text-slate-400 ml-auto">
                    ID: {selectedDetailItem.id.toUpperCase()}
                  </span>
                </div>
                
                <h2 className="text-2xl font-black text-white tracking-tight leading-snug">
                  {selectedDetailItem.title}
                </h2>
                
                <div className="flex items-center gap-1.5 text-cyan-400 text-xs font-bold">
                  <span className="opacity-60 text-slate-400 text-[10px]">⚓ Якір для пам'яті:</span>
                  <span>{selectedDetailItem.anchor}</span>
                </div>
              </div>

              {/* Details Body */}
              <div className="space-y-4">
                {/* Ingredients */}
                <div className="space-y-1">
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Utensils className="w-4 h-4 text-cyan-400" />
                    Складники & Опис техкарти
                  </h4>
                  <p className="text-slate-200 font-medium leading-relaxed bg-white/5 p-3.5 rounded-xl border border-white/5">
                    {selectedDetailItem.ingredients}
                  </p>
                </div>

                {/* Sales pitch phrase */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Фраза для пропозиції гостю (Козир)
                  </h4>
                  <div className="relative bg-cyan-500/5 border-l-4 border-cyan-400 p-4 rounded-r-xl rounded-l-md">
                    <p className="text-[#f1f5f9] italic font-semibold leading-relaxed">
                      💬 «{selectedDetailItem.sales}»
                    </p>
                  </div>
                </div>

                {/* Taste profile */}
                {selectedDetailItem.profile && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1.5">
                      <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                      Характеристики смаку (Профіль)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/5 p-4 rounded-xl border border-white/5">
                      {selectedDetailItem.profile.labels.map((label, index) => {
                        const val = selectedDetailItem.profile?.values[index] || 1;
                        return (
                          <div key={label} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-slate-300">
                              <span>{label}</span>
                              <span className="text-cyan-400 font-mono">{val}/3</span>
                            </div>
                            <div className="flex gap-1.5 h-2">
                              {[1, 2, 3].map((dot) => (
                                <div
                                  key={dot}
                                  className={`flex-1 rounded-sm transition-colors duration-300 ${
                                    dot <= val
                                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_6px_rgba(34,211,238,0.4)]'
                                      : 'bg-white/10'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pairing */}
                {selectedDetailItem.pairing && (
                  <div className="bg-purple-500/5 border border-purple-500/10 p-4 rounded-xl flex items-start gap-3">
                    <GlassWater className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-purple-300 uppercase font-black text-[9px] tracking-wider block">Рекомендована гастро-пара:</span>
                      <span className="text-slate-200 text-xs font-semibold leading-normal">{selectedDetailItem.pairing}</span>
                    </div>
                  </div>
                )}

                {/* Fact */}
                {selectedDetailItem.interestingFact && (
                  <div className="bg-cyan-500/5 border border-cyan-500/10 p-4 rounded-xl flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="text-cyan-400 uppercase font-extrabold text-[9px] tracking-wider block">Цікавий факт про позицію:</span>
                      <span className="text-slate-200 text-xs leading-normal">{selectedDetailItem.interestingFact}</span>
                    </div>
                  </div>
                )}

                {/* Allergens warning */}
                {selectedDetailItem.allergens && selectedDetailItem.allergens.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">Наявність алергенів у страві:</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedDetailItem.allergens.map((alg) => {
                        const b = getAllergenBadge(alg);
                        return (
                          <span
                            key={alg}
                            className={`text-xs font-black border px-3 py-1 rounded-full flex items-center gap-1 ${b.color}`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            {b.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end bg-white/5">
              <button
                onClick={() => setSelectedDetailItem(null)}
                className="bg-cyan-500 hover:bg-cyan-400 text-[#0a0f1e] font-bold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer shadow-[0_0_12px_rgba(6,182,212,0.3)]"
              >
                Закрити картку
              </button>
            </div>
          </div>
        </div>
      )}

            {/* GASTRO-CONSTRUCTOR DYNAMIC HELPER DATA AND DYNAMIC COMPUTATION */}
      {showConstructorModal && (
        <div className="fixed inset-0 bg-[#060814]/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0b1021] border border-cyan-500/20 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden text-slate-100" id="gastro-constructor-modal">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/30 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-black text-white uppercase tracking-wider">Гейміфікований Гастро-Конструктор 🍽️🍷</h3>
              </div>
              
              <button
                onClick={() => {
                  setShowConstructorModal(false);
                  setConstructorDishQuery('');
                  setConstructorDrinkQuery('');
                  setConstructorGarnishQuery('');
                }}
                className="text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition"
              >
                ✕
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="px-6 py-4 bg-black/10 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Режим сомельє:</span>
                <div className="inline-flex rounded-xl bg-black/40 p-1 border border-white/10">
                  <button
                    onClick={() => setGastroMatchMode('dish-first')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      gastroMatchMode === 'dish-first'
                        ? 'bg-cyan-500 text-[#070b19] shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🥩 Підбір напою під страву
                  </button>
                  <button
                    onClick={() => setGastroMatchMode('drink-first')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      gastroMatchMode === 'drink-first'
                        ? 'bg-emerald-500 text-[#070b19] shadow-md'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    🍷 Підбір страви під напій
                  </button>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedGastroDish(null);
                  setSelectedGastroGarnish(null);
                  setSelectedGastroDrink(null);
                }}
                className="text-xs bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold px-3 py-1.5 rounded-xl border border-rose-500/20 transition cursor-pointer"
              >
                Скинути все ✕
              </button>
            </div>

            {/* Three Main Columns (Grid) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Sommelier Guide Tip Banner */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 shrink-0">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Інтерактивний сомельє-асистент</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                      {gastroMatchMode === 'dish-first' 
                        ? "Оберіть страву в першій колонці — ми розрахуємо сумісність і піднімемо найкращі напої вгору. Або деактивуйте вибір для скидання." 
                        : "Оберіть напій з бару в другій колонці — ми розрахуємо сумісність і піднімемо найкращі страви вгору. Або деактивуйте вибір для скидання."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                
                {/* Column 1: Main Dish Choice */}
                <div className={`border rounded-2xl p-4 flex flex-col h-[380px] transition-all duration-300 ${
                  selectedGastroDish 
                    ? 'bg-cyan-500/5 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.05)]' 
                    : (gastroMatchMode === 'drink-first' && selectedGastroDrink !== null)
                      ? 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.1)] animate-pulse'
                      : 'bg-white/5 border-white/10'
                }`}>
                  <div className="mb-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                        <Utensils className="w-4 h-4 text-cyan-400" />
                        1. Головна страва
                      </h4>
                      {selectedGastroDish && (
                        <button
                          onClick={() => {
                            setSelectedGastroDish(null);
                            setSelectedGastroGarnish(null);
                          }}
                          className="text-[9px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-lg transition border border-rose-500/20 cursor-pointer font-bold"
                        >
                          ✕ Деактивувати
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Швидкий пошук страви..."
                      value={constructorDishQuery}
                      onChange={(e) => setConstructorDishQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-cyan-400 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {constructorDishes.map(item => {
                      const isSelected = selectedGastroDish?.id === item.id;
                      const pairingInfo = selectedGastroDrink ? getPairingScore(item, selectedGastroDrink) : null;
                      
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedGastroDish(null);
                              setSelectedGastroGarnish(null);
                            } else {
                              setSelectedGastroDish(item);
                              // Auto-update suggested garnish
                              const title = item.title.toLowerCase();
                              const ing = item.ingredients.toLowerCase();
                              let sug = null;
                              if (title.includes('щічк') || ing.includes('пюре')) {
                                sug = menuItems.find(g => g.title.toLowerCase().includes('картопляне пюре')) || null;
                              } else if (title.includes('сом') || title.includes('форел') || title.includes('риба') || ing.includes('овоч')) {
                                sug = menuItems.find(g => g.title.toLowerCase().includes('овочі')) || null;
                              } else if (title.includes('ребер') || title.includes('кур') || title.includes('каре') || title.includes('шашлик')) {
                                sug = menuItems.find(g => g.title.toLowerCase().includes('картопля з розмарином') || g.title.toLowerCase().includes('кукурудза')) || null;
                              } else {
                                sug = menuItems.find(g => g.subcategory === 'Гарніри') || null;
                              }
                              setSelectedGastroGarnish(sug);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                            isSelected 
                              ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.15)] text-white' 
                              : 'bg-black/20 border-white/5 hover:border-white/10 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[9px] uppercase font-bold text-cyan-400 tracking-wider">
                              {item.subcategory}
                            </span>
                            <div className="flex items-center gap-1">
                              {gastroMatchMode === 'drink-first' && selectedGastroDrink && pairingInfo && (
                                <span className="text-[9px] font-bold font-mono text-cyan-300 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/10">
                                  Сумісність {pairingInfo.score}%
                                </span>
                              )}
                              {isSelected && <span className="text-xs">🟢</span>}
                            </div>
                          </div>
                          <h5 className="text-xs font-bold mt-1 leading-snug">{item.title}</h5>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">⚓ {item.anchor}</p>
                        </div>
                      );
                    })}
                    {constructorDishes.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-500">Нічого не знайдено</div>
                    )}
                  </div>
                </div>

                {/* Column 2: Beverage Selection (Moved to 2nd place!) */}
                <div className={`border rounded-2xl p-4 flex flex-col h-[380px] transition-all duration-300 ${
                  selectedGastroDrink 
                    ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                    : (gastroMatchMode === 'dish-first' && selectedGastroDish !== null)
                      ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.1)] animate-pulse'
                      : 'bg-white/5 border-white/10'
                }`}>
                  <div className="mb-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                        <GlassWater className="w-4 h-4 text-emerald-400" />
                        2. Напій з бару
                      </h4>
                      {selectedGastroDrink && (
                        <button
                          onClick={() => setSelectedGastroDrink(null)}
                          className="text-[9px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-lg transition border border-rose-500/20 cursor-pointer font-bold"
                        >
                          ✕ Деактивувати
                        </button>
                      )}
                    </div>
                    
                    {/* Beverage categories subtabs */}
                    <div className="grid grid-cols-4 gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
                      {[
                        { key: 'wine', label: 'Вино 🍷' },
                        { key: 'cocktail', label: 'Коктейлі 🍹' },
                        { key: 'bar', label: 'Б/А 🥤' },
                        { key: 'spirit', label: 'Міцні 🥃' }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => {
                            setSelectedGastroDrinkCategory(tab.key);
                            // Auto select first item in new category
                            const firstItem = menuItems.find(item => {
                              if (tab.key === 'wine') return item.category === 'Вино';
                              if (tab.key === 'cocktail') return item.category === 'Коктейлі';
                              if (tab.key === 'bar') return item.category === 'Безалкогольні & Пиво';
                              if (tab.key === 'spirit') return item.category === 'Міцні напої';
                              return false;
                            });
                            setSelectedGastroDrink(firstItem || null);
                          }}
                          className={`py-1 text-[9px] font-bold rounded-lg transition-all ${
                            selectedGastroDrinkCategory === tab.key 
                              ? 'bg-emerald-500 text-slate-900 shadow-md' 
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {tab.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>

                    <input
                      type="text"
                      placeholder="Пошук напою..."
                      value={constructorDrinkQuery}
                      onChange={(e) => setConstructorDrinkQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-emerald-400 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {constructorDrinks.map(item => {
                      const isSelected = selectedGastroDrink?.id === item.id;
                      const pairingInfo = selectedGastroDish ? getPairingScore(selectedGastroDish, item) : null;

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedGastroDrink(null);
                            } else {
                              setSelectedGastroDrink(item);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                            isSelected 
                              ? 'bg-emerald-500/10 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.15)] text-white' 
                              : 'bg-black/20 border-white/5 hover:border-white/10 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase font-bold text-emerald-400 tracking-wider">
                              {item.subcategory}
                            </span>
                            <div className="flex items-center gap-1">
                              {gastroMatchMode === 'dish-first' && selectedGastroDish && pairingInfo && (
                                <span className="text-[9px] font-bold font-mono text-emerald-300 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                  Сумісність {pairingInfo.score}%
                                </span>
                              )}
                              {isSelected && <span className="text-xs">🟢</span>}
                            </div>
                          </div>
                          <h5 className="text-xs font-bold mt-1 leading-snug">{item.title}</h5>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-1 italic">⚓ {item.anchor}</p>
                        </div>
                      );
                    })}
                    {constructorDrinks.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-500">Нічого не знайдено</div>
                    )}
                  </div>
                </div>

                {/* Column 3: Suggested/Custom Garnish (Moved to 3rd place!) */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col h-[380px]">
                  <div className="mb-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                        <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                        3. Спільний супровід
                      </h4>
                      {selectedGastroGarnish && (
                        <button
                          onClick={() => setSelectedGastroGarnish(null)}
                          className="text-[9px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-lg transition border border-rose-500/20 cursor-pointer font-bold"
                        >
                          ✕ Деактивувати
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Шукати салат, суп, гарнір..."
                      value={constructorGarnishQuery}
                      onChange={(e) => setConstructorGarnishQuery(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 focus:border-purple-400 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {/* Option: No Garnish */}
                    <div
                      onClick={() => setSelectedGastroGarnish(null)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                        selectedGastroGarnish === null
                          ? 'bg-purple-500/10 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.15)] text-white' 
                          : 'bg-black/20 border-white/5 hover:border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider">Опція</span>
                        {selectedGastroGarnish === null && <span className="text-xs">🟢</span>}
                      </div>
                      <h5 className="text-xs font-bold mt-1 leading-snug">Без додаткового супроводу</h5>
                      <p className="text-[10px] text-slate-400 mt-1">Подача головної страви та напою в чистому вигляді.</p>
                    </div>

                    {suggestedCompanions.map(({ item, score, reason }) => {
                      const isSelected = selectedGastroGarnish?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedGastroGarnish(isSelected ? null : item)}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                            isSelected 
                              ? 'bg-purple-500/10 border-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.15)] text-white' 
                              : 'bg-black/20 border-white/5 hover:border-white/10 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] uppercase font-bold text-purple-400 tracking-wider">{item.subcategory}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-bold font-mono text-purple-300">Сумісність {score}%</span>
                              {isSelected && <span className="text-xs">🟢</span>}
                            </div>
                          </div>
                          <h5 className="text-xs font-bold mt-1 leading-snug">{item.title}</h5>
                          <p className="text-[9px] text-purple-300 mt-1.5 leading-snug bg-purple-950/20 p-1.5 rounded border border-purple-500/10">💡 {reason}</p>
                        </div>
                      );
                    })}
                    {suggestedCompanions.length === 0 && (
                      <div className="text-center py-8 text-xs text-slate-500">Нічого не знайдено</div>
                    )}
                  </div>
                </div>

              </div>

              {/* BOTTOM BLOCK: SOMMELIER SMART ANALYSIS */}
              <div className="bg-gradient-to-br from-[#0c142c] to-[#120e25] border border-cyan-500/20 rounded-2xl p-6 space-y-6">
                
                {(!selectedGastroDish || !selectedGastroDrink) ? (
                  <div className="text-center py-10">
                    <Sparkles className="w-10 h-10 text-purple-400 mx-auto mb-3 animate-pulse" />
                    <h4 className="text-base font-black text-white uppercase tracking-wider">Очікування повної пари 🍷🍽️</h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
                      {gastroMatchMode === 'dish-first'
                        ? 'Оберіть головну страву з першої колонки та напій з другої колонки, щоб розблокувати повний аналіз сомельє-системи.'
                        : 'Оберіть напій з другої колонки та головну страву з першої колонки, щоб розблокувати повний аналіз сомельє-системи.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* COMPATIBILITY SCALE MOVED HERE */}
                    <div className="bg-gradient-to-r from-cyan-950/40 via-purple-950/40 to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-5 shadow-[0_0_20px_rgba(6,182,212,0.15)] text-center md:text-left animate-fade-in" id="pairing-compatibility-scale">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shrink-0">
                          <Sparkles className="w-6 h-6 text-cyan-400 animate-pulse" />
                        </div>
                        <div>
                          <div className="flex items-center justify-center md:justify-start gap-2">
                            <span className="text-[9px] font-bold bg-cyan-500 text-slate-950 px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-[0_0_10px_rgba(6,182,212,0.3)] animate-pulse">
                              Шкала сумісності сомельє
                            </span>
                          </div>
                          <p className="text-base font-black text-white mt-1.5 uppercase tracking-wide">{computedPairingAnalysis.title}</p>
                        </div>
                      </div>
                      
                      {/* Progress Bar Gauge */}
                      <div className="flex-1 max-w-md w-full px-2">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1 font-bold">
                          <span className="truncate max-w-[280px]">Поєднання: {selectedGastroDish.title} + {selectedGastroDrink.title}</span>
                          <span className="text-cyan-400 font-mono font-black text-xs">{computedPairingAnalysis.score}%</span>
                        </div>
                        <div className="h-3 bg-black/40 rounded-full overflow-hidden border border-white/10 p-0.5">
                          <div 
                            className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-purple-600 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.5)] transition-all duration-1000"
                            style={{ width: `${computedPairingAnalysis.score}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Stars */}
                        <div className="flex gap-1 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span 
                              key={star} 
                              className={`text-base select-none transition-transform duration-300 ${
                                star <= computedPairingAnalysis.stars 
                                  ? 'text-amber-400 scale-110 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]' 
                                  : 'text-white/10'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Active Sommelier Analysis Header */}
                    <div className="pb-4 border-b border-white/5 mb-6">
                      <span className="text-[10px] font-bold bg-purple-500 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        Детальний профіль поєднання
                      </span>
                      <h4 className="text-lg font-black text-white mt-1">
                        Аналіз взаємодії: {selectedGastroDish.title} + {selectedGastroDrink.title}
                      </h4>
                    </div>

                    {/* Breakdown details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <h5 className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                            <Info className="w-3.5 h-3.5" />
                            Фізика взаємодії смаків (Аналіз)
                          </h5>
                          <p className="text-xs text-slate-200 leading-relaxed bg-black/40 border border-white/5 p-4 rounded-xl">
                            {computedPairingAnalysis.description}
                          </p>
                        </div>

                        {/* Flavor sliders */}
                        <div className="bg-black/20 border border-white/5 p-4 rounded-xl space-y-3.5">
                          <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Баланс смакових вимірів у парі
                          </h5>
                          <div className="space-y-2.5">
                            {[
                              { label: 'Солодкість', value: computedPairingAnalysis.profileMatches.sweetness, color: 'from-amber-400 to-orange-500' },
                              { label: 'Кислотність', value: computedPairingAnalysis.profileMatches.acidity, color: 'from-cyan-400 to-blue-500' },
                              { label: 'Насиченість (Тільність)', value: computedPairingAnalysis.profileMatches.body, color: 'from-purple-500 to-pink-500' },
                              { label: 'Інтенсивність Умамі', value: computedPairingAnalysis.profileMatches.intensity, color: 'from-rose-500 to-red-500' }
                            ].map(slider => (
                              <div key={slider.label} className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                                  <span>{slider.label}</span>
                                  <span className="font-mono">{slider.value}%</span>
                                </div>
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full bg-gradient-to-r ${slider.color} transition-all duration-500 rounded-full`}
                                    style={{ width: `${slider.value}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4 flex flex-col justify-between">
                        {/* Interactive Presentation Script Speech Bubble */}
                        <div className="space-y-1.5 flex-1">
                          <h5 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" />
                            Мовна зброя офіціанта (Козир для пропозиції гостю)
                          </h5>
                          <div className="bg-[#14122d] border border-purple-500/20 p-5 rounded-2xl relative h-full flex flex-col justify-center">
                            <div className="absolute top-4 left-4 text-3xl opacity-20 text-purple-400">“</div>
                            <p className="text-xs md:text-sm text-slate-100 font-bold italic leading-relaxed text-center px-4 relative z-10">
                              {computedPairingAnalysis.quote}
                            </p>
                            <div className="text-right text-[9px] text-purple-400 font-extrabold tracking-wider uppercase mt-4">
                              — Скрипт успішного продажу
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Close controls */}
            <div className="p-4 border-t border-white/10 flex justify-end bg-[#0a0e1c] shrink-0">
              <button
                onClick={() => {
                  setShowConstructorModal(false);
                  setConstructorDishQuery('');
                  setConstructorDrinkQuery('');
                  setConstructorGarnishQuery('');
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-[#0a0f1e] font-extrabold text-xs px-6 py-3 rounded-xl transition cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                Зберегти поєднання та повернутися
              </button>
            </div>

          </div>
        </div>
      )}
</div>
  );
}
