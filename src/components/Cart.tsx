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

  // ---- Cart Summary (unchanged) ----
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
        
        // Use stored metadata for custom bundles; handle pre-made as before
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
            calculatedSubtotal += ebooksTotal * item.quantity;
            calculatedDiscount += bundleSavings * item.quantity;
            calculatedFreeCount += 1 * item.quantity;
          } else {
            calculatedSubtotal += bundle.price * item.quantity;
          }
        });
        
        // Individual items + dynamic “buy-2-get-1” on singles only
        individualItems.forEach(item => {
          calculatedSubtotal += Number(item.item.price) * item.quantity;
        });
        if (individualItems.length > 0) {
          const allPrices: number[] = [];
          individualItems.forEach(item => {
            for (let i = 0; i < item.quantity; i++) allPrices.push(Number(item.item.price));
          });
          allPrices.sort((a, b) => a - b);
          const groups = Math.floor(allPrices.length / 3);
          for (let i = 0; i < groups; i++) calculatedDiscount += allPrices[i];
          calculatedFreeCount += groups;
        }
        return { subtotal: calculatedSubtotal, discount: calculatedDiscount, total: calculatedSubtotal - calculatedDiscount, freeCount: calculatedFreeCount };
      })()
    : { subtotal: 0, discount: 0, total: 0, freeCount: 0 };

  // ---- Form (unchanged) ----
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!checkoutForm.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!checkoutForm.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!checkoutForm.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(checkoutForm.email)) newErrors.email = 'Please enter a valid email address';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) onCheckout(checkoutForm);
  };

  const handleProceedToCheckout = () => {
    const ebookItems = cart.filter(item => item.type === 'ebook');
    const bundleItems = cart.filter(item => item.type === 'bundle');
    // Show upsell when exactly 1 single ebook in cart and no bundles
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
      const next = new Set(prev);
      next.has(itemId) ? next.delete(itemId) : next.add(itemId);
      return next;
    });
  };

  // Map ebook id -> where it appears in cart (single or inside bundle)
  const getEbookDetails = (): Map<string, { cartItemId: string; type: 'ebook' | 'bundle'; title: string }[]> => {
    const ebookMap = new Map<string, { cartItemId: string; type: 'ebook' | 'bundle'; title: string }[]>();
    cart.forEach(item => {
      if (item.type === 'ebook') {
        const ebook = item.item as EBook;
        if (!ebookMap.has(ebook.id)) ebookMap.set(ebook.id, []);
        ebookMap.get(ebook.id)!.push({ cartItemId: item.id, type: 'ebook', title: ebook.title });
      } else if (item.type === 'bundle') {
        const bundle = item.item as Bundle;
        if (bundle.ebookIds) {
          bundle.ebookIds.forEach(ebookId => {
            if (!ebookMap.has(ebookId)) ebookMap.set(ebookId, []);
            const ebookTitle = bundle.ebooks?.find(b => b.id === ebookId)?.title || 'Unknown';
            ebookMap.get(ebookId)!.push({ cartItemId: item.id, type: 'bundle', title: ebookTitle });
          });
        }
      }
    });
    return ebookMap;
  };

  // ------ FIXED: support bundles of any size >= 3 and stay in CART ------
  const handleBundleSelect = (selectedBooks: EBook[]) => {
    if (!onAddToCart) return;
    if (selectedBooks.length < 3) {
      alert('Pick at least 3 ebooks to build a bundle.');
      return;
    }

    // Prevent mixing the same ebook from another bundle; remove single copies
    const ebookDetails = getEbookDetails();
    const selectedIds = selectedBooks.map(b => b.id);
    const duplicateBundles: string[] = [];
    const itemsToRemove: string[] = [];

    selectedIds.forEach(id => {
      const existing = ebookDetails.get(id);
      if (!existing) return;
      existing.forEach(entry => {
        if (entry.type === 'ebook') {
          itemsToRemove.push(entry.cartItemId);
        } else {
          duplicateBundles.push(entry.title);
        }
      });
    });

    if (duplicateBundles.length > 0) {
      alert(`⚠️ "${duplicateBundles[0]}" is already in a bundle in your cart. Please choose different books.`);
      return;
    }

    // Remove any singles being upgraded into the bundle
    itemsToRemove.forEach(onRemoveItem);

    // Multi-free math: 1 free per 3
    const pricesAsc = [...selectedBooks].sort((a, b) => a.price - b.price);
    const freeCountCalc = Math.floor(selectedBooks.length / 3);
    const freeIds = pricesAsc.slice(0, freeCountCalc).map(b => b.id);
    const subtotalCalc = selectedBooks.reduce((s, b) => s + b.price, 0);
    const discountCalc = pricesAsc.slice(0, freeCountCalc).reduce((s, b) => s + b.price, 0);
    const totalCalc = subtotalCalc - discountCalc;

    const ebookIds = selectedBooks.map(b => b.id);

    const customBundle = {
      id: `bundle-upsell-${Date.now()}`,
      title: `Custom Bundle (${selectedBooks.length} books)`,
      description: `Your bundle: ${selectedBooks.map(b => b.title).join(', ')}`,
      price: totalCalc,
      originalPrice: subtotalCalc,
      savings: discountCalc,
      ebookIds,
      ebooks: selectedBooks,
      freeCount: freeCountCalc
    };

    const cartItem = {
      type: 'bundle' as const,
      id: customBundle.id,
      item: customBundle,
      quantity: 1,
      metadata: {
        subtotal: subtotalCalc,
        discount: discountCalc,
        freeCount: freeCountCalc,
        freeIds, // helps render “FREE” badges in cart UI if you want
        pricingMode: 'bundle_pre_discounted' as const,
        originalItems: selectedBooks.map(b => ({ id: b.id, title: b.title, price: b.price }))
      }
    };

    onAddToCart(cartItem);
    setShowBundleUpsell(false);
    // IMPORTANT: stay in CART, do NOT jump to checkout
    setShowCheckout(false);
  };
  // ---------------------------------------------------------------------

  const handleContinueWithoutBundle = () => {
    setShowBundleUpsell(false);
    setShowCheckout(true);
  };

  const handleDismissBundleUpsell = () => {
    setShowBundleUpsell(false);
    onDismissBundleUpsell?.();
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
                      const bundle = isBundle ? (item.item as Bundle) : null;
                      const booksToDisplay = bundle?.ebooks || item.metadata?.originalItems || null;
                      const canExpand = isBundle && booksToDisplay && booksToDisplay.length > 0;

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
                                      toggleBundleExpansion(item.id);
                                    }}
                                    className="text-pink-600 hover:text-pink-800 transition-colors p-1 bg-purple-50 rounded hover:bg-purple-100"
                                    aria-label={isExpanded ? "Collapse bundle" : "Expand bundle"}
                                    type="button"
                                  >
                                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                  </button>
                                )}
                              </div>

                              {item.type === 'bundle' && (
                                <p className="text-sm text-gray-500 mb-2">
                                  Bundle • {booksToDisplay?.length || 0} eBooks
                                </p>
                              )}

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

              {cart.length > 0 && (
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
              )}
            </>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Contact Information</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                        <input
                          type="text"
                          id="firstName"
                          value={checkoutForm.firstName}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, firstName: e.target.value }))}
                          className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.firstName ? 'border-red-300' : 'border-gray-300'}`}
                          placeholder="Your first name"
                        />
                        {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                        <input
                          type="text"
                          id="lastName"
                          value={checkoutForm.lastName}
                          onChange={(e) => setCheckoutForm(prev => ({ ...prev, lastName: e.target.value }))}
                          className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.lastName ? 'border-red-300' : 'border-gray-300'}`}
                          placeholder="Your last name"
                        />
                        {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        value={checkoutForm.email}
                        onChange={(e) => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))}
                        className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent ${errors.email ? 'border-red-300' : 'border-gray-300'}`}
                        placeholder="your@email.com"
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
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
          onSelectBundle={handleBundleSelect}   // now accepts >=3
          onContinueWithoutBundle={handleContinueWithoutBundle}
          onDismiss={handleDismissBundleUpsell}
        />
      )}
    </div>
  );
};

export default Cart;
