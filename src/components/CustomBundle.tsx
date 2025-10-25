import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart,
  Check,
  X,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  Volume2,
  Star,
} from 'lucide-react';
import { EBook, CartItem } from '../types';
import { trackEvent } from '../utils/analytics';
import { formatCurrency } from '../utils/currency';
import PreviewModal from './PreviewModal';

interface CustomBundleProps {
  ebooks: EBook[];
  onAddToCart: (item: CartItem) => void;
}

/* ========== Helpers ========== */
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

const announceToScreenReader = (message: string) => {
  const el = document.createElement('div');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-atomic', 'true');
  el.className = 'sr-only';
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => {
    document.body.removeChild(el);
  }, 1000);
};

/** Compact star rating (mirrors EbookGrid styling) */
const StarRating: React.FC<{ rating: number; reviewCount?: number; compact?: boolean }> = ({
  rating,
  reviewCount,
  compact,
}) => {
  return (
    <div className={`flex items-center gap-2 ${compact ? '' : 'mb-3'}`}>
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            size={compact ? 14 : 16}
            className={i < Math.floor(rating) ? 'text-[hsl(333,65%,59%)] fill-[hsl(333,65%,59%)]' : 'text-gray-300'}
          />
        ))}
      </div>
      <span className={`font-semibold text-gray-700 ${compact ? 'text-xs' : 'text-sm'}`}>{rating.toFixed(1)}</span>
      {reviewCount ? (
        <span className={`${compact ? 'text-[10px]' : 'text-xs'} text-gray-500`}>({reviewCount})</span>
      ) : null}
    </div>
  );
};

