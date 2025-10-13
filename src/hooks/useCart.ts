import { useState, useEffect } from 'react';
import { CartItem, CheckoutForm, EBook, Bundle } from '../types';
import { trackAddToCart, trackRemoveFromCart, trackViewCart } from '../utils/analytics';
import { SecurityValidator } from '../utils/security';
import { formatCurrency } from '../utils/currency';

const CART_STORAGE_KEY = 'heartwise_cart';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sessionFirstAdd, setSessionFirstAdd] = useState(true); // Track first add in this session
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [lastAddTime, setLastAddTime] = useState(0);
  const [appliedDiscounts, setAppliedDiscounts] = useState<string[]>([]);
  const [upsellDismissed, setUpsellDismissed] = useState(false);
  const [pair10EbookIds, setPair10EbookIds] = useState<string[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log('Loaded cart from localStorage:', parsedCart);
        setCart(parsedCart);
        // Don't set sessionFirstAdd based on saved cart - each session starts fresh
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      console.log('Saved cart to localStorage:', cart);
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart]);

  const addToCart = (item: EBook | Bundle, source: 'card' | 'modal' = 'card') => {
    // Security validation before adding to cart
    if (typeof item !== 'object' || !item) {
      console.error('Invalid item provided to addToCart');
      return;
    }

    let cartItem: CartItem;

    // Handle pre-built cart items (like custom bundles with metadata)
    if (typeof item === 'object' && 'type' in item && 'item' in item) {
      cartItem = item as CartItem;
    } else {
      // Handle regular ebooks and pre-made bundles
      cartItem = {
        type: 'ebooks' in item ? 'bundle' : 'ebook',
        id: item.id, // Use the actual product ID, not with timestamp
        item,
        quantity: 1
      };
    }

    // If adding a bundle, remove PAIR10 discount
    if (cartItem.type === 'bundle' && appliedDiscounts.includes('PAIR10')) {
      removeDiscount('PAIR10');
    }
    
    setCart(prevCart => {
      const now = Date.now();
      
      // Debounce rapid clicks (500ms)
      if (now - lastAddTime < 500) {
        console.log('Debounced rapid click');
        return prevCart;
      }
      setLastAddTime(now);

      console.log('Adding to cart:', cartItem, source);

      // Validate item data
      const itemValidation = SecurityValidator.validateCartItem(cartItem);
      if (!itemValidation.isValid) {
        console.error('Cart validation failed:', itemValidation.error);
        return prevCart;
      }

      // Additional cart size check
      if (prevCart.length >= 20) {
        console.error('Cart size limit exceeded');
        announceToScreenReader('Cart is full. Please remove items before adding more.');
        return prevCart;
      }

      console.log('Cart item being added:', cartItem);
      const updatedCart = [...prevCart, cartItem];
      console.log('Updated cart:', updatedCart);
      
      // Track analytics
      try {
        trackAddToCart({
          ...cartItem,
          source
        });
      } catch (error) {
        console.warn('Analytics tracking failed:', error);
      }

      // Announce to screen readers
      try {
        const announcement = `${cartItem.item.title} added to cart for ${formatCurrency(price)}`;
        announceToScreenReader(announcement);
      } catch (error) {
        console.warn('Screen reader announcement failed:', error);
      }

      // Handle first add in this session vs subsequent adds
      if (sessionFirstAdd) {
        console.log('First add in session - opening cart');
        setSessionFirstAdd(false);
        // Check if we're on mobile (screen width < 768px)
        const isMobile = window.innerWidth < 768;
        if (!isMobile) {
          setIsCartOpen(true);
        } else {
          // On mobile, just show toast instead of opening cart
          setToastMessage(`${cartItem.item.title} added to cart`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
      } else {
        // Show toast for subsequent adds
        console.log('Subsequent add - showing toast');
        setToastMessage(`${cartItem.item.title} added to cart`);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      }

      return updatedCart;
    });
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setCart(prevCart => 
      prevCart.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (id: string) => {
    console.log('Removing from cart:', id);
    setCart(prevCart => {
      const itemToRemove = prevCart.find(item => item.id === id);
      if (itemToRemove) {
        console.log('Item to remove:', itemToRemove);
        trackRemoveFromCart(itemToRemove);

        // If removing a PAIR10 ebook, remove the discount
        if (itemToRemove.type === 'ebook' && appliedDiscounts.includes('PAIR10')) {
          const ebookId = (itemToRemove.item as EBook).id;
          if (pair10EbookIds.includes(ebookId)) {
            removeDiscount('PAIR10');
          }
        }
      }
      const updatedCart = prevCart.filter(item => item.id !== id);
      console.log('Cart after removal:', updatedCart);
      return updatedCart;
    });
  };

  const openCart = () => {
    console.log('Opening cart manually');
    setIsCartOpen(true);
    trackViewCart();
  };

  const closeCart = () => {
    console.log('Closing cart');
    setIsCartOpen(false);
    setUpsellDismissed(false);
  };

  const clearCart = () => {
    console.log('Clearing cart');
    setCart([]);
    setSessionFirstAdd(true); // Reset for next session
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const getCartTotal = () => {
    return cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getCartSummary = () => {
    const validItems = cart.filter(item => {
      if (!item || !item.item) return false;
      const price = item.item.price;
      return price && !isNaN(Number(price)) && Number(price) > 0;
    });

    let subtotal = 0;
    let discount = 0;
    let freeCount = 0;
    
    // Separate bundle items from individual items
    const bundleItems = validItems.filter(item => 
      item.metadata?.pricingMode === 'bundle_pre_discounted' || 
      (item.type === 'bundle' && item.item.title?.includes('Custom Bundle'))
    );
    const individualItems = validItems.filter(item => 
      !bundleItems.includes(item)
    );
    
    // Process bundle items (no additional discounting)
    bundleItems.forEach(item => {
      const itemPrice = Number(item.item.price) * item.quantity;
      subtotal += itemPrice;
      
      // Use pre-calculated discount and free count from metadata
      if (item.metadata) {
        discount += (item.metadata.discount || 0) * item.quantity;
        freeCount += (item.metadata.freeCount || 0) * item.quantity;
      } else if ('savings' in item.item) {
        // Fallback for pre-made bundles
        discount += (item.item as any).savings * item.quantity;
        freeCount += ((item.item as any).freeCount || 0) * item.quantity;
      }
    });
    
    // Process individual items
    individualItems.forEach(item => {
      const itemPrice = Number(item.item.price) * item.quantity;
      subtotal += itemPrice;
    });
    
    // Apply dynamic bundling logic only to individual items
    if (individualItems.length > 0) {
      const totalIndividualItems = individualItems.reduce((sum, item) => sum + item.quantity, 0);
      if (totalIndividualItems >= 3) {
        const allPrices: number[] = [];
        individualItems.forEach(item => {
          for (let i = 0; i < item.quantity; i++) {
            allPrices.push(Number(item.item.price));
          }
        });
        allPrices.sort((a, b) => a - b);
        const groupsOf3 = Math.floor(allPrices.length / 3);
        
        for (let i = 0; i < groupsOf3; i++) {
          discount += allPrices[i];
        }
        freeCount += groupsOf3;
      }
    }
    
    const total = subtotal - discount;
    
    return { subtotal, discount, total, validItems, freeCount };
  };

  // Legacy method for backward compatibility
  const getCartSummaryOld = () => {
    validItems.forEach(item => {
      const itemPrice = Number(item.item.price) * item.quantity;
      subtotal += itemPrice;
      
      // Check if this is a custom bundle with pre-calculated discount
      if (item.item.title?.includes('Custom Bundle') && 'savings' in item.item) {
        discount += (item.item as any).savings * item.quantity;
        freeCount += ((item.item as any).freeCount || 0) * item.quantity;
      }
    });
    
    // Apply dynamic bundling logic only for individual items (not custom bundles)
    const individualItems = validItems.filter(item => !item.item.title?.includes('Custom Bundle'));
    if (individualItems.length > 0) {
      const totalIndividualItems = individualItems.reduce((sum, item) => sum + item.quantity, 0);
      if (totalIndividualItems >= 3) {
        const allPrices: number[] = [];
        individualItems.forEach(item => {
          for (let i = 0; i < item.quantity; i++) {
            allPrices.push(Number(item.item.price));
          }
        });
        allPrices.sort((a, b) => a - b);
        const groupsOf3 = Math.floor(allPrices.length / 3);
        
        for (let i = 0; i < groupsOf3; i++) {
          discount += allPrices[i]; // Add the cheapest item in each group of 3
        }
        freeCount += groupsOf3;
      }
    }
    
    const total = subtotal - discount;
    
    return { subtotal, discount, total, validItems, freeCount };
  };

  const getDiscountedTotal = () => {
    const { total } = getCartSummary();

    // Apply PAIR10 discount if applicable
    if (appliedDiscounts.includes('PAIR10')) {
      const ebookItems = cart.filter(item => item.type === 'ebook');
      if (ebookItems.length >= 2) {
        const ebookSubtotal = ebookItems.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
        const discount = ebookSubtotal * 0.1; // 10% off ebooks
        return total - discount;
      }
    }

    return total;
  };

  const applyDiscount = (code: string, ebookIds?: string[]) => {
    if (!appliedDiscounts.includes(code)) {
      setAppliedDiscounts([...appliedDiscounts, code]);
      if (code === 'PAIR10' && ebookIds) {
        setPair10EbookIds(ebookIds);
      }
    }
  };

  const removeDiscount = (code: string) => {
    setAppliedDiscounts(appliedDiscounts.filter(d => d !== code));
    if (code === 'PAIR10') {
      setPair10EbookIds([]);
    }
  };

  const dismissUpsell = () => {
    setUpsellDismissed(true);
  };

  const getPair10Discount = () => {
    if (!appliedDiscounts.includes('PAIR10') || pair10EbookIds.length !== 2) {
      return { discount: 0, affectedItems: [] };
    }

    const affectedItems = cart.filter(item =>
      item.type === 'ebook' && pair10EbookIds.includes((item.item as EBook).id)
    );

    const discount = affectedItems.reduce((sum, item) => {
      return sum + (item.item.price * item.quantity * 0.1);
    }, 0);

    return { discount, affectedItems };
  };

  return {
    cart,
    isCartOpen,
    showToast,
    toastMessage,
    appliedDiscounts,
    upsellDismissed,
    pair10EbookIds,
    addToCart,
    updateItemQuantity,
    removeFromCart,
    openCart,
    closeCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
    getCartSummary,
    getDiscountedTotal,
    applyDiscount,
    removeDiscount,
    dismissUpsell,
    getPair10Discount
  };
};

// Helper function to announce to screen readers
const announceToScreenReader = (message: string) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};