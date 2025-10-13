// Currency formatting utilities
export const formatCurrency = (amount: number | undefined | null): string => {
  // Guard against invalid values
  if (amount === undefined || amount === null || isNaN(amount)) {
    console.warn('Invalid price value:', amount);
    return '$0';
  }

  // Ensure it's a number
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    console.warn('Could not convert to number:', amount);
    return '$0';
  }

  // Format as USD currency
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericAmount);
};

export const calculateBuy2Get1Free = (items: Array<{ price: number }>): { subtotal: number; discount: number; total: number } => {
  const prices = items.map(item => Number(item.price)).filter(price => !isNaN(price));
  const subtotal = prices.reduce((sum, price) => sum + price, 0);
  
  if (prices.length < 3) {
    return { subtotal, discount: 0, total: subtotal };
  }
  
  // Sort prices to find cheapest items to discount
  const sortedPrices = [...prices].sort((a, b) => a - b);
  
  // For every group of 3, the cheapest is free
  const groupsOf3 = Math.floor(prices.length / 3);
  let discount = 0;
  
  for (let i = 0; i < groupsOf3; i++) {
    discount += sortedPrices[i]; // Add the cheapest item in each group of 3
  }
  
  const total = subtotal - discount;
  
  return { subtotal, discount, total };
};