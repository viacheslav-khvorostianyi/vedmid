import { MenuItem } from './types';

/**
 * Smart, fault-tolerant parser for restaurant menu text files (.txt)
 */
export function parseMenuTxt(text: string): MenuItem[] {
  const lines = text.split(/\r?\n/);
  const items: MenuItem[] = [];
  
  let currentCategory: MenuItem['category'] = 'Їжа';
  let currentSubcategory: string = 'Загальне';
  
  let currentItem: Partial<MenuItem> | null = null;
  
  // Helper to generate a unique ID
  const generateId = (title: string, cat: string) => {
    const prefix = cat === 'Їжа' ? 'food' : cat === 'Вино' ? 'wine' : 'drink';
    const cleanTitle = title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '').slice(0, 15).toLowerCase();
    return `${prefix}-custom-${cleanTitle}-${Math.floor(1000 + Math.random() * 9000)}`;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const upperLine = line.toUpperCase();
    
    // Check for major Category markers
    if (
      upperLine === 'БАР' || 
      upperLine === 'БАРНЕ МЕНЮ' || 
      upperLine === 'БАРНА КАРТА' || 
      upperLine === 'НАПОЇ' || 
      upperLine === 'БЕЗАЛКОГОЛЬНІ НАПОЇ'
    ) {
      currentCategory = 'Безалкогольні & Пиво';
      currentSubcategory = 'Напої';
      continue;
    } else if (
      upperLine === 'КУХНЯ' || 
      upperLine === 'МЕНЮ КУХНІ' || 
      upperLine === 'ЇЖА' || 
      upperLine === 'СТРАВИ'
    ) {
      currentCategory = 'Їжа';
      currentSubcategory = 'Основні страви';
      continue;
    } else if (
      upperLine === 'ВИННА КАРТА' || 
      upperLine === 'ВИНО' || 
      upperLine === 'ВИНА'
    ) {
      currentCategory = 'Вино';
      currentSubcategory = 'Ігристі та Пет-Нати';
      continue;
    } else if (
      upperLine === 'КОКТЕЙЛІ' || 
      upperLine === 'КОКТЕЙЛЬНА КАРТА' || 
      upperLine === 'МІКСИ'
    ) {
      currentCategory = 'Коктейлі';
      currentSubcategory = 'Авторські коктейлі';
      continue;
    } else if (
      upperLine === 'МІЦНІ НАПОЇ' || 
      upperLine === 'МІЦНЕ' || 
      upperLine === 'АЛКОГОЛЬ' || 
      upperLine === 'СПИРТНЕ'
    ) {
      currentCategory = 'Міцні напої';
      currentSubcategory = 'Віскі';
      continue;
    }
    
    // Check for explicit Subcategory markers, e.g., "[Кава та чай]" or "(Салати)"
    if (
      (line.startsWith('[') && line.endsWith(']')) || 
      (line.startsWith('(') && line.endsWith(')')) ||
      (line.startsWith('{') && line.endsWith('}'))
    ) {
      currentSubcategory = line.slice(1, -1).trim();
      continue;
    }
    
    // Check if line stands as an uppercase Subcategory header (short, no dots, no colons)
    if (
      line.length > 2 && 
      line.length < 35 && 
      line === upperLine && 
      !line.includes('.') && 
      !line.includes(':') && 
      !line.includes('—') && 
      !line.includes('-')
    ) {
      currentSubcategory = line;
      continue;
    }
    
    // Check for item name line (contains dots "...." or ends with weight " г", " мл", etc.)
    const isItemLine = line.includes('...') || line.includes('---') || /\d+\s*(г|мл|шт|л)/i.test(line);
    
    if (isItemLine) {
      // Save the previous item before starting a new one
      if (currentItem && currentItem.title) {
        items.push(currentItem as MenuItem);
      }
      
      // Parse name and weight
      let title = line;
      let weight = '';
      
      const dotIndex = line.indexOf('...');
      const dashIndex = line.indexOf('---');
      const separatorIndex = dotIndex !== -1 ? dotIndex : (dashIndex !== -1 ? dashIndex : -1);
      
      if (separatorIndex !== -1) {
        title = line.substring(0, separatorIndex).trim();
        weight = line.substring(separatorIndex).replace(/[\.\-]/g, '').trim();
      } else {
        // Try parsing trailing weight/volume matching like " 300 г" or " 30 мл"
        const weightMatch = line.match(/\s+(\d+\s*(г|мл|шт|л))\s*$/i);
        if (weightMatch) {
          title = line.substring(0, weightMatch.index).trim();
          weight = weightMatch[1].trim();
        }
      }
      
      // Clean leading bullet points or decorations
      title = title.replace(/^[•\-└─\s\d]+/, '').trim();
      
      currentItem = {
        id: generateId(title, currentCategory),
        category: currentCategory,
        subcategory: currentSubcategory,
        title: title + (weight ? ` (${weight})` : ''),
        anchor: 'Фірмовий рецепт ресторану',
        ingredients: 'Інформація уточнюється у шефа',
        sales: `Вишуканий та свіжий вибір з нашого меню. Рекомендую спробувати ${title}!`,
        allergens: []
      };
      continue;
    }
    
    // If we have an active item, parse details
    if (currentItem) {
      const cleanLine = line.replace(/^[└─•\-\s]+/, '').trim();
      
      if (
        cleanLine.toLowerCase().startsWith('складник:') || 
        cleanLine.toLowerCase().startsWith('складники:') || 
        cleanLine.toLowerCase().startsWith('склад:')
      ) {
        currentItem.ingredients = cleanLine.replace(/^.*?:/i, '').trim();
      } else if (
        cleanLine.toLowerCase().startsWith('опис:') || 
        cleanLine.toLowerCase().startsWith('характеристика:') || 
        cleanLine.toLowerCase().startsWith('характеристики:') ||
        cleanLine.toLowerCase().startsWith('смак:')
      ) {
        currentItem.sales = cleanLine.replace(/^.*?:/i, '').trim();
        // Generate a memorable anchor from description
        const desc = currentItem.sales;
        if (desc && currentItem.anchor === 'Фірмовий рецепт ресторану') {
          const words = desc.split(' ').slice(0, 3).join(' ');
          currentItem.anchor = words + '...';
        }
      } else if (cleanLine.toLowerCase().startsWith('якір:')) {
        currentItem.anchor = cleanLine.replace(/^.*?:/i, '').trim();
      } else if (cleanLine.toLowerCase().startsWith('алерген:') || cleanLine.toLowerCase().startsWith('алергени:')) {
        const algsStr = cleanLine.replace(/^.*?:/i, '').toLowerCase();
        currentItem.allergens = algsStr.split(/[,;\s]+/).map(a => a.trim()).filter(Boolean);
      } else if (cleanLine.toLowerCase().startsWith('цікавий факт:') || cleanLine.toLowerCase().startsWith('секрет:')) {
        currentItem.interestingFact = cleanLine.replace(/^.*?:/i, '').trim();
      } else if (
        cleanLine.toLowerCase().startsWith('гастропара:') || 
        cleanLine.toLowerCase().startsWith('пара:') || 
        cleanLine.toLowerCase().startsWith('поєднання:')
      ) {
        currentItem.pairing = cleanLine.replace(/^.*?:/i, '').trim();
      } else {
        // Concatenate generic info
        if (currentItem.ingredients === 'Інформація уточнюється у шефа') {
          currentItem.ingredients = cleanLine;
        } else {
          currentItem.sales += ' ' + cleanLine;
        }
      }
    }
  }
  
  // Push the last parsed item
  if (currentItem && currentItem.title) {
    items.push(currentItem as MenuItem);
  }
  
  return items;
}
