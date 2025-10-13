import { EBook } from '../types';

// Category companion pairs for upsell recommendations
export const categoryPairs: Record<string, string[]> = {
  'Dating & Red Flags': [
    'dating-age-manipulators',
    'mr-almost', 
    'love-vs-lust',
    'charmer-trap'
  ],
  'Manipulation & Toxic Relationships': [
    'trapped-in-his-game',
    'gaslighting-unmasked', 
    'love-bombed-left',
    'why-attract-toxic'
  ]
};

export const getCompanionRecommendation = (
  primaryEbook: EBook, 
  cartEbooks: EBook[], 
  allEbooks: EBook[]
): EBook | null => {
  const category = primaryEbook.category;
  const companionIds = categoryPairs[category];
  
  if (!companionIds) return null;
  
  // Get cart ebook IDs to exclude
  const cartEbookIds = cartEbooks.map(book => book.id);
  
  // Find first companion not in cart and not the primary book
  const companionId = companionIds.find(id => 
    id !== primaryEbook.id && !cartEbookIds.includes(id)
  );
  
  if (!companionId) return null;
  
  return allEbooks.find(book => book.id === companionId) || null;
};

export const getUpsellMessage = (category: string, primaryTitle: string, companionTitle: string): string => {
  if (category === 'Dating & Red Flags') {
    return `You picked ${primaryTitle}. Many women who've been hurt by red flags also add ${companionTitle}—because once you see the patterns, you can't unsee them. Add it now and get 10% off both.`;
  }
  
  if (category === 'Manipulation & Toxic Relationships') {
    return `Since you chose ${primaryTitle}, most readers also grab ${companionTitle} to finally understand the mind games manipulators play. It's like seeing behind the mask. Add it now and unlock 10% off both.`;
  }
  
  return '';
};