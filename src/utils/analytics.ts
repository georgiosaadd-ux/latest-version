// Analytics utility functions
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // In a real app, this would send to your analytics service
  console.log('Analytics Event:', eventName, properties);
  
  // Example for Google Analytics 4
  if (typeof gtag !== 'undefined') {
    gtag('event', eventName, properties);
  }
};

export const trackPurchase = (transactionId: string, items: any[], total: number) => {
  trackEvent('purchase', {
    transaction_id: transactionId,
    value: total,
    currency: 'USD',
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.item.title,
      category: item.type,
      quantity: item.quantity,
      price: item.item.price
    }))
  });
};

export const trackAddToCart = (item: any) => {
  trackEvent('add_to_cart', {
    currency: 'USD',
    value: item.item.price,
    from: item.source || 'unknown',
    items: [{
      item_id: item.id,
      item_name: item.item.title,
      category: item.type,
      quantity: 1,
      price: item.item.price
    }]
  });
};

export const trackRemoveFromCart = (item: any) => {
  trackEvent('remove_from_cart', {
    currency: 'USD',
    value: item.item.price,
    items: [{
      item_id: item.id,
      item_name: item.item.title,
      category: item.type,
      quantity: 1,
      price: item.item.price
    }]
  });
};

export const trackViewCart = () => {
  trackEvent('view_cart', {});
};
export const trackViewItem = (item: any) => {
  trackEvent('view_item', {
    currency: 'USD',
    value: item.price,
    items: [{
      item_id: item.id,
      item_name: item.title,
      category: item.category || 'ebook',
      price: item.price
    }]
  });
};

export const trackViewItemDetail = (item: any) => {
  trackEvent('view_item_detail', {
    currency: 'USD',
    value: item.price,
    items: [{
      item_id: item.id,
      item_name: item.title,
      category: item.category || 'ebook',
      price: item.price
    }]
  });
};

export const trackBeginCheckout = (items: any[], total: number) => {
  trackEvent('begin_checkout', {
    currency: 'USD',
    value: total,
    items: items.map(item => ({
      item_id: item.id,
      item_name: item.item.title,
      category: item.type,
      quantity: item.quantity,
      price: item.item.price
    }))
  });
};

export const trackCustomBundleCreated = (selectedBooks: any[], originalPrice: number, discountedPrice: number, savings: number) => {
  trackEvent('custom_bundle_created', {
    selected_books: selectedBooks,
    total_original_price: originalPrice,
    discounted_price: discountedPrice,
    savings: savings,
    currency: 'USD'
  });
}

export const trackBundlePreselectedView = () => {
  trackEvent('bundle_preselected_view', {});
};