import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Check, X, Info, ChevronDown, Trash2 } from 'lucide-react';
import { EBook, CartItem } from '../types';
import { trackEvent } from '../utils/analytics';
import { formatCurrency } from '../utils/currency';

interface CustomBundleProps {
  ebooks: EBook[];
  onAddToCart: (item: CartItem) => void;
}

// --- helper: simple mobile check (<= 1024px) ---
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 1024px)');
    const update = () => setIsMobile(mql.matches);
    update();
    mql.addEventListener?.('change', update);
    return () => mql.removeEventListener?.('change', update);
  }, []);
  return isMobile;
};

const CustomBundle: React.FC<CustomBundleProps> = ({ ebooks, onAddToCart }) => {
  const [selectedBooks, setSelectedBooks] = useState<EBook[]>([]);
  const [isSticky, setIsSticky] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  const isMobile = useIsMobile();

  // Mobile bottom-sheet state for the existing summary panel
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const dragStartYRef = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);

  const openMobileSheet = () => {
    setIsMobileSheetOpen(true);
    setDragY(0);
  };
  const closeMobileSheet = () => {
    setIsMobileSheetOpen(false);
    setDragY(0);
    dragStartYRef.current = null;
  };

  // drag handlers
  const onSheetTouchStart = (e: React.TouchEvent) => {
    dragStartYRef.current = e.touches[0].clientY;
    setDragY(0);
  };
  const onSheetTouchMove = (e: React.TouchEvent) => {
    if (dragStartYRef.current == null) return;
    const delta = e.touches[0].clientY - dragStartYRef.current;
    setDragY(Math.max(0, delta));
  };
  const onSheetTouchEnd = () => {
    if (dragY > 80) {
      closeMobileSheet();
    } else {
      setDragY(0); // snap back
    }
  };

  // Handle sticky CTA (desktop)
  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById('custom-bundle');
      if (section) {
        const rect = section.getBoundingClientRect();
        setIsSticky(rect.top <= 100 && rect.bottom >= 200);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleBook = (book: EBook) => {
    setSelectedBooks(prev => {
      const exists = prev.find(b => b.id === book.id);
      let next: EBook[];

      if (exists) {
        next = prev.filter(b => b.id !== book.id);
      } else {
        next = [...prev, book];

        // Unlock free book toast on multiples of 3
        if (next.length > 0 && next.length % 3 === 0) {
          setToastMessage('🎉 You unlocked 1 FREE book!');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }

        // Auto-open the sheet on mobile when a book is added
        if (isMobile && !isMobileSheetOpen) openMobileSheet();
      }

      return next;
    });
  };

  const removeBookFromSheet = (book: EBook) => {
    trackEvent('bundle_item_removed', { id: book.id, title: book.title, source: 'sheet' });
    setSelectedBooks(prev => {
      const next = prev.filter(b => b.id !== book.id);
      announceToScreenReader(`Removed ${book.title}. ${next.length} selected.`);
      return next;
    });
  };

  const clearAllSelections = () => {
    trackEvent('bundle_cleared_all', { previous_count: selectedBooks.length });
    setSelectedBooks([]);
    announceToScreenReader('All selections cleared.');
  };

  const togglePanelCollapse = () => {
    const newState = !isPanelCollapsed;
    setIsPanelCollapsed(newState);
    trackEvent('bundle_panel_toggled', {
      action: newState ? 'collapsed' : 'expanded',
      selected_count: selectedBooks.length
    });
    announceToScreenReader(`Bundle panel ${newState ? 'collapsed' : 'expanded'}.`);
  };

  const isSelected = (book: EBook) => selectedBooks.find(b => b.id === book.id);

  // Pricing
  const totalSelected = selectedBooks.length;
  const freeCount = Math.floor(totalSelected / 3);
  const subtotal = selectedBooks.reduce((sum, book) => sum + book.price, 0);
  let discount = 0;
  if (freeCount > 0) {
    const sorted = [...selectedBooks].sort((a, b) => a.price - b.price);
    discount = sorted.slice(0, freeCount).reduce((s, b) => s + b.price, 0);
  }
  const total = subtotal - discount;

  const totalPages = selectedBooks.reduce((s, b) => s + b.pages, 0);
  const totalAudioMinutes = selectedBooks.reduce((s, b) => s + b.audioMinutes, 0);

  const handleAddToCart = () => {
    if (selectedBooks.length < 3) return;

    trackEvent('bundle_custom_created', {
      selected_books: selectedBooks.map(b => ({ id: b.id, title: b.title, price: b.price })),
      total_selected: totalSelected,
      free_count: freeCount,
      subtotal,
      discount,
      total
    });

    const customBundle = {
      id: `custom-bundle-${Date.now()}`,
      title: `Custom Bundle (${totalSelected} books)`,
      description: `Your personalized selection: ${selectedBooks.map(b => b.title).join(', ')}`,
      price: total,
      originalPrice: subtotal,
      savings: discount,
      ebookIds: selectedBooks.map(b => b.id),
      ebooks: selectedBooks,
      freeCount
    };

    const cartItem = {
      type: 'bundle' as const,
      id: `custom-bundle-${Date.now()}`,
      item: customBundle,
      quantity: 1,
      metadata: {
        subtotal,
        discount,
        freeCount,
        pricingMode: 'bundle_pre_discounted' as const,
        originalItems: selectedBooks.map(b => ({ title: b.title, price: b.price }))
      }
    };

    onAddToCart(cartItem);
    setSelectedBooks([]);
    if (isMobile) closeMobileSheet();
  };

  return (
    <section id="custom-bundle" className="py-16 bg-gradient-to-br from-purple-50 to-pink-50 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
              Create Your Own Bundle
            </span>
          </h2>
          <p className="text-2xl md:text-3xl text-gray-700 font-medium mb-4">Your Story, Your Choice</p>
          <p className="text-xl text-gray-600 mb-2">Pick any 3 or more eBooks from all categories and you'll always get one free.</p>
          <p className="text-lg text-gray-500">Every 3 you pick unlocks 1 free — Mix & match as you like!</p>
        </div>

        {/* Desktop Live Counter */}
        <div className="hidden md:block max-w-md mx-auto mb-8 bg-white rounded-2xl shadow-lg p-6 border-2 border-purple-100">
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <div className="text-2xl font-bold text-gray-800">{totalSelected}</div>
              <div className="text-sm text-gray-600">Selected</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                {freeCount}
                <Info size={16} className="text-gray-400" />
              </div>
              <div className="text-sm text-gray-600">Free books</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-[#D8558E]">{formatCurrency(discount)}</div>
              <div className="text-sm text-gray-600">You save</div>
            </div>
          </div>

          {selectedBooks.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1"><span>📄</span><span>Total pages (approx): <strong>{totalPages}</strong></span></div>
                <div className="flex items-center gap-1"><span>🔊</span><span>Total audio: <strong>{totalAudioMinutes} min</strong></span></div>
              </div>
            </div>
          )}
        </div>

        {/* Toast */}
        {showToast && (
          <div className="fixed top-20 right-4 z-50 animate-slide-in">
            <div className="bg-white border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-sm">
              <div className="text-green-600 font-medium">{toastMessage}</div>
            </div>
          </div>
        )}

        {/* Selection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {ebooks.map((book) => {
            const selected = isSelected(book);
            return (
              <div
                key={book.id}
                className={`relative bg-white rounded-2xl shadow-lg transition-all duration-300 cursor-pointer ${
                  selected ? 'ring-4 ring-[hsl(333,65%,59%)] shadow-xl transform scale-105'
                           : 'hover:shadow-xl hover:transform hover:-translate-y-1'
                }`}
                onClick={() => toggleBook(book)}
              >
                {/* Selection indicator */}
                <div className={`absolute top-4 right-4 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                  selected ? 'bg-[hsl(333,65%,59%)] border-[hsl(333,65%,59%)] text-white'
                           : 'border-gray-300 bg-white'
                }`}>
                  {selected && <Check size={16} />}
                </div>

                {/* Cover */}
                <div className="relative h-40 overflow-hidden rounded-t-2xl">
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h4 className="font-heading text-lg font-bold mb-2">
                    <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                      {book.title}
                    </span>
                  </h4>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{book.description}</p>

                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1"><span>📄</span><span>{book.pages}+ pages</span></div>
                    <div className="flex items-center gap-1"><span>🔊</span><span>{book.audioMinutes}+ min voice</span></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">{formatCurrency(book.price)}</span>
                    {book.badges.length > 0 && (
                      <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-2 py-1 rounded-full text-xs font-semibold">
                        {book.badges[0]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* === SUMMARY PANEL === */}
        {selectedBooks.length > 0 && (
          <>
            {/* Floating reopen button (mobile) when sheet hidden */}
            {isMobile && !isMobileSheetOpen && (
              <button
                onClick={openMobileSheet}
                className="lg:hidden fixed bottom-4 right-4 z-40 px-4 py-3 rounded-full shadow-lg bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white font-semibold"
              >
                View selection ({selectedBooks.length})
              </button>
            )}

            {/* Desktop inline/sticky panel */}
            {!isMobile && (
              <div className={`bg-white rounded-2xl shadow-xl border-2 border-[hsl(333,65%,59%)] transition-all duration-300 ${isSticky ? 'fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto' : ''} ${isPanelCollapsed ? 'lg:p-6' : 'p-6'}`}>
                {/* Desktop header controls (collapse toggle) */}
                <div className="hidden lg:flex justify-end -mt-2 -mr-2">
                  <button
                    onClick={togglePanelCollapse}
                    className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 flex items-center justify-center"
                    aria-label={isPanelCollapsed ? 'Expand panel' : 'Collapse panel'}
                  >
                    <ChevronDown size={18} className={isPanelCollapsed ? '' : 'rotate-180 transition-transform'} />
                  </button>
                </div>

                <div className={`${isPanelCollapsed ? 'hidden lg:flex' : 'flex'} flex-col lg:flex-row items-start lg:items-center gap-6`}>
                  {/* Selected list (desktop) */}
                  <div className="flex-1 hidden lg:block">
                    <h4 className="font-heading text-lg font-bold mb-3">
                      <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                        Your Custom Bundle ({selectedBooks.length} books)
                      </span>
                    </h4>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto overscroll-contain" style={{ scrollbarWidth: 'thin' }}>
                        {selectedBooks.map((book) => (
                          <div key={book.id} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 flex-shrink-0">
                            <span className="text-sm font-medium">{book.title}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleBook(book); }}
                              className="text-gray-500 hover:text-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-center gap-6 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1"><span>📄</span><span>Total pages (approx): <strong>{totalPages}</strong></span></div>
                      <div className="flex items-center gap-1"><span>🔊</span><span>Total audio: <strong>{totalAudioMinutes} min</strong></span></div>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="text-center lg:text-right min-w-[200px] w-full lg:w-auto">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-gray-600"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                      {freeCount > 0 && (
                        <>
                          <div className="flex justify-between text-green-600 font-medium"><span>Free books applied:</span><span className="font-bold">{freeCount}</span></div>
                          <div className="flex justify-between text-[#D8558E] font-medium"><span>Saved you:</span><span className="font-bold">{formatCurrency(discount)}</span></div>
                        </>
                      )}
                      <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Bundle total:</span><span>{formatCurrency(total)}</span>
                      </div>
                    </div>

                    <button
                      onClick={handleAddToCart}
                      disabled={selectedBooks.length < 3}
                      className={`px-8 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 w-full ${
                        selectedBooks.length >= 3
                          ? 'bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white hover:shadow-lg transform hover:-translate-y-0.5'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingCart size={20} />
                      Add Custom Bundle to Cart
                    </button>

                    {selectedBooks.length < 3 && <p className="text-sm text-gray-500 mt-2">Pick 3+ to unlock 1 free.</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile bottom sheet version of the SAME panel */}
            {isMobile && isMobileSheetOpen && (
              <div
                className="fixed left-0 right-0 bottom-0 z-40 mx-4 bg-white rounded-2xl shadow-2xl border-2 border-[hsl(333,65%,59%)]"
                onTouchStart={onSheetTouchStart}
                onTouchMove={onSheetTouchMove}
                onTouchEnd={onSheetTouchEnd}
                style={{
                  transform: `translateY(${dragY}px)`,
                  transition: dragY ? 'none' : 'transform 160ms ease-out'
                }}
              >
                {/* drag handle + header row */}
                <div className="flex justify-center pt-3">
                  <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
                </div>

                <div className="px-6 pt-2 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Selected: {selectedBooks.length}</span>
                    {freeCount > 0 && (<><span className="text-gray-400">•</span><span className="text-green-600 font-medium">Free: {freeCount}</span></>)}
                    {discount > 0 && (<><span className="text-gray-400">•</span><span className="text-[#D8558E] font-medium">Saved: {formatCurrency(discount)}</span></>)}
                  </div>
                  <button
                    onClick={closeMobileSheet}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Close summary panel"
                  >
                    <ChevronDown size={20} className="transform rotate-180" />
                  </button>
                </div>

                {/* Body */}
                <div className="px-6 pb-6">
                  <h4 className="font-heading text-lg font-bold mb-3">
                    <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                      Your Custom Bundle
                    </span>
                  </h4>

                  <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto overscroll-contain mb-4" style={{ scrollbarWidth: 'thin' }}>
                    {selectedBooks.map((book) => (
                      <div key={book.id} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 flex-shrink-0">
                        <span className="text-sm font-medium">{book.title}</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleBook(book); }}
                          className="text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-gray-600"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                    {freeCount > 0 && (
                      <>
                        <div className="flex justify-between text-green-600 font-medium"><span>Free books applied:</span><span className="font-bold">{freeCount}</span></div>
                        <div className="flex justify-between text-[#D8558E] font-medium"><span>Saved you:</span><span className="font-bold">{formatCurrency(discount)}</span></div>
                      </>
                    )}
                    <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Bundle total:</span><span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={selectedBooks.length < 3}
                    className={`w-full px-6 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
                      selectedBooks.length >= 3
                        ? 'bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white hover:shadow-lg transform hover:-translate-y-0.5'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <ShoppingCart size={18} />
                    Add Custom Bundle to Cart
                  </button>

                  {selectedBooks.length < 3 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">Pick 3+ to unlock 1 free.</p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

// screen-reader helper
const announceToScreenReader = (message: string) => {
  const el = document.createElement('div');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  el.className = 'sr-only';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => { document.body.removeChild(el); }, 1000);
};

export default CustomBundle;
