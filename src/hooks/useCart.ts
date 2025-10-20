import { useState, useEffect } from 'react';
import { CartItem, CheckoutForm, EBook, Bundle } from '../types';
import { trackAddToCart, trackRemoveFromCart, trackViewCart } from '../utils/analytics';
import { formatCurrency } from '../utils/currency';

const CART_STORAGE_KEY = 'heartwise_cart';

export const useCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sessionFirstAdd, setSessionFirstAdd] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');
  const [lastAddTime, setLastAddTime] = useState(0);
  const [appliedDiscounts, setAppliedDiscounts] = useState<string[]>([]);
  const [bundleUpsellDismissed, setBundleUpsellDismissed] = useState(false);

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        console.log('Loaded cart from localStorage:', parsedCart);
        setCart(parsedCart);
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      console.log('Saved cart to localStorage:', cart);
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
    }
  }, [cart]);

  const showToastMessage = (message: string, type: 'success' | 'warning' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Helper function to get all ebook IDs and their cart item IDs
  const getEbookDetails = (currentCart: CartItem[]): Map<string, { cartItemId: string; type: 'ebook' | 'bundle'; title: string }[]> => {
    const ebookMap = new Map<string, { cartItemId: string; type: 'ebook' | 'bundle'; title: string }[]>();
    
    currentCart.forEach(item => {
      if (item.type === 'ebook') {
        const ebook = item.item as EBook;
        if (!ebookMap.has(ebook.id)) {
          ebookMap.set(ebook.id, []);
        }
        ebookMap.get(ebook.id)!.push({
          cartItemId: item.id,
          type: 'ebook',
          title: ebook.title
        });
      } else if (item.type === 'bundle') {
        const bundle = item.item as Bundle;
        if (bundle.ebookIds) {
          bundle.ebookIds.forEach(ebookId => {
            if (!ebookMap.has(ebookId)) {
              ebookMap.set(ebookId, []);
            }
            const ebookTitle = bundle.ebooks?.find(b => b.id === ebookId)?.title || 'Unknown';
            ebookMap.get(ebookId)!.push({
              cartItemId: item.id,
              type: 'bundle',
              title: ebookTitle
            });
          });
        }
      }
    });
    
    return ebookMap;
  };

  const addToCart = (item: EBook | Bundle, source: 'card' | 'modal' = 'card') => {
    const now = Date.now();
    
    // Debounce rapid clicks (500ms)
    if (now - lastAddTime < 500) {
      console.log('Debounced rapid click');
      return;
    }
    setLastAddTime(now);

    let cartItem: CartItem;

    // Handle pre-built cart items (like custom bundles with metadata)
    if (typeof item === 'object' && 'type' in item && 'item' in item) {
      cartItem = item as CartItem;
    } else {
      // Handle regular ebooks and pre-made bundles
      cartItem = {
        type: 'ebooks' in item ? 'bundle' : 'ebook',
        id: `${item.id}-${Date.now()}`,
        item,
        quantity: 1
      };
    }

    // Validate item data
    if (!cartItem.item || !cartItem.item.title) {
      console.error('Invalid item:', cartItem.item);
      return;
    }

    const price = cartItem.item.price;
    if (!price || isNaN(Number(price)) || Number(price) <= 0) {
      console.error('Invalid price:', cartItem.item);
      return;
    }

    if (!cartItem.item.id) {
      console.error('Invalid item: missing id', cartItem.item);
      return;
    }

    // Check for bundle type mixing
    if (cartItem.type === 'bundle') {
      const isCustomBundle = cartItem.metadata?.pricingMode === 'bundle_pre_discounted' || 
                            cartItem.item.title?.includes('Custom Bundle');
      const existingBundles = cart.filter(item => item.type === 'bundle');
      
      if (existingBundles.length > 0) {
        const hasCustomBundle = existingBundles.some(item => 
          item.metadata?.pricingMode === 'bundle_pre_discounted' || 
          item.item.title?.includes('Custom Bundle')
        );
        const hasPreMadeBundle = existingBundles.some(item => 
          !(item.metadata?.pricingMode === 'bundle_pre_discounted' || 
            item.item.title?.includes('Custom Bundle'))
        );
        
        // Prevent mixing custom and pre-made bundles
        if ((isCustomBundle && hasPreMadeBundle) || (!isCustomBundle && hasCustomBundle)) {
          showToastMessage(
            '⚠️ You can only have one type of bundle in your cart. Please remove the existing bundle first.',
            'warning'
          );
          return;
        }
      }
    }

    // Get ebook details from current cart
    const ebookDetails = getEbookDetails(cart);
    
    // Check what we're adding
    const isAddingBundle = cartItem.type === 'bundle';
    const isAddingEbook = cartItem.type === 'ebook';
    
    if (isAddingBundle) {
      const bundle = cartItem.item as Bundle;
      const bundleEbookIds = bundle.ebookIds || [];
      
      // Check if any ebook in this bundle exists in cart
      const duplicateEbooks: string[] = [];
      const itemsToRemove: string[] = [];
      
      bundleEbookIds.forEach(ebookId => {
        if (ebookDetails.has(ebookId)) {
          const existingItems = ebookDetails.get(ebookId)!;
          existingItems.forEach(existing => {
            if (existing.type === 'ebook') {
              // Single ebook exists - we'll remove it
              itemsToRemove.push(existing.cartItemId);
            } else {
              // It's in another bundle - this is a duplicate
              duplicateEbooks.push(existing.title);
            }
          });
        }
      });
      
      // If bundle contains ebooks that are in other bundles, warn and don't add
      if (duplicateEbooks.length > 0) {
        showToastMessage(`⚠️ "${duplicateEbooks[0]}" is already in your cart`, 'warning');
        return;
      }
      
      // Remove individual ebooks that are now in the bundle (silently)
      if (itemsToRemove.length > 0) {
        setCart(prevCart => {
          let updatedCart = prevCart.filter(item => !itemsToRemove.includes(item.id));
          updatedCart = [...updatedCart, cartItem];
          
          trackAddToCart({ ...cartItem, source });
          
          // Just show bundle added message, no mention of removed items
          showToastMessage(`${cartItem.item.title} added to cart`, 'success');
          
          return updatedCart;
        });
        return;
      }
    } else if (isAddingEbook) {
      const ebook = cartItem.item as EBook;
      
      // Check if this ebook already exists anywhere
      if (ebookDetails.has(ebook.id)) {
        const existing = ebookDetails.get(ebook.id)![0];
        showToastMessage(`⚠️ "${existing.title}" is already in your cart`, 'warning');
        return;
      }
    }

    // Add the item normally
    setCart(prevCart => {
      console.log('Adding to cart:', cartItem, source);
      const updatedCart = [...prevCart, cartItem];
      console.log('Updated cart:', updatedCart);
      
      trackAddToCart({ ...cartItem, source });
      
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
        const isMobile = window.innerWidth < 768;
        if (!isMobile) {
          setIsCartOpen(true);
        } else {
          showToastMessage(`${cartItem.item.title} added to cart`, 'success');
        }
      } else {
        console.log('Subsequent add - showing toast');
        showToastMessage(`${cartItem.item.title} added to cart`, 'success');
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
    setBundleUpsellDismissed(false);
  };

  const clearCart = () => {
    console.log('Clearing cart');
    setCart([]);
    setSessionFirstAdd(true);
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
    
    const bundleItems = validItems.filter(item => 
      item.metadata?.pricingMode === 'bundle_pre_discounted' || 
      (item.type === 'bundle' && item.item.title?.includes('Custom Bundle'))
    );
    const individualItems = validItems.filter(item => 
      !bundleItems.includes(item)
    );
    
    bundleItems.forEach(item => {
      const itemPrice = Number(item.item.price) * item.quantity;
      subtotal += itemPrice;
      
      if (item.metadata) {
        discount += (item.metadata.discount || 0) * item.quantity;
        freeCount += (item.metadata.freeCount || 0) * item.quantity;
      } else if ('savings' in item.item) {
        discount += (item.item as any).savings * item.quantity;
        freeCount += ((item.item as any).freeCount || 0) * item.quantity;
      }
    });
    
    individualItems.forEach(item => {
      const itemPrice = Number(item.item.price) * item.quantity;
      subtotal += itemPrice;
    });
    
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

  const dismissBundleUpsell = () => {
    setBundleUpsellDismissed(true);
  };

  return {
    cart,
    isCartOpen,
    showToast,
    toastMessage,
    toastType,
    bundleUpsellDismissed,
    addToCart,
    updateItemQuantity,
    removeFromCart,
    openCart,
    closeCart,
    clearCart,
    getCartTotal,
    getCartItemCount,
    getCartSummary,
    dismissBundleUpsell,
    setShowToast,
    setToastMessage,
    setToastType
  };
};

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