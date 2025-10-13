import React, { useState } from 'react';
import { X, ShoppingBag, Trash2, CreditCard } from 'lucide-react';
import { CartItem, CheckoutForm, EBook, Bundle } from '../types';
import { formatCurrency } from '../utils/currency';
import { createCheckoutSession } from '../utils/stripe';
import { SecurityValidator } from '../utils/security';
import { getCompanionRecommendation } from '../data/categoryPairs';
import { ebooks } from '../data/products';
import UpsellModal from './UpsellModal';
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
  upsellDismissed?: boolean;
  onDismissUpsell?: () => void;
  pair10EbookIds?: string[];
  getPair10Discount?: () => { discount: number; affectedItems: CartItem[] };
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
  onApplyDiscount,
  upsellDismissed = false,
  onDismissUpsell,
  pair10EbookIds = [],
  getPair10Discount
}) => {
  const [checkoutForm, setCheckoutForm] = useState<CheckoutForm>({
    firstName: '',
    lastName: '',
    email: '',
    marketingConsent: false
  });
  const [showCheckout, setShowCheckout] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [upsellData, setUpsellData] = useState<{ primary: EBook; companion: EBook } | null>(null);

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
        
        validItems.forEach(item => {
          const itemPrice = Number(item.item.price) * item.quantity;
          calculatedSubtotal += itemPrice;
          
          // Check if this is a custom bundle with pre-calculated discount
          if (item.item.title?.includes('Custom Bundle') && 'savings' in item.item) {
            calculatedDiscount += (item.item as any).savings * item.quantity;
            calculatedFreeCount += ((item.item as any).freeCount || 0) * item.quantity;
          }
        });
        
        // Apply dynamic bundling logic only for individual items
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
              calculatedDiscount += allPrices[i];
            }
            calculatedFreeCount += groupsOf3;
          }
        }
        
        const calculatedTotal = calculatedSubtotal - calculatedDiscount;
        
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
    
    const firstNameValidation = SecurityValidator.validateName(checkoutForm.firstName, 'First name');
    if (!firstNameValidation.isValid) {
      newErrors.firstName = firstNameValidation.error || 'Invalid first name';
    }
    
    const lastNameValidation = SecurityValidator.validateName(checkoutForm.lastName, 'Last name');
    if (!lastNameValidation.isValid) {
      newErrors.lastName = lastNameValidation.error || 'Invalid last name';
    }
    
    const emailValidation = SecurityValidator.validateEmail(checkoutForm.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.error || 'Invalid email';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      handleCheckout();
    }
  };

  const handleCheckout = async () => {
    // Additional security check before checkout
    if (cart.length === 0 || cart.length > 20) {
      alert('Invalid cart contents. Please refresh and try again.');
      return;
    }

    // Validate all cart items before checkout
    for (const item of cart) {
      const itemValidation = SecurityValidator.validateCartItem(item);
      if (!itemValidation.isValid) {
        alert('Invalid cart item detected. Please refresh and try again.');
        return;
      }
    }

    try {
      // Transform cart items to match edge function expectations
      const transformedItems = cart.map(cartItem => {
        // Extract the base product ID (remove timestamp suffix if present)
        let productId = cartItem.item.id;
        
        // For custom bundles, we need to map to the correct bundle ID
        if (cartItem.item.title?.includes('Custom Bundle')) {
          // This is a custom bundle, we need to determine the correct bundle type
          // For now, we'll use a generic approach - you may need to adjust this
          const ebookCount = (cartItem.item as any).ebooks?.length || 0;
          if (ebookCount >= 3) {
            // Map to appropriate bundle based on the books included
            productId = 'manipulation-recovery'; // Default fallback
          }
        }
        
        return {
          type: cartItem.type,
          id: cartItem.id,
          quantity: cartItem.quantity,
          item: {
            ...cartItem.item,
            id: productId // Use the clean product ID
          }
        };
      });

      const checkoutRequest = {
        items: transformedItems,
        customer: checkoutForm,
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/checkout/cancel`
      };

      // Log checkout attempt (without sensitive data)
      console.log('Checkout attempt:', {
        itemCount: checkoutRequest.items.length,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent.substring(0, 50)
      });

      const { url } = await createCheckoutSession(checkoutRequest);
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout failed:', error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Checkout failed';
      if (errorMessage.includes('rate limit') || errorMessage.includes('Too many')) {
        alert('Too many checkout attempts. Please wait a few minutes before trying again.');
      } else if (errorMessage.includes('Invalid')) {
        alert('Please check your information and try again.');
      } else {
        alert('Checkout failed. Please try again or contact support.');
      }
    }
  };

  const handleProceedToCheckout = () => {
    const ebookItems = cart.filter(item => item.type === 'ebook').map(item => item.item as EBook);
    const bundleCount = cart.filter(item => item.type === 'bundle').length;

    if (!upsellDismissed && ebookItems.length === 1 && bundleCount === 0) {
      const primaryEbook = ebookItems[0];
      const eligibleCategories = ['Dating & Red Flags', 'Manipulation & Toxic Relationships'];

      if (eligibleCategories.includes(primaryEbook.category)) {
        const companion = getCompanionRecommendation(primaryEbook, ebookItems, ebooks);

        if (companion) {
          setUpsellData({ primary: primaryEbook, companion });
          setShowUpsellModal(true);
          return;
        }
      }
    }

    setShowCheckout(true);
  };

  const handleAddCompanionAndCheckout = () => {
    if (upsellData && onAddToCart && onApplyDiscount) {
      const primaryEbook = upsellData.primary;
      const companionEbook = upsellData.companion;

      onAddToCart(companionEbook);
      onApplyDiscount('PAIR10', [primaryEbook.id, companionEbook.id]);

      setShowUpsellModal(false);
      setShowCheckout(false);
    }
  };

  const handleContinueWithoutAdding = () => {
    setShowUpsellModal(false);
    setShowCheckout(true);
  };

  const handleDismissUpsell = () => {
    setShowUpsellModal(false);
    if (onDismissUpsell) {
      onDismissUpsell();
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
                  <>
                    {appliedDiscounts.includes('PAIR10') && pair10EbookIds.length === 2 && (
                      <div className="bg-gradient-to-r from-pink-50 to-purple-50 border-2 border-pink-300 rounded-xl p-4 mb-4">
                        <p className="text-pink-700 font-bold text-center text-lg">
                          ✨ 10% OFF applied to BOTH titles ✨
                        </p>
                      </div>
                    )}
                    <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-800 mb-1">
                              {item.item.title}
                            </h3>
                            {item.type === 'bundle' && (
                              <p className="text-sm text-gray-500 mb-2">
                                {item.metadata?.pricingMode === 'bundle_pre_discounted' ? (
                                  <>
                                    Bundle • {item.metadata.originalItems?.length || 0} eBooks
                                    <br />
                                    <span className="text-xs text-gray-400">
                                      Total: {formatCurrency(item.item.price)} • Avg {formatCurrency(Math.round(item.item.price / (item.metadata.originalItems?.length || 1)))}/book
                                    </span>
                                  </>
                                ) : (
                                  `Bundle • ${(item.item as Bundle).ebooks?.length || 0} eBooks`
                                )}
                              </p>
                            )}
                            {item.type === 'ebook' && (
                              <>
                                {appliedDiscounts.includes('PAIR10') && pair10EbookIds.includes((item.item as EBook).id) ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400 line-through">
                                      {formatCurrency(item.item.price)}
                                    </span>
                                    <span className="text-sm font-bold text-pink-600">
                                      {formatCurrency(item.item.price * 0.9)} each
                                    </span>
                                    <span className="bg-pink-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                      10% OFF
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-600">
                                    {formatCurrency(item.item.price)} each
                                  </p>
                                )}
                              </>
                            )}
                            {item.metadata?.pricingMode === 'bundle_pre_discounted' && (
                              <div className="mt-2 space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-green-600 font-medium">Free books applied:</span>
                                  <span className="text-green-600 font-bold">{item.metadata.freeCount}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-[#D8558E] font-medium">Saved you:</span>
                                  <span className="text-[#D8558E] font-bold">{formatCurrency(item.metadata.discount || 0)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => onRemoveItem(item.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div></div>
                          {item.type === 'ebook' && appliedDiscounts.includes('PAIR10') && pair10EbookIds.includes((item.item as EBook).id) ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-400 line-through text-sm">
                                {formatCurrency(item.item.price * item.quantity)}
                              </span>
                              <span className="font-bold text-pink-600 text-lg">
                                {formatCurrency(item.item.price * item.quantity * 0.9)}
                              </span>
                            </div>
                          ) : (
                            <p className="font-semibold text-gray-800">
                              {formatCurrency(item.item.price * item.quantity)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                    </div>
                  </>
                )}
              </div>

              {cart.length > 0 && (() => {
                const pair10Data = getPair10Discount ? getPair10Discount() : { discount: 0, affectedItems: [] };
                const hasPair10 = appliedDiscounts.includes('PAIR10') && pair10Data.discount > 0;

                const originalTotal = cart.reduce((sum, item) => sum + (item.item.price * item.quantity), 0);
                const finalTotal = hasPair10 ? total - pair10Data.discount : total;

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
                          <span className="text-green-600 font-medium">Free books applied:</span>
                          <span className="text-green-600 font-bold">{freeCount}</span>
                        </div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[#D8558E] font-medium">Saved you:</span>
                          <span className="text-[#D8558E] font-bold">{formatCurrency(discount)}</span>
                        </div>
                      </>
                    )}

                    {hasPair10 && (
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-3 mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-pink-800 font-semibold">You saved 10%:</span>
                          <span className="text-pink-800 font-bold">{formatCurrency(pair10Data.discount)}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-pink-700">
                          <span>Before: <span className="font-bold">{formatCurrency(originalTotal)}</span></span>
                          <span>→ Now: <span className="font-bold">{formatCurrency(finalTotal)}</span></span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xl font-bold mb-4">
                      <span>Total:</span>
                      <span>{formatCurrency(finalTotal)}</span>
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
                            <span>Free books applied:</span>
                            <span>{freeCount}</span>
                          </div>
                          <div className="flex justify-between text-[#D8558E] font-medium">
                            <span>Saved you:</span>
                            <span>{formatCurrency(discount)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-gray-200">
                        <span>Total:</span>
                        <span>
                          {appliedDiscounts.includes('PAIR10') && cart.filter(item => item.type === 'ebook').length >= 2
                            ? formatCurrency(total - (cart.filter(item => item.type === 'ebook').reduce((sum, item) => sum + (item.item.price * item.quantity), 0) * 0.1))
                            : formatCurrency(total)
                          }
                        </span>
                      </div>
                      
                      {/* Show applied discounts in checkout */}
                      {appliedDiscounts.includes('PAIR10') && cart.filter(item => item.type === 'ebook').length >= 2 && (
                        <div className="pt-2 border-t border-gray-200 mt-2">
                          <div className="flex justify-between text-sm text-green-600">
                            <span>PAIR10 Discount:</span>
                            <span>-{formatCurrency(cart.filter(item => item.type === 'ebook').reduce((sum, item) => sum + (item.item.price * item.quantity), 0) * 0.1)}</span>
                          </div>
                        </div>
                      )}
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
                    onClick={handleCheckout}
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

      {showUpsellModal && upsellData && (
        <UpsellModal
          isOpen={showUpsellModal}
          primaryEbook={upsellData.primary}
          companionEbook={upsellData.companion}
          onAddAndCheckout={handleAddCompanionAndCheckout}
          onContinueWithoutAdding={handleContinueWithoutAdding}
          onDismiss={handleDismissUpsell}
          currentEbookCount={ebookCount}
        />
      )}
    </div>
  );
};

export default Cart;