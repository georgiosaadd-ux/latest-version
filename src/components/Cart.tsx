import React, { useState } from 'react';
import { X, ShoppingBag, Trash2, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { CartItem, CheckoutForm, EBook, Bundle } from '../types';
import { formatCurrency } from '../utils/currency';
import BundleUpsellModal from './BundleUpsellModal';
import FreeEbookProgress from './FreeEbookProgress';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: (form: CheckoutForm) => void;
  appliedDiscounts?: string[];
  onAddToCart?: (item: EBook | Bundle) => void;
  onApplyDiscount?: (code: string, ebookIds?: string[]) => void;
  bundleUpsellDismissed?: boolean;
  onDismissBundleUpsell?: () => void;
}

const Cart: React.FC<CartProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  appliedDiscounts = [],
  onAddToCart,
  bundleUpsellDismissed = false,
  onDismissBundleUpsell
}) => {
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    firstName: '',
    lastName: '',
    email: '',
    marketingConsent: false
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showBundleUpsell, setShowBundleUpsell] = useState(false);
  const [currentEbook, setCurrentEbook] = useState<EBook | null>(null);
  const [expandedBundles, setExpandedBundles] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const ebookCount = cart.filter(item => item.type === 'ebook').reduce((sum, item) => sum + item.quantity, 0);

  // Use the cart summary from useCart hook
  const { subtotal, discount, total, freeCount } = cart.length > 0 
    ? (() => {
        const validItems = cart.filter(item => {
          if (!item || !item.item) return false;
          const price = item.item.price;
          return price && !isNaN(Number(price)) && Number(price) > 0;
        });

        let calculatedSubtotal = 0;
        let calculatedDiscount = 0;
        let calculatedFreeCount = 0;
        
        // Separate bundle and individual items
        const bundleItems = validItems.filter(item => {
          const isBundle = item.type === 'bundle';
          console.log('Checking if bundle:', {
            id: item.id,
            title: item.item.title,
            type: item.type,
            isBundle
          });
          return isBundle;
        });
        const individualItems = validItems.filter(item => 
          !bundleItems.includes(item)
        );
        
        console.log('Bundle items:', bundleItems);
        console.log('Individual items:', individualItems);
        
        // Handle pre-discounted bundles - use their stored values
        bundleItems.forEach(item => {
          const bundle = item.item as any;
          
          console.log('Processing bundle:', {
            title: bundle.title,
            hasMetadata: !!item.metadata,
            hasEbooks: !!(bundle.ebooks && Array.isArray(bundle.ebooks)),
            hasOriginalPrice: !!bundle.originalPrice,
            hasSavings: bundle.savings !== undefined,
            bundle: bundle
          });
          
          if (item.metadata?.subtotal && item.metadata?.discount !== undefined) {
            // Custom bundle with metadata
            calculatedSubtotal += item.metadata.subtotal * item.quantity;
            calculatedDiscount += item.metadata.discount * item.quantity;
            calculatedFreeCount += (item.metadata.freeCount || 0) * item.quantity;
            console.log('✓ Using custom bundle metadata:', item.metadata);
          } else if (bundle.originalPrice && bundle.savings !== undefined && bundle.ebooks && Array.isArray(bundle.ebooks)) {
            // Pre-made bundle with explicit properties
            calculatedSubtotal += bundle.originalPrice * item.quantity;
            calculatedDiscount += bundle.savings * item.quantity;
            calculatedFreeCount += 1 * item.quantity; // Always 1 free book
            console.log('✓ Using pre-made bundle properties:', { 
              originalPrice: bundle.originalPrice, 
              savings: bundle.savings,
              freeCount: 1,
              ebooksCount: bundle.ebooks.length
            });
          } else if (bundle.ebooks && Array.isArray(bundle.ebooks) && bundle.ebooks.length > 0) {
            // Pre-made bundle: Calculate from ebooks array
            const ebooksTotal = bundle.ebooks.reduce((sum: number, ebook: any) => sum + (ebook.price || 0), 0);
            const bundlePrice = bundle.price;
            const bundleSavings = ebooksTotal - bundlePrice;
            
            calculatedSubtotal += ebooksTotal * item.quantity;
            calculatedDiscount += bundleSavings * item.quantity;
            calculatedFreeCount += 1 * item.quantity;
            
            console.log('✓ Pre-made bundle from ebooks array:', { 
              ebooksTotal, 
              bundlePrice, 
              bundleSavings,
              ebooksCount: bundle.ebooks.length,
              freeCount: 1
            });
          } else {
            // Fallback: no discount (shouldn't happen for bundles)
            calculatedSubtotal += bundle.price * item.quantity;
            console.log('⚠ Bundle fallback (no discount):', { price: bundle.price });
          }
        });
        
        // Handle individual items
        individualItems.forEach(item => {
          const itemPrice = Number(item.item.price) * item.quantity;
          calculatedSubtotal += itemPrice;
        });
        
        // Apply dynamic bundling ONLY to individual items
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
              calculatedDiscount += allPrices[i];
            }
            calculatedFreeCount += groupsOf3;
          }
        }
        
        const calculatedTotal = calculatedSubtotal - calculatedDiscount;
        
        console.log('Final calculations:', {
          subtotal: calculatedSubtotal,
          discount: calculatedDiscount,
          total: calculatedTotal,
          freeCount: calculatedFreeCount
        });
        
        return { 
          subtotal: calculatedSubtotal, 
          discount: calculatedDiscount, 
          total: calculatedTotal, 
          freeCount: calculatedFreeCount 
        };
      })()
    : { subtotal: 0, discount: 0, total: 0, freeCount: 0 };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!checkoutForm.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!checkoutForm.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!checkoutForm.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(checkoutForm.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onCheckout(checkoutForm);
    }
  };

  const handleProceedToCheckout = () => {
    const ebookItems = cart.filter(item => item.type === 'ebook');
    const bundleItems = cart.filter(item => item.type === 'bundle');

    // Show bundle upsell if: exactly 1 ebook, no bundles, not dismissed
    if (!bundleUpsellDismissed && ebookItems.length === 1 && bundleItems.length === 0) {
      const ebook = ebookItems[0].item as EBook;
      setCurrentEbook(ebook);
      setShowBundleUpsell(true);
      return;
    }

    setShowCheckout(true);
  };

  const toggleBundleExpansion = (itemId: string) => {
    setExpandedBundles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Helper function to get ebook details from cart
  const getEbookDetails = (): Map<string, { cartItemId: string; type: 'ebook' | 'bundle'; title: string }[]> => {
    const ebookMap = new Map<string, { cartItemId: string; type: 'ebook' | 'bundle'; title: string }[]>();
    
    cart.forEach(item => {
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

  const handleBundleSelect = (selectedBooks: EBook[]) => {
    if (selectedBooks.length === 3 && onAddToCart) {
      // Check if there's already a pre-made bundle in cart
      const hasPreMadeBundle = cart.some(item => 
        item.type === 'bundle' && 
        !(item.metadata?.pricingMode === 'bundle_pre_discounted' || item.item.title?.includes('Custom Bundle'))
      );
      
      if (hasPreMadeBundle) {
        alert('⚠️ You already have a pre-made bundle in your cart. Please remove it first before creating a custom bundle.');
        return;
      }
      
      // Get ebook details from cart
      const ebookDetails = getEbookDetails();
      
      const selectedEbookIds = selectedBooks.map(b => b.id);
      const duplicateBundles: string[] = [];
      const itemsToRemove: string[] = [];
      
      // Check each selected ebook
      selectedEbookIds.forEach(ebookId => {
        if (ebookDetails.has(ebookId)) {
          const existingItems = ebookDetails.get(ebookId)!;
          existingItems.forEach(existing => {
            if (existing.type === 'ebook') {
              // Single ebook exists - we'll remove it
              itemsToRemove.push(existing.cartItemId);
            } else {
              // It's in another bundle - this is a duplicate
              duplicateBundles.push(existing.title);
            }
          });
        }
      });
      
      // If any ebook is in another bundle, show warning and don't proceed
      if (duplicateBundles.length > 0) {
        alert(`⚠️ "${duplicateBundles[0]}" is already in a bundle in your cart. Please choose different books.`);
        return;
      }
      
      // Remove individual ebooks that will be in the new bundle
      itemsToRemove.forEach(itemId => onRemoveItem(itemId));
      
      // Create custom bundle
      const sortedPrices = selectedBooks.map(b => b.price).sort((a, b) => a - b);
      const subtotal = selectedBooks.reduce((sum, book) => sum + book.price, 0);
      const discount = sortedPrices[0]; // Cheapest book is free
      const total = subtotal - discount;
      
      // Get the actual EBook IDs
      const ebookIds = selectedBooks.map(b => b.id);
      
      const customBundle = {
        id: `bundle-upsell-${Date.now()}`,
        title: `Custom Bundle (3 books)`,
        description: `Your bundle: ${selectedBooks.map(b => b.title).join(', ')}`,
        price: total,
        originalPrice: subtotal,
        savings: discount,
        ebookIds: ebookIds,
        ebooks: selectedBooks,
        freeCount: 1
      };

      const cartItem = {
        type: 'bundle' as const,
        id: `bundle-upsell-${Date.now()}`,
        item: customBundle,
        quantity: 1,
        metadata: {
          subtotal: subtotal,
          discount: discount,
          freeCount: 1,
          pricingMode: 'bundle_pre_discounted' as const,
          originalItems: selectedBooks.map(book => ({
            id: book.id,
            title: book.title,
            price: book.price
          }))
        }
      };

      console.log('Creating custom bundle:', cartItem);
      onAddToCart(cartItem);
      setShowBundleUpsell(false);
      setShowCheckout(true);
    }
  };

  const handleContinueWithoutBundle = () => {
    setShowBundleUpsell(false);
    setShowCheckout(true);
  };

  const handleDismissBundleUpsell = () => {
    setShowBundleUpsell(false);
    if (onDismissBundleUpsell) {
      onDismissBundleUpsell();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white shadow-2xl overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="border-b border-gray-200">
            <div className="flex items-center justify-between p-6 pb-4">
              <div className="flex items-center gap-3">
                <ShoppingBag size={24} className="text-purple-600" />
                <h2 className="text-xl font-bold text-gray-800">
                  {showCheckout ? 'Checkout' : 'Your Cart'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            {cart.length > 0 && (
              <div className="px-6 pb-4">
                <FreeEbookProgress ebookCount={ebookCount} compact />
              </div>
            )}
          </div>

          {!showCheckout ? (
            // Cart view
            <>
              <div className="flex-1 overflow-y-auto p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag size={48} className="text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">Your cart is waiting for you</p>
                    <p className="text-sm text-gray-400">Choose a book that sees you</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => {
                      const isExpanded = expandedBundles.has(item.id);
                      const isBundle = item.type === 'bundle';
                      
                      // Get books to display - prefer ebooks array from bundle item
                      const bundle = isBundle ? (item.item as Bundle) : null;
                      const booksToDisplay = bundle?.ebooks || item.metadata?.originalItems || null;
                      const canExpand = isBundle && booksToDisplay && booksToDisplay.length > 0;
                      
                      console.log('Cart item render:', {
                        id: item.id,
                        title: item.item.title,
                        isBundle,
                        bundleEbooks: bundle?.ebooks?.length,
                        metadataOriginalItems: item.metadata?.originalItems?.length,
                        booksToDisplay: booksToDisplay?.length,
                        canExpand,
                        isExpanded
                      });
                      
                      return (
                        <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-800">
                                  {item.item.title}
                                </h3>
                                {canExpand && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      console.log('Toggling bundle:', {
                                        id: item.id,
                                        currentState: expandedBundles.has(item.id),
                                        allExpanded: Array.from(expandedBundles)
                                      });
                                      toggleBundleExpansion(item.id);
                                    }}
                                    className="text-pink-600 hover:text-pink-800 transition-colors p-1 bg-purple-50 rounded hover:bg-purple-100"
                                    aria-label={isExpanded ? "Collapse bundle" : "Expand bundle"}
                                    type="button"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp size={18} />
                                    ) : (
                                      <ChevronDown size={18} />
                                    )}
                                  </button>
                                )}
                              </div>
                              
                              {item.type === 'bundle' && (
                                <p className="text-sm text-gray-500 mb-2">
                                  Bundle • {booksToDisplay?.length || 0} eBooks
                                </p>
                              )}
                              
                              {/* Bundle expansion - works for BOTH custom and pre-made */}
                              {isExpanded && booksToDisplay && (
                                <div className="mt-2 mb-2 pl-4 border-l-2 border-pink-300 space-y-1 bg-white rounded p-3">
                                  <p className="text-xs font-semibold text-pink-400 uppercase mb-2">Books in this bundle:</p>
                                  {booksToDisplay.map((book: any, idx: number) => (
                                    <div key={book.id || idx} className="text-sm text-gray-700 flex items-center gap-2 py-1">
                                      <span className="text-pink-400 font-bold">•</span>
                                      <span className="flex-1">{book.title}</span>
                                      <span className="text-gray-500 text-xs font-medium">{formatCurrency(book.price)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {item.type === 'ebook' && (
                                <p className="text-sm text-gray-600">
                                  {formatCurrency(item.item.price)} each
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => onRemoveItem(item.id)}
                              className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <div className="flex items-center justify-end mt-3">
                            <p className="font-semibold text-gray-800">
                              {formatCurrency(item.item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {cart.length > 0 && (() => {
                console.log('Cart summary:', { subtotal, discount, total, freeCount });
                console.log('Cart items:', cart);
                
                return (
                  <div className="border-t border-gray-200 p-6">
                    {discount > 0 && (
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                      </div>
                    )}
                    {freeCount > 0 && (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-green-600 font-medium">Free books:</span>
                          <span className="text-green-600 font-bold">{freeCount}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#D8558E] font-medium">You saved:</span>
                          <span className="text-[#D8558E] font-bold">{formatCurrency(discount)}</span>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between text-xl font-bold mb-4 pt-2 border-t border-gray-200">
                      <span>Total:</span>
                      <span>{formatCurrency(total)}</span>
                    </div>

                    <button
                      onClick={handleProceedToCheckout}
                      className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <CreditCard size={20} />
                      Proceed to Checkout
                    </button>
                  </div>
                );
              })()}
            </>
          ) : (
            // Checkout view
            <>
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Contact Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={checkoutForm.firstName}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, firstName: e.target.value }))}
                          className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.firstName ? 'border-red-300' : 'border-gray-300'}`}
                          placeholder="Your first name"
                        />
                        {errors.firstName && (
                          <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                        )}
                      </div>
                      
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          value={checkoutForm.lastName}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, lastName: e.target.value }))}
                          className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.lastName ? 'border-red-300' : 'border-gray-300'}`}
                          placeholder="Your last name"
                        />
                        {errors.lastName && (
                          <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={checkoutForm.email}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="your@email.com"
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                      )}
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="marketing"
                        checked={checkoutForm.marketingConsent}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, marketingConsent: e.target.checked }))}
                        className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <label htmlFor="marketing" className="text-sm text-gray-600">
                        I'd like to receive helpful relationship insights and updates (you can unsubscribe anytime)
                      </label>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-800 mb-2">Order Summary</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.item.title} (×{item.quantity})</span>
                          <span>{formatCurrency(item.item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {freeCount > 0 && (
                        <>
                          <div className="flex justify-between text-green-600 font-medium pt-2 border-t border-gray-200">
                            <span>Free books:</span>
                            <span>{freeCount}</span>
                          </div>
                          <div className="flex justify-between text-[#D8558E] font-medium">
                            <span>You saved:</span>
                            <span>{formatCurrency(discount)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-gray-200">
                        <span>Total:</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              
              <div className="border-t border-gray-200 p-6">
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCheckout(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all"
                  >
                    Back to Cart
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard size={20} />
                    Complete Purchase
                  </button>
                </div>
                
                <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
                  <span>🔒 Secure checkout</span>
                  <span>📧 Instant download</span>
                  <span>🛡️ Privacy protected</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showBundleUpsell && currentEbook && (
        <BundleUpsellModal
          isOpen={showBundleUpsell}
          currentEbook={currentEbook}
          onSelectBundle={handleBundleSelect}
          onContinueWithoutBundle={handleContinueWithoutBundle}
          onDismiss={handleDismissBundleUpsell}
        />
      )}
    </div>
  );
};

export default Cart;