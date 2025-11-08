// File: Cart.tsx

import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Trash2, CreditCard, ChevronDown, ChevronUp, User, Mail } from 'lucide-react';
import { CartItem, CheckoutForm, EBook, Bundle } from '../types';
import { formatCurrency } from '../utils/currency';
import BundleUpsellModal from './BundleUpsellModal';
import FreeEbookProgress from './FreeEbookProgress';
import { supabase } from '../utils/supabase';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: (form?: CheckoutForm) => Promise<void>;
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  if (!isOpen) return null;

  const ebookCount = cart.filter(item => item.type === 'ebook').reduce((sum, item) => sum + item.quantity, 0);

  // Cart Summary Logic
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

        const bundleItems = validItems.filter(item => item.type === 'bundle');
        const individualItems = validItems.filter(item => !bundleItems.includes(item));

        bundleItems.forEach(item => {
          const bundle = item.item as any;
          if (item.metadata?.subtotal && item.metadata?.discount !== undefined) {
            calculatedSubtotal += item.metadata.subtotal * item.quantity;
            calculatedDiscount += item.metadata.discount * item.quantity;
            calculatedFreeCount += (item.metadata.freeCount || 0) * item.quantity;
          } else if (bundle.originalPrice && bundle.savings !== undefined && bundle.ebooks && Array.isArray(bundle.ebooks)) {
            calculatedSubtotal += bundle.originalPrice * item.quantity;
            calculatedDiscount += bundle.savings * item.quantity;
            calculatedFreeCount += 1 * item.quantity;
          } else if (bundle.ebooks && Array.isArray(bundle.ebooks) && bundle.ebooks.length > 0) {
            const ebooksTotal = bundle.ebooks.reduce((s: number, b: any) => s + (b.price || 0), 0);
            const bundlePrice = bundle.price;
            const bundleSavings = ebooksTotal - bundlePrice;
            if (bundleSavings > 0) {
              calculatedSubtotal += ebooksTotal * item.quantity;
              calculatedDiscount += bundleSavings * item.quantity;
              calculatedFreeCount += 1 * item.quantity;
            } else {
              calculatedSubtotal += bundle.price * item.quantity;
            }
          } else {
            calculatedSubtotal += bundle.price * item.quantity;
          }
        });

        individualItems.forEach(item => {
          calculatedSubtotal += Number(item.item.price) * item.quantity;
        });
        if (individualItems.length > 0) {
          const allPrices: number[] = [];
          individualItems.forEach(item => {
            for (let i = 0; i < item.quantity; i++) allPrices.push(Number(item.item.price));
          });
          allPrices.sort((a, b) => a - b);
          const itemsCount = allPrices.length;
          const groupsOfThree = Math.floor(itemsCount / 3);
          for (let i = 0; i < groupsOfThree; i++) {
            calculatedDiscount += allPrices[i];
          }
          calculatedFreeCount += groupsOfThree;
        }
        return { subtotal: calculatedSubtotal, discount: calculatedDiscount, total: calculatedSubtotal - calculatedDiscount, freeCount: calculatedFreeCount };
      })()
    : { subtotal: 0, discount: 0, total: 0, freeCount: 0 };

  // Form Validation Logic
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!checkoutForm.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!checkoutForm.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!checkoutForm.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(checkoutForm.email)) newErrors.email = 'Please enter a valid email address';
    setErrors(prev => ({ ...prev, firstName: newErrors.firstName, lastName: newErrors.lastName, email: newErrors.email }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(prev => ({...prev, submit: ''}));

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);
    try {
      await onCheckout(checkoutForm);
    } catch (error: any) {
      console.error("Checkout failed:", error);
      setErrors(prev => ({ ...prev, submit: error?.message || 'Checkout failed. Please try again.' }));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedToCheckout = async () => {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // User is logged in - proceed directly to Stripe
      setUser(session.user);
      try {
        setIsProcessing(true);
        await onCheckout(); // Call without form data
      } catch (error) {
        console.error('Checkout error:', error);
        setErrors(prev => ({ 
          ...prev, 
          submit: error instanceof Error ? error.message : 'Checkout failed' 
        }));
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // User not logged in - check for bundle upsell first
    const ebookItems = cart.filter(item => item.type === 'ebook');
    const bundleItems = cart.filter(item => item.type === 'bundle');
    
    if (!bundleUpsellDismissed && ebookItems.length === 1 && bundleItems.length === 0 && ebookItems[0].quantity === 1) {
      const ebook = ebookItems[0].item as EBook;
      setCurrentEbook(ebook);
      setShowBundleUpsell(true);
      return;
    }

    // Show login prompt for non-logged-in users
    setShowLoginPrompt(true);
  };

  const toggleBundleExpansion = (itemId: string) => {
    setExpandedBundles(prev => {
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  const getEbookDetails = (): Map<string, { cartItemId: string; type: 'ebook' | 'bundle'; title: string }[]> => {
    const ebookMap = new Map<string, { cartItemId: string; type: 'ebook' | 'bundle'; title: string }[]>();
    cart.forEach(item => {
      if (item.type === 'ebook') {
        const ebook = item.item as EBook;
        if (!ebookMap.has(ebook.id)) ebookMap.set(ebook.id, []);
        ebookMap.get(ebook.id)!.push({ cartItemId: item.id, type: 'ebook', title: ebook.title });
      } else if (item.type === 'bundle') {
        const bundle = item.item as Bundle;
        const ebookIds = bundle.ebookIds || item.metadata?.originalItems?.map((i:any) => i.id);
        const ebooksInBundle = bundle.ebooks || item.metadata?.originalItems;

        if (ebookIds && Array.isArray(ebookIds) && ebooksInBundle && Array.isArray(ebooksInBundle)) {
          ebookIds.forEach((ebookId:string) => {
            if (!ebookMap.has(ebookId)) ebookMap.set(ebookId, []);
            const ebookInBundle = ebooksInBundle.find((b: any) => b.id === ebookId);
            const ebookTitle = ebookInBundle?.title || 'Unknown';
            ebookMap.get(ebookId)!.push({ cartItemId: item.id, type: 'bundle', title: ebookTitle });
          });
        }
      }
    });
    return ebookMap;
  };

  const handleBundleSelect = (selectedBooks: EBook[]) => {
    if (!onAddToCart) return;
    if (selectedBooks.length < 3) {
      alert('Pick at least 3 ebooks to build a bundle.');
      return;
    }

    const ebookDetails = getEbookDetails();
    const selectedIds = selectedBooks.map(b => b.id);
    const duplicateBundles: string[] = [];
    const itemsToRemove: string[] = [];

    selectedIds.forEach(id => {
      const existing = ebookDetails.get(id);
      if (!existing) return;
      existing.forEach(entry => {
        if (entry.type === 'ebook') {
          if (!itemsToRemove.includes(entry.cartItemId)) itemsToRemove.push(entry.cartItemId);
        } else {
           const bundleInCart = cart.find(cartItem => cartItem.id === entry.cartItemId && cartItem.type === 'bundle');
           if(bundleInCart) {
             const bundleEbookIds = (bundleInCart.item as Bundle).ebookIds || bundleInCart.metadata?.originalItems?.map((i:any) => i.id) || [];
             if (bundleEbookIds.includes(id) && !duplicateBundles.includes(entry.title)){
                duplicateBundles.push(entry.title);
             }
           }
        }
      });
    });

    if (duplicateBundles.length > 0) {
      alert(`One or more selected books are already part of another bundle in your cart (${duplicateBundles.join(', ')}). Please choose different books or remove the existing bundle.`);
      return;
    }

    itemsToRemove.forEach(onRemoveItem);

    const pricesAsc = [...selectedBooks].sort((a, b) => a.price - b.price);
    const freeCountCalc = Math.floor(selectedBooks.length / 3);
    const freeIds = pricesAsc.slice(0, freeCountCalc).map(b => b.id);
    const subtotalCalc = selectedBooks.reduce((s, b) => s + b.price, 0);
    const discountCalc = pricesAsc.slice(0, freeCountCalc).reduce((s, b) => s + b.price, 0);
    const totalCalc = subtotalCalc - discountCalc;
    const ebookIds = selectedBooks.map(b => b.id);

    const customBundle: Bundle = {
      id: `custom-bundle-${Date.now()}`,
      title: `Custom Bundle (${selectedBooks.length} Ebooks)`,
      description: `Includes: ${selectedBooks.map(b => b.title).join(', ')}`,
      price: totalCalc,
      originalPrice: subtotalCalc,
      savings: discountCalc,
      ebookIds,
      ebooks: selectedBooks,
      isCustom: true,
    };

    const cartItem: CartItem = {
      type: 'bundle',
      id: customBundle.id,
      item: customBundle,
      quantity: 1,
      metadata: {
        subtotal: subtotalCalc,
        discount: discountCalc,
        freeCount: freeCountCalc,
        freeIds,
        pricingMode: 'bundle_calculated',
        originalItems: selectedBooks.map(b => ({ id: b.id, title: b.title, price: b.price }))
      }
    };

    onAddToCart(cartItem);
    setShowBundleUpsell(false);
    setShowCheckout(false);
  };

  const handleContinueWithoutBundle = () => {
    setShowBundleUpsell(false);
    setShowLoginPrompt(true);
  };

  const handleDismissBundleUpsell = () => {
    setShowBundleUpsell(false);
    onDismissBundleUpsell?.();
  };

  // Login Prompt Modal
  const LoginPromptModal = () => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 animate-fadeIn">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] rounded-full mb-4">
            <User size={32} className="text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Sign In to Continue</h3>
          <p className="text-gray-600">
            Create an account or sign in to complete your purchase and access your ebooks instantly.
          </p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => {
              onClose();
              window.location.href = '/portal/login?redirect=checkout';
            }}
            className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <User size={20} />
            Sign In / Register
          </button>
          
          <button
            onClick={() => {
              setShowLoginPrompt(false);
              setShowCheckout(true);
            }}
            className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
          >
            <Mail size={20} />
            Continue as Guest
          </button>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center mb-3">
            ✨ Benefits of creating an account:
          </p>
          <ul className="text-xs text-gray-600 space-y-2">
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Access your library anytime, anywhere
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Faster checkout on future purchases
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              Track your reading progress
            </li>
          </ul>
        </div>
      </div>
    </div>
  );

  // Main Component Return
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
                disabled={isProcessing}
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            {cart.length > 0 && !showCheckout && (
              <div className="px-6 pb-4">
                <FreeEbookProgress ebookCount={ebookCount} compact />
              </div>
            )}
          </div>

          {/* Conditional Rendering: Cart View or Checkout View */}
          {!showCheckout ? (
            <>
              {/* Cart View */}
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
                      const bundle = isBundle ? (item.item as Bundle) : null;
                      const booksInItem = item.metadata?.originalItems || bundle?.ebooks || null;
                      const canExpand = isBundle && booksInItem && booksInItem.length > 0;

                      return (
                        <div key={item.id} className="bg-gray-50 rounded-lg p-4 transition-all duration-300 ease-in-out">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-gray-800 truncate mr-1">{item.item.title}</h3>
                                {canExpand && (
                                  <button
                                     onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBundleExpansion(item.id); }}
                                     className="text-pink-600 hover:text-pink-800 transition-colors p-1 bg-purple-50 rounded hover:bg-purple-100 flex-shrink-0"
                                     aria-label={isExpanded ? "Collapse bundle" : "Expand bundle"}
                                     type="button"
                                   >
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </button>
                                )}
                              </div>
                              {isBundle && (
                                <p className="text-sm text-gray-500 mb-2">
                                  Bundle • {booksInItem?.length || 0} Ebooks
                                </p>
                              )}
                              {isExpanded && booksInItem && (
                                <div className="mt-2 mb-2 pl-4 border-l-2 border-pink-300 space-y-1 bg-white rounded p-3 shadow-inner">
                                  <p className="text-xs font-semibold text-pink-600 uppercase mb-2 tracking-wide">Books in this bundle:</p>
                                  {booksInItem.map((book: any, idx: number) => (
                                    <div key={book.id || idx} className="text-sm text-gray-700 flex items-center justify-between gap-2 py-1 hover:bg-gray-50 rounded px-1">
                                      <div className="flex items-center gap-2">
                                         <span className="text-pink-400 font-bold">•</span>
                                         <span className="flex-1 truncate">{book.title}</span>
                                      </div>
                                       {item.metadata?.freeIds?.includes(book.id) ? (
                                        <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">FREE</span>
                                       ) : (
                                        <span className="text-gray-500 text-xs font-medium">{formatCurrency(book.price)}</span>
                                       )}
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
                               className="text-red-500 hover:text-red-700 transition-colors flex-shrink-0 mt-1"
                               aria-label={`Remove ${item.item.title}`}
                             >
                              <Trash2 size={16} />
                            </button>
                          </div>
                           <div className="flex items-center justify-end mt-3">
                            <p className="font-semibold text-gray-800 text-right">
                              {formatCurrency(item.item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cart Footer */}
              {cart.length > 0 && (
                <div className="border-t border-gray-200 p-6 bg-white">
                   {discount > 0 && (
                     <div className="flex items-center justify-between mb-2 text-sm">
                       <span className="text-gray-600">Subtotal:</span>
                       <span className="text-gray-900 line-through">{formatCurrency(subtotal)}</span>
                     </div>
                   )}
                   {freeCount > 0 && (
                     <>
                       <div className="flex items-center justify-between mb-1 text-sm">
                         <span className="text-green-600 font-medium flex items-center gap-1">
                           🎁 Free Books Applied:
                         </span>
                         <span className="text-green-600 font-bold">{freeCount}</span>
                       </div>
                       <div className="flex items-center justify-between mb-2 text-sm">
                         <span className="text-[#D8558E] font-medium">Bundle Savings:</span>
                         <span className="text-[#D8558E] font-bold">-{formatCurrency(discount)}</span>
                       </div>
                     </>
                   )}
                   <div className={`flex items-center justify-between text-xl font-bold mb-4 pt-2 ${discount > 0 ? 'border-t border-gray-200' : ''}`}>
                     <span>Total:</span>
                     <span>{formatCurrency(total)}</span>
                   </div>
                   {errors.submit && <p className="text-red-600 text-sm mb-3 text-center font-medium">{errors.submit}</p>}
                   <button
                     onClick={handleProceedToCheckout}
                     disabled={isProcessing}
                     className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 shadow disabled:opacity-70 disabled:cursor-not-allowed"
                   >
                     {isProcessing ? (
                       <>
                         <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                         Processing...
                       </>
                     ) : (
                       <>
                         <CreditCard size={20} />
                         Proceed to Checkout
                       </>
                     )}
                   </button>
                 </div>
              )}
            </>
          ) : (
            <>
              {/* Checkout View - Guest Checkout Form */}
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSubmit} id="checkout-form" className="space-y-6">
                   <div>
                     <h3 className="text-lg font-semibold mb-4 text-gray-800">Contact Information</h3>
                     <div className="grid grid-cols-2 gap-4 mb-4">
                       <div>
                         <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                         <input
                           type="text" id="firstName" value={checkoutForm.firstName} required
                           onChange={(e) => { setCheckoutForm(prev => ({ ...prev, firstName: e.target.value })); setErrors(prev => ({...prev, firstName: ''})); }}
                           className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none focus:border-transparent transition-colors ${errors.firstName ? 'border-red-400 ring-red-300' : 'border-gray-300'}`}
                           placeholder="Your first name"
                         />
                         {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
                       </div>
                       <div>
                         <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                         <input
                            type="text" id="lastName" value={checkoutForm.lastName} required
                            onChange={(e) => { setCheckoutForm(prev => ({ ...prev, lastName: e.target.value })); setErrors(prev => ({...prev, lastName: ''})); }}
                            className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none focus:border-transparent transition-colors ${errors.lastName ? 'border-red-400 ring-red-300' : 'border-gray-300'}`}
                           placeholder="Your last name"
                         />
                         {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
                       </div>
                     </div>
                     <div className="mb-4">
                       <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                       <input
                         type="email" id="email" value={checkoutForm.email} required
                         onChange={(e) => { setCheckoutForm(prev => ({ ...prev, email: e.target.value })); setErrors(prev => ({...prev, email: ''})); }}
                         className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none focus:border-transparent transition-colors ${errors.email ? 'border-red-400 ring-red-300' : 'border-gray-300'}`}
                         placeholder="your@email.com"
                       />
                       {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                     </div>
                     <div className="flex items-start gap-3">
                       <input
                         type="checkbox" id="marketing" checked={checkoutForm.marketingConsent}
                         onChange={(e) => setCheckoutForm(prev => ({ ...prev, marketingConsent: e.target.checked }))}
                         className="mt-1 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                       />
                       <label htmlFor="marketing" className="text-sm text-gray-600 cursor-pointer">
                         I'd like to receive helpful relationship insights and updates (you can unsubscribe anytime)
                       </label>
                     </div>
                   </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                     <h4 className="font-medium text-gray-800 mb-3 text-base">Order Summary</h4>
                     <div className="text-sm text-gray-600 space-y-2">
                        {cart.map((item) => (
                         <div key={item.id} className="flex justify-between items-center">
                           <span className="truncate mr-2">{item.item.title} (×{item.quantity})</span>
                           <span className="font-medium text-gray-800 flex-shrink-0">{formatCurrency(item.item.price * item.quantity)}</span>
                         </div>
                       ))}
                       {freeCount > 0 && (
                         <>
                           <div className="flex justify-between text-green-600 font-medium pt-2 border-t border-gray-200 mt-2">
                             <span>🎁 Free Books Applied:</span>
                             <span className='font-bold'>{freeCount}</span>
                           </div>
                           <div className="flex justify-between text-[#D8558E] font-medium">
                             <span>Bundle Savings:</span>
                             <span className='font-bold'>-{formatCurrency(discount)}</span>
                           </div>
                         </>
                       )}
                       <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-300 mt-3 text-base">
                         <span>Total:</span>
                         <span>{formatCurrency(total)}</span>
                       </div>
                     </div>
                   </div>
                 </form>
               </div>

              {/* Checkout Footer */}
              <div className="border-t border-gray-200 p-6 bg-white">
                 {errors.submit && <p className="text-red-600 text-sm mb-3 text-center font-medium">{errors.submit}</p>}

                 <div className="flex gap-3">
                   <button
                     type="button"
                     onClick={() => !isProcessing && setShowCheckout(false)}
                     disabled={isProcessing}
                     className="px-6 py-3 border border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     Back to Cart
                   </button>

                   <button
                      type="submit"
                      form="checkout-form"
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className="flex-1 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow"
                    >
                     {isProcessing ? (
                       <>
                         <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                         Processing...
                       </>
                     ) : (
                       <>
                         <CreditCard size={20} />
                         Complete Purchase
                       </>
                     )}
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

       {/* Bundle Upsell Modal */}
       {showBundleUpsell && currentEbook && (
         <BundleUpsellModal
           isOpen={showBundleUpsell}
           currentEbook={currentEbook}
           onSelectBundle={handleBundleSelect}
           onContinueWithoutBundle={handleContinueWithoutBundle}
           onDismiss={handleDismissBundleUpsell}
         />
       )}

       {/* Login Prompt Modal */}
       {showLoginPrompt && <LoginPromptModal />}
     </div>
   );
 };

 export default Cart;                     