/* ========== Component ========== */
const CustomBundle: React.FC<CustomBundleProps> = ({ ebooks, onAddToCart }) => {
  const [selectedBooks, setSelectedBooks] = useState<EBook[]>([]);
  const [isSticky, setIsSticky] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [previewEbook, setPreviewEbook] = useState<EBook | null>(null);

  const isMobile = useIsMobile();

  // Live books only
  const availableBooks = React.useMemo(() => ebooks.filter((e) => !(e as any).comingSoon), [ebooks]);

  // Mobile sheet
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [isMobileSheetCollapsed, setIsMobileSheetCollapsed] = useState(false);
  const dragStartY = useRef<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const lastMoveTs = useRef<number>(0);
  const lastMoveY = useRef<number>(0);

  const BOTTOM_BAR_HEIGHT = 76;

  const openMobileSheet = () => {
    setIsMobileSheetCollapsed(false);
    setIsMobileSheetOpen(true);
    setDragY(0);
  };
  const collapseMobileSheet = () => {
    setIsMobileSheetOpen(false);
    setIsMobileSheetCollapsed(true);
    setDragY(0);
    dragStartY.current = null;
  };
  const fullyHideMobileUI = () => {
    setIsMobileSheetOpen(false);
    setIsMobileSheetCollapsed(false);
    setDragY(0);
    dragStartY.current = null;
  };

  // Sticky panel logic
  useEffect(() => {
    const handleScroll = () => {
      const section = document.getElementById('custom-bundle');
      if (!section) return;
      const rect = section.getBoundingClientRect();
      setIsSticky(rect.top <= 100 && rect.bottom >= 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleBook = (book: EBook) => {
    if ((book as any).comingSoon) return;
    setSelectedBooks((prev) => {
      const exists = prev.find((b) => b.id === book.id);
      let next: EBook[];
      if (exists) {
        next = prev.filter((b) => b.id !== book.id);
        if (next.length === 0) {
          fullyHideMobileUI();
        }
      } else {
        next = [...prev, book];
        if (next.length > 0 && next.length % 3 === 0) {
          setToastMessage('🎉 You unlocked 1 FREE book!');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
        if (isMobile) openMobileSheet();
      }
      return next;
    });
  };

  const removeBookFromSheet = (book: EBook) => {
    trackEvent('bundle_item_removed', { id: book.id, title: book.title, source: 'sheet' });
    setSelectedBooks((prev) => {
      const next = prev.filter((b) => b.id !== book.id);
      announceToScreenReader(`Removed ${book.title}. ${next.length} selected.`);
      if (next.length === 0) {
        fullyHideMobileUI();
      }
      return next;
    });
  };

  const clearAllSelections = () => {
    trackEvent('bundle_cleared_all', { previous_count: selectedBooks.length });
    setSelectedBooks([]);
    announceToScreenReader('All selections cleared.');
    fullyHideMobileUI();
  };

  const togglePanelCollapse = () => {
    const s = !isPanelCollapsed;
    setIsPanelCollapsed(s);
    trackEvent('bundle_panel_toggled', {
      action: s ? 'collapsed' : 'expanded',
      selected_count: selectedBooks.length,
    });
    announceToScreenReader(`Bundle panel ${s ? 'collapsed' : 'expanded'}.`);
  };

  const isSelected = (book: EBook) => selectedBooks.find((b) => b.id === book.id);

  // Pricing
  const totalSelected = selectedBooks.length;
  const freeCount = Math.floor(totalSelected / 3);
  const subtotal = selectedBooks.reduce((sum, b) => sum + b.price, 0);
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
      selected_books: selectedBooks.map((b) => ({ id: b.id, title: b.title, price: b.price })),
      total_selected: totalSelected,
      free_count: freeCount,
      subtotal,
      discount,
      total,
    });

    const customBundle = {
      id: `custom-bundle-${Date.now()}`,
      title: `Custom Bundle (${totalSelected} books)`,
      description: `Your personalized selection: ${selectedBooks.map((b) => b.title).join(', ')}`,
      price: total,
      originalPrice: subtotal,
      savings: discount,
      ebookIds: selectedBooks.map((b) => b.id),
      ebooks: selectedBooks,
      freeCount,
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
        originalItems: selectedBooks.map((b) => ({ title: b.title, price: b.price })),
      },
    };

    onAddToCart(cartItem);
    setSelectedBooks([]);
    if (isMobile) fullyHideMobileUI();
  };

  // Mobile drag handlers
  const onSheetTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    lastMoveY.current = dragStartY.current;
    lastMoveTs.current = performance.now();
    setDragY(0);
  };
  const onSheetTouchMove = (e: React.TouchEvent) => {
    if (dragStartY.current == null) return;
    const y = e.touches[0].clientY;
    const delta = y - dragStartY.current;
    const resisted = delta <= 140 ? delta : 140 + (delta - 140) * 0.35;
    setDragY(Math.max(0, resisted));
    lastMoveY.current = y;
    lastMoveTs.current = performance.now();
  };
  const onSheetTouchEnd = () => {
    const dt = Math.max(1, performance.now() - lastMoveTs.current);
    const v = (lastMoveY.current - (dragStartY.current ?? lastMoveY.current)) / dt;
    if (dragY > 120 || v > 0.8) {
      collapseMobileSheet();
    } else {
      setDragY(0);
    }
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
          <p className="text-xl text-gray-600 mb-2">
            Pick any 3 or more eBooks from all categories and you'll always get one free.
          </p>
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
              <div className="flex justify-center gap-2 flex-wrap">
                <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <BookOpen size={14} /> {totalPages}+ Pages
                </span>
                <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                  <Volume2 size={14} /> {totalAudioMinutes}+ Minute Voice Summary
                </span>
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

        {/* Grid of books — LIVE ONLY */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {availableBooks.map((book) => {
            const selected = isSelected(book);
            return (
              <div
                key={book.id}
                className={`relative bg-white rounded-2xl shadow-lg transition-all duration-300 cursor-pointer h-full flex flex-col ${
                  selected
                    ? 'ring-4 ring-[hsl(333,65%,59%)] shadow-xl transform scale-105'
                    : 'hover:shadow-xl hover:transform hover:-translate-y-1'
                }`}
                onClick={() => toggleBook(book)}
              >
                {/* Select tick */}
                <div
                  className={`absolute top-4 right-4 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                    selected ? 'bg-[hsl(333,65%,59%)] border-[hsl(333,65%,59%)] text-white' : 'border-gray-300 bg-white'
                  }`}
                >
                  {selected && <Check size={16} />}
                </div>

                {/* Cover */}
                <div className="relative h-40 overflow-hidden rounded-t-2xl">
                  <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

                  {/* Best Seller (or first badge) ON THE COVER */}
                  {book.badges?.length > 0 && (
                    <div className="absolute top-3 left-3">
                      <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        {book.badges[0]}
                      </span>
                    </div>
                  )}

                  {/* Preview on cover */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewEbook(book);
                    }}
                    className="absolute bottom-3 left-3 bg-white/90 hover:bg-white text-[hsl(333,65%,59%)] px-3 py-1.5 rounded-full text-xs font-semibold shadow-md flex items-center gap-1"
                    aria-label={`Preview ${book.title}`}
                  >
                    Preview <ExternalLink size={12} />
                  </button>
                </div>

                {/* Body */}
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="font-heading text-lg font-bold mb-1">
                    <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                      {book.title}
                    </span>
                  </h4>

                  {/* Ratings (compact) */}
                  {typeof (book as any).rating === 'number' && (
                    <div className="mb-1">
                      <StarRating
                        rating={(book as any).rating}
                        reviewCount={(book as any).reviewCount}
                        compact
                      />
                    </div>
                  )}

                  {/* Keep steady height for alignment */}
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[40px]">{book.description}</p>

                  {/* Footer pinned to bottom: badges + price on one baseline */}
                  <div className="mt-auto pt-2 flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1">
                        <BookOpen size={12} /> {book.pages}+ Pages
                      </span>
                      <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-2 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1">
                        <Volume2 size={12} /> {book.audioMinutes}+ Min Voice
                      </span>
                    </div>

                    <span className="text-xl font-bold text-gray-900 ml-3 shrink-0">{formatCurrency(book.price)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* === SUMMARY UI === */}
        {selectedBooks.length > 0 && (
          <>
            {/* Desktop inline/sticky */}
            {!isMobile && (
              <div
                className={`bg-white rounded-2xl shadow-xl border-2 border-[hsl(333,65%,59%)] transition-all duration-300 ${
                  isSticky ? 'fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto' : ''
                } ${isPanelCollapsed ? 'lg:p-6' : 'p-6'}`}
              >
                <div className="hidden lg:flex justify-end -mt-2 -mr-2">
                  <button
                    onClick={togglePanelCollapse}
                    className="w-8 h-8 rounded-full text-gray-400 hover:text-gray-600 flex items-center justify-center"
                  >
                    <ChevronDown size={18} className={isPanelCollapsed ? '' : 'rotate-180 transition-transform'} />
                  </button>
                </div>

                <div className={`${isPanelCollapsed ? 'hidden lg:flex' : 'flex'} flex-col lg:flex-row items-start lg:items-center gap-6`}>
                  <div className="flex-1 hidden lg:block">
                    <h4 className="font-heading text-lg font-bold mb-3">
                      <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                        Your Custom Bundle ({selectedBooks.length} books)
                      </span>
                    </h4>

                    <div className="mb-4">
                      <div
                        className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto overscroll-contain"
                        style={{ scrollbarWidth: 'thin' }}
                      >
                        {selectedBooks.map((book) => (
                          <div
                            key={book.id}
                            className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 flex-shrink-0"
                          >
                            <span className="text-sm font-medium">{book.title}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBook(book);
                              }}
                              className="text-gray-500 hover:text-red-500 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <BookOpen size={14} /> {totalPages}+ Pages
                      </span>
                      <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Volume2 size={14} /> {totalAudioMinutes}+ Minute Voice Summary
                      </span>
                    </div>
                  </div>

                  <div className="text-center lg:text-right min-w-[200px] w-full lg:w-auto">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {freeCount > 0 && (
                        <>
                          <div className="flex justify-between text-green-600 font-medium">
                            <span>Free books applied:</span>
                            <span className="font-bold">{freeCount}</span>
                          </div>
                          <div className="flex justify-between text-[#D8558E] font-medium">
                            <span>Saved you:</span>
                            <span className="font-bold">{formatCurrency(discount)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Bundle total:</span>
                        <span>{formatCurrency(total)}</span>
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
                    {selectedBooks.length < 3 && (
                      <p className="text-sm text-gray-500 mt-2">Pick 3+ to unlock 1 free.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile: EXPANDED SHEET */}
            {isMobile && isMobileSheetOpen && (
              <div
                className="fixed left-0 right-0 z-40 mx-3"
                style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + ${BOTTOM_BAR_HEIGHT / 2}px)` }}
              >
                <div
                  className="bg-white rounded-2xl shadow-2xl border-2 border-[hsl(333,65%,59%)] overflow-hidden"
                  onTouchStart={onSheetTouchStart}
                  onTouchMove={onSheetTouchMove}
                  onTouchEnd={onSheetTouchEnd}
                  style={{
                    transform: `translateY(${dragY}px)`,
                    transition: dragY ? 'none' : 'transform 200ms cubic-bezier(.2,.8,.2,1)',
                  }}
                >
                  <div className="pt-3 pb-2">
                    <div className="mx-auto w-12 h-1.5 rounded-full" style={{ backgroundColor: '#cfcfcf' }} />
                  </div>

                  <div className="px-5 pb-2 flex items-center justify-between">
                    <div className="text-xs text-gray-700">
                      <span className="font-medium">Selected:</span> {selectedBooks.length}
                      {freeCount > 0 && (
                        <>
                          {' '}
                          <span className="text-gray-400">•</span>{' '}
                          <span className="text-green-600 font-medium">Free: {freeCount}</span>
                        </>
                      )}
                      {discount > 0 && (
                        <>
                          {' '}
                          <span className="text-gray-400">•</span>{' '}
                          <span className="text-[#D8558E] font-medium">Saved: {formatCurrency(discount)}</span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={collapseMobileSheet}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                    >
                      <ChevronDown size={16} />
                    </button>
                  </div>

                  <div className="px-5">
                    <h4 className="font-heading text-lg font-bold mb-3">
                      <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                        Your Custom Bundle
                      </span>
                    </h4>

                    <div
                      className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto overscroll-contain mb-4"
                      style={{ scrollbarWidth: 'thin' }}
                    >
                      {selectedBooks.map((book) => (
                        <div key={book.id} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 flex-shrink-0">
                          <span className="text-sm font-medium">{book.title}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleBook(book);
                            }}
                            className="text-gray-500 hover:text-red-500 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <BookOpen size={14} /> {totalPages}+ Pages
                      </span>
                      <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Volume2 size={14} /> {totalAudioMinutes}+ Minute Voice Summary
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {freeCount > 0 && (
                        <>
                          <div className="flex justify-between text-green-600 font-medium">
                            <span>Free books applied:</span>
                            <span className="font-bold">{freeCount}</span>
                          </div>
                          <div className="flex justify-between text-[#D8558E] font-medium">
                            <span>Saved you:</span>
                            <span className="font-bold">{formatCurrency(discount)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Bundle total:</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sticky CTA inside sheet */}
                  <div
                    className="sticky bottom-0 pt-3 pb-4 px-5 bg-white"
                    style={{ paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + 12px)` }}
                  >
                    <div className="pointer-events-none absolute left-0 right-0 -top-3 h-3 bg-gradient-to-t from-white to-transparent" />
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
              </div>
            )}

            {/* Mobile: COLLAPSED DOCK */}
            {isMobile && isMobileSheetCollapsed && (
              <button
                onClick={openMobileSheet}
                className="fixed z-40 left-1/2 -translate-x-1/2"
                style={{
                  bottom: `calc(env(safe-area-inset-bottom, 0px) + ${BOTTOM_BAR_HEIGHT}px)`,
                }}
                aria-label="Expand your selection"
              >
                <div className="rounded-full bg-white border-2 border-[hsl(333,65%,59%)] shadow-xl px-4 py-3 flex items-center gap-3">
                  <div className="flex items-center gap-2 text-[13px]">
                    <span className="font-semibold text-gray-800">{selectedBooks.length} selected</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-green-600 font-semibold">Free: {freeCount}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-800 font-semibold">{formatCurrency(total)}</span>
                  </div>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] flex items-center justify-center">
                    <ChevronUp size={16} className="text-white" />
                  </div>
                </div>
              </button>
            )}
          </>
        )}
      </div>

      {/* Global toast layer */}
      {showToast && (
        <div className="fixed inset-0 pointer-events-none z-30">
          <div className="absolute top-20 right-4">
            <div className="pointer-events-auto bg-white border border-green-200 rounded-lg shadow-lg p-4 flex items-center gap-3 max-w-sm">
              <div className="text-green-600 font-medium">{toastMessage}</div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal (single ebook add allowed) */}
      {previewEbook && (
        <PreviewModal
          ebook={previewEbook}
          onClose={() => setPreviewEbook(null)}
          onAddToCart={(ebook) => {
            onAddToCart(ebook);
          }}
        />
      )}
    </section>
  );
};

export default CustomBundle;
