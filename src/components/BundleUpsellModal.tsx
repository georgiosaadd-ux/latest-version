import React, { useMemo, useState } from 'react';
import { X, ShoppingCart, Gift, Check, Sparkles } from 'lucide-react';
import { EBook } from '../types';
import { formatCurrency } from '../utils/currency';
import { ebooks as allEbooks } from '../data/products';
import FreeEbookProgress from './FreeEbookProgress';

interface BundleUpsellModalProps {
  isOpen: boolean;
  currentEbook: EBook;
  onSelectBundle: (selectedBooks: EBook[]) => void; // parent should add bundle & keep user on cart
  onContinueWithoutBundle: () => void;               // kept for API compatibility (not shown)
  onDismiss: () => void;
}

/* ---------- Helpers ---------- */

// Map specific picks to your requested "Perfect Match" bundles
const getBundleRecommendation = (ebookId: string, all: EBook[]): EBook[] => {
  const bundleMap: Record<string, string[]> = {
    'trapped-in-his-game': ['trapped-in-his-game', 'dating-age-manipulators', 'love-vs-lust'],
    'dating-age-manipulators': ['trapped-in-his-game', 'dating-age-manipulators', 'love-vs-lust'],
    'love-vs-lust': ['trapped-in-his-game', 'dating-age-manipulators', 'love-vs-lust'],
    'why-attract-toxic': ['why-attract-toxic', 'love-bombed-left', 'trapped-in-his-game'],
    'gaslighting-unmasked': ['gaslighting-unmasked', 'dating-age-manipulators', 'love-bombed-left'],
    'mr-almost': ['mr-almost', 'why-attract-toxic', 'trapped-in-his-game'],
  };

  const fallback = ['trapped-in-his-game', 'dating-age-manipulators', 'love-vs-lust'];
  const ids = bundleMap[ebookId] || fallback;

  // VERY defensive: filter any missing books
  return ids
    .map(id => all.find(e => e && e.id === id))
    .filter((b): b is EBook => Boolean(b));
};

// Compute multi-free discount: every 3rd book is free (the cheapest ones are free)
const computeMultiDiscount = (books: EBook[]) => {
  if (!books || books.length === 0) {
    return { freeCount: 0, freeIds: new Set<string>(), discount: 0, subtotal: 0, total: 0 };
  }
  const subtotal = books.reduce((s, b) => s + (Number(b.price) || 0), 0);
  const freeCount = Math.floor(books.length / 3);
  if (freeCount <= 0) {
    return { freeCount: 0, freeIds: new Set<string>(), discount: 0, subtotal, total: subtotal };
  }
  const sortedByPrice = [...books].sort((a, b) => (a.price || 0) - (b.price || 0));
  const freeBooks = sortedByPrice.slice(0, freeCount);
  const discount = freeBooks.reduce((s, b) => s + (Number(b.price) || 0), 0);
  const freeIds = new Set(freeBooks.map(b => b.id));
  const total = subtotal - discount;
  return { freeCount, freeIds, discount, subtotal, total };
};

/* ---------- Component ---------- */

const BundleUpsellModal: React.FC<BundleUpsellModalProps> = ({
  isOpen,
  currentEbook,
  onSelectBundle,
  onContinueWithoutBundle, // not shown by design request
  onDismiss,
}) => {
  // Early hard guard: if not open or missing ebook, render nothing
  if (!isOpen || !currentEbook || !currentEbook.id) return null;

  const [view, setView] = useState<'landing' | 'recommended' | 'customize'>('landing');
  const [selectedBooks, setSelectedBooks] = useState<EBook[]>([currentEbook]);

  // Compute after guards only
  const recommendedBundle = useMemo(
    () => getBundleRecommendation(currentEbook.id, allEbooks),
    [currentEbook.id]
  );

  const availableForCustomize = useMemo(
    () => allEbooks.filter(e => !e.comingSoon && e.id !== currentEbook.id),
    [currentEbook.id]
  );

  /* ---------- MOBILE (sm-) LAYOUT ---------- */
  const MobileLanding = () => {
    const { freeIds, total } = computeMultiDiscount(recommendedBundle);

    return (
      <div className="md:hidden fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden">
          {/* top rounded ensured with rounded-2xl and no clipped parent */}
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
            aria-label="Close"
          >
            <X size={16} />
          </button>

          {/* Full-width pink/mauve hero */}
          <div className="w-full bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden px-4 py-3 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Sparkles className="text-[hsl(333,65%,59%)]" size={16} />
              <Gift className="text-[hsl(333,65%,59%)]" size={20} />
              <Sparkles className="text-[hsl(333,65%,59%)]" size={16} />
            </div>
            <h2 className="font-heading text-xl font-extrabold mb-2 text-gray-800">
              Before you checkout…
            </h2>
            <div className="inline-block bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm">
              <p className="text-lg font-bold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                3 for the Price of 2
              </p>
              <p className="text-xs text-gray-700">
                Pick <span className="font-bold text-[hsl(333,65%,59%)]">2 more</span> get <span className="font-bold text-green-600">3rd FREE!</span>
              </p>
            </div>
          </div>

          {/* Perfect Match */}
          <div className="p-3">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-2.5 border-2 border-[hsl(333,65%,59%)] relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg">
                Most Popular
              </div>

              <h4 className="font-heading text-sm font-bold text-center mt-0.5 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                Perfect Match
              </h4>
              <p className="text-center text-[9px] text-gray-600 mb-1.5">What readers bundle most</p>

              <div className="space-y-1 mb-1.5">
                {recommendedBundle.map((b) => {
                  const isFree = freeIds.has(b.id);
                  return (
                    <div key={b.id} className="flex items-center gap-1.5 bg-white/80 rounded-lg p-1.5">
                      <div className="w-7 h-9 rounded overflow-hidden border border-white shadow-sm shrink-0">
                        <img src={b.cover} alt={b.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-[10px] truncate">{b.title}</p>
                        <p className="text-[8px] text-gray-600">{b.pages}+ pg • 🔊 {b.audioMinutes}+ min</p>
                      </div>
                      <div className="text-right shrink-0">
                        {isFree ? (
                          <div className="leading-tight">
                            <p className="text-gray-400 line-through text-[8px]">{formatCurrency(b.price)}</p>
                            <p className="text-green-600 font-bold text-[10px] flex items-center gap-0.5">
                              FREE <Gift size={9} />
                            </p>
                          </div>
                        ) : (
                          <p className="text-gray-800 font-bold text-[10px]">{formatCurrency(b.price)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white/80 rounded-lg p-1.5 mb-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-xs">Total</span>
                  <span className="text-base font-extrabold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setView('recommended')}
                className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-1.5 rounded-full font-bold text-[11px] hover:shadow-lg transition-all flex items-center justify-center gap-1"
              >
                <Gift size={12} />
                View Bundle
              </button>
            </div>

            {/* Build Your Own - same height button styling */}
            <div className="bg-white rounded-xl p-2.5 border border-gray-200 hover:border-[hsl(333,65%,59%)] transition-all mt-2.5">
              <h4 className="font-heading text-sm font-bold text-center bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                Build Your Own
              </h4>
              <p className="text-center text-[9px] text-gray-600 mb-2">Choose what you need</p>

              <div className="flex items-center justify-center mb-2">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-full p-2.5">
                  <Sparkles size={20} className="text-[hsl(333,65%,59%)]" />
                </div>
              </div>

              <p className="text-center text-[10px] text-gray-700 mb-2">
                <span className="font-bold text-[hsl(333,65%,59%)]">Pick any books</span>
                <br />
                <span className="text-green-600 font-bold">Every 3rd FREE <Gift size={10} className="inline" /></span>
              </p>

              <button
                onClick={() => {
                  setSelectedBooks([currentEbook]);
                  setView('customize');
                }}
                className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-1.5 rounded-full font-bold text-[11px] hover:shadow-lg transition-all flex items-center justify-center gap-1"
              >
                <Gift size={12} />
                Customize Bundle
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MobileRecommended = () => {
    const books = recommendedBundle;
    const { freeIds, discount, subtotal, total } = computeMultiDiscount(books);

    return (
      <div className="md:hidden fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                Perfect Match
              </h3>
              <button
                onClick={() => setView('landing')}
                className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                aria-label="Back"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2 mb-3">
              {books.map((book) => {
                const isFree = freeIds.has(book.id);
                return (
                  <div key={book.id} className="bg-gray-50 rounded-lg p-2 flex items-center gap-2">
                    <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0">
                      <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-800 text-xs mb-0.5 truncate">{book.title}</h4>
                      <p className="text-[10px] text-gray-600">{book.pages}+ pg • 🔊 {book.audioMinutes}+ min</p>
                    </div>
                    <div className="text-right shrink-0">
                      {isFree ? (
                        <div>
                          <p className="text-gray-400 line-through text-[10px]">{formatCurrency(book.price)}</p>
                          <p className="text-green-600 font-bold text-xs flex items-center gap-0.5">
                            FREE <Gift size={12} />
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-800 font-bold text-xs">{formatCurrency(book.price)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 mb-3 text-xs">
              <div className="flex justify-between mb-0.5">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between mb-0.5">
                <span className="text-green-600 font-medium">You save:</span>
                <span className="text-green-600 font-bold">{formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-1.5 border-t border-gray-200">
                <span>Total:</span>
                <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onSelectBundle(books)}
                className="flex-1 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-2.5 rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-1.5 text-xs"
              >
                <Gift size={14} />
                Add to Cart
              </button>
              <button
                onClick={() => setView('landing')}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-full font-semibold hover:bg-gray-50 transition-colors text-xs"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const MobileCustomize = () => {
    const { freeCount, freeIds, discount, subtotal, total } = computeMultiDiscount(selectedBooks);
    const canAddToCart = selectedBooks.length >= 3;

    const toggleBook = (book: EBook) => {
      if (book.id === currentEbook.id) return;
      setSelectedBooks((prev) => {
        const exists = prev.some((b) => b.id === book.id);
        if (exists) return prev.filter((b) => b.id !== book.id);
        return [...prev, book];
      });
    };

    return (
      <div className="md:hidden fixed inset-0 z-[60] flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="p-3 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                Build Bundle
              </h3>
              <button
                onClick={() => setView('landing')}
                className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                aria-label="Back"
              >
                <X size={16} />
              </button>
            </div>

            <FreeEbookProgress ebookCount={selectedBooks.length} />

            <div className="bg-pink-50 border-l-2 border-[hsl(333,65%,59%)] p-2 mt-2 rounded">
              <p className="text-[10px] text-gray-700">
                <span className="font-bold text-[hsl(333,65%,59%)]">{currentEbook.title}</span> selected.
                {selectedBooks.length < 3 && <span className="ml-1">Pick <strong>{3 - selectedBooks.length}</strong> more!</span>}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 gap-2">
              {availableForCustomize.map((book) => {
                const isSelected = selectedBooks.some((b) => b.id === book.id);
                const isFreeHere = isSelected && freeIds.has(book.id);
                return (
                  <div
                    key={book.id}
                    onClick={() => toggleBook(book)}
                    className={`relative bg-gray-50 rounded-lg p-2 cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-[hsl(333,65%,59%)] bg-pink-50' : 'hover:shadow-md hover:bg-gray-100'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] rounded-full flex items-center justify-center shadow">
                        <Check size={12} className="text-white" />
                      </div>
                    )}

                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-20 rounded overflow-hidden mb-1.5">
                        <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                      </div>
                      <h4 className="font-bold text-gray-800 text-[10px] mb-0.5 line-clamp-2">{book.title}</h4>
                      <p className="text-[8px] text-gray-600 mb-1">{book.pages}+ pg</p>
                      <div className="text-center">
                        {isFreeHere ? (
                          <div className="leading-tight">
                            <p className="text-gray-400 line-through text-[9px]">{formatCurrency(book.price)}</p>
                            <p className="text-green-600 font-bold text-[10px] flex items-center gap-0.5 justify-center">
                              FREE <Gift size={10} />
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold text-gray-800 text-[10px]">{formatCurrency(book.price)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-3 border-t border-gray-200 flex-shrink-0">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-2 mb-2 flex items-center justify-between text-[11px]">
              <div className="text-gray-700">
                <span className="font-semibold">{selectedBooks.length}</span> books • <span className="text-green-600 font-semibold">{freeCount} FREE</span>
              </div>
              <div className="text-right">
                <div className="text-gray-400 line-through text-[9px]">{formatCurrency(subtotal)}</div>
                <div className="text-base font-extrabold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                  {formatCurrency(total)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => canAddToCart && onSelectBundle(selectedBooks)}
                disabled={!canAddToCart}
                className={`flex-1 py-2 rounded-full font-semibold transition-all flex items-center justify-center gap-1.5 text-[11px] ${
                  canAddToCart
                    ? 'bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Gift size={14} />
                {canAddToCart ? 'Add to Cart' : 'Pick 3+'}
              </button>
              <button
                onClick={() => setView('landing')}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-full font-semibold hover:bg-gray-50 transition-colors text-[11px]"
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ---------- DESKTOP (md+) LAYOUT (your original wide-screen design) ---------- */

  const DesktopLanding = () => {
    // Precompute perfect match pricing & mark FREE before open
    const { freeIds, discount, subtotal, total } = computeMultiDiscount(recommendedBundle);

    return (
      <div className="hidden md:flex fixed inset-0 z-[60] items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl">
          {/* Close */}
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
            aria-label="Close"
          >
            <X size={20} />
          </button>

          {/* Hero (full-width pink/mauve background) */}
          <div className="w-full bg-gradient-to-br from-purple-50 to-pink-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[hsl(333,65%,59%)]/10 to-[hsl(335,77%,80%)]/10" />
            <div className="relative px-6 py-8 sm:px-10 sm:py-10 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Sparkles className="text-[hsl(333,65%,59%)]" size={28} />
                <Gift className="text-[hsl(333,65%,59%)]" size={36} />
                <Sparkles className="text-[hsl(333,65%,59%)]" size={28} />
              </div>
              <h2 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-extrabold mb-4 leading-tight">
                <span className="text-gray-800">Before you finish checkout…</span>
              </h2>
              <div className="inline-block bg-white/90 backdrop-blur-sm rounded-2xl px-5 py-4 sm:px-7 sm:py-5 shadow">
                <p className="text-xl sm:text-2xl font-bold">
                  <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                    Get 3 eBooks for the Price of 2
                  </span>
                </p>
                <p className="text-base sm:text-lg text-gray-700">
                  Pick <span className="font-bold text-[hsl(333,65%,59%)]">2 more eBooks</span> and get the{' '}
                  <span className="font-bold text-green-600">3rd FREE</span>!
                </p>
              </div>
            </div>
          </div>

          {/* Two columns: Perfect Match + Build Your Own (same height) */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-stretch">
              {/* Perfect Match Bundle */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 sm:p-8 border-2 border-[hsl(333,65%,59%)] relative flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </div>
                <h4 className="font-heading text-2xl sm:text-3xl font-bold text-center mt-2">
                  <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                    Perfect Match Bundle
                  </span>
                </h4>
                <p className="text-center text-gray-600 mt-2 mb-4">
                  What readers bundle most with your choice
                </p>

                {/* Desktop covers + details (FREE marked now) */}
                <div className="hidden md:flex flex-col gap-3 mb-4">
                  {recommendedBundle.map((b) => {
                    const isFree = freeIds.has(b.id);
                    return (
                      <div key={b.id} className="flex items-center gap-3 bg-white/80 rounded-xl p-3">
                        <div className="w-14 h-18 rounded-lg overflow-hidden border border-white shadow-sm shrink-0">
                          <img src={b.cover} alt={b.title} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 truncate">{b.title}</p>
                          <p className="text-xs text-gray-600">
                            {b.pages}+ pages • 🔊 {b.audioMinutes}+ min
                          </p>
                        </div>
                        <div className="text-right">
                          {isFree ? (
                            <div className="leading-tight">
                              <p className="text-gray-400 line-through text-sm">{formatCurrency(b.price)}</p>
                              <p className="text-green-600 font-bold text-base flex items-center gap-1 justify-end">
                                FREE <Gift size={16} />
                              </p>
                            </div>
                          ) : (
                            <p className="text-gray-800 font-bold">{formatCurrency(b.price)}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pricing preview */}
                <div className="bg-white/80 rounded-xl p-3 mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-800 font-medium">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-green-600">You save</span>
                    <span className="text-green-600 font-bold">{formatCurrency(discount)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                    <span className="font-semibold">Total</span>
                    <span className="text-lg font-extrabold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => setView('recommended')}
                    className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-4 rounded-full font-bold text-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <Gift size={22} />
                    View Bundle
                  </button>
                </div>
              </div>

              {/* Build Your Own */}
              <div className="bg-white rounded-2xl p-6 sm:p-8 border-2 border-gray-200 hover:border-[hsl(333,65%,59%)] transition-all flex flex-col">
                <h4 className="font-heading text-2xl sm:text-3xl font-bold text-center">
                  <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                    Build Your Own
                  </span>
                </h4>
                <p className="text-center text-gray-600 mt-2 mb-6">Choose exactly what you need</p>

                <div className="flex items-center justify-center mb-6">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-full p-8">
                    <Sparkles size={48} className="text-[hsl(333,65%,59%)]" />
                  </div>
                </div>

                <div className="text-center mb-6 space-y-1">
                  <p className="text-gray-700">
                    <span className="font-bold text-[hsl(333,65%,59%)]">Pick any books</span> you want
                  </p>
                  <p className="text-green-600 font-bold">
                    Every 3rd book is <span className="inline-flex items-center gap-1">FREE <Gift size={16} /></span>
                  </p>
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => {
                      setSelectedBooks([currentEbook]); // ensure current stays selected at start
                      setView('customize');
                    }}
                    className="w-full border-2 border-[hsl(333,65%,59%)] text-[hsl(333,65%,59%)] py-4 rounded-full font-bold text-lg hover:bg-[hsl(333,65%,59%)] hover:text-white transition-all"
                  >
                    Customize My Bundle
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* End Landing */}
        </div>
      </div>
    );
  };

  const DesktopRecommended = () => {
    const books = recommendedBundle;
    const { freeIds, discount, subtotal, total } = computeMultiDiscount(books);

    return (
      <div className="hidden md:flex fixed inset-0 z-[60] items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl">
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl sm:text-3xl font-bold">
                <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                  Perfect Match Bundle
                </span>
              </h3>
              <button
                onClick={() => setView('landing')}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                aria-label="Back"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              {books.map((book) => {
                const isFree = freeIds.has(book.id);
                return (
                  <div key={book.id} className="bg-gray-50 rounded-xl p-4 flex items-center gap-4">
                    <div className="hidden md:block w-16 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 mb-1">{book.title}</h4>
                      <p className="text-sm text-gray-600">
                        {book.pages}+ pages • 🔊 {book.audioMinutes}+ min
                      </p>
                    </div>
                    <div className="text-right">
                      {isFree ? (
                        <div>
                          <p className="text-gray-400 line-through text-sm">{formatCurrency(book.price)}</p>
                          <p className="text-green-600 font-bold text-lg flex items-center gap-1 justify-end">
                            FREE <Gift size={18} />
                          </p>
                        </div>
                      ) : (
                        <p className="text-gray-800 font-bold">{formatCurrency(book.price)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pricing */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-800">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-green-600 font-medium">You save:</span>
                <span className="text-green-600 font-bold">{formatCurrency(discount)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold pt-3 border-t border-gray-200">
                <span>Total:</span>
                <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => onSelectBundle(books)}
                className="flex-1 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <Gift size={20} />
                Add Bundle to Cart
              </button>
              <button
                onClick={() => setView('landing')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to options
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const DesktopCustomize = () => {
    const { freeCount, freeIds, discount, subtotal, total } = computeMultiDiscount(selectedBooks);
    const canAddToCart = selectedBooks.length >= 3;

    const toggleBook = (book: EBook) => {
      if (book.id === currentEbook.id) return;
      setSelectedBooks((prev) => {
        const exists = prev.some((b) => b.id === book.id);
        if (exists) return prev.filter((b) => b.id !== book.id);
        return [...prev, book];
      });
    };

    return (
      <div className="hidden md:flex fixed inset-0 z-[60] items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl">
          {/* Header / Back */}
          <div className="p-6 sm:p-8 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl sm:text-3xl font-bold">
                <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                  Build Your Bundle
                </span>
              </h3>
              <button
                onClick={() => setView('landing')}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                aria-label="Back"
              >
                <X size={20} />
              </button>
            </div>

            {/* Old counter kept */}
            <div className="mt-4">
              <FreeEbookProgress ebookCount={selectedBooks.length} />
            </div>

            {/* Current selection message */}
            <div className="bg-pink-50 border-l-4 border-[hsl(333,65%,59%)] p-4 mt-4 rounded">
              <p className="text-gray-700">
                <span className="font-bold text-[hsl(333,65%,59%)]">{currentEbook.title}</span> is already selected.
                {selectedBooks.length < 3 && (
                  <span className="ml-1">Pick <strong>{3 - selectedBooks.length}</strong> more to unlock your free eBook.</span>
                )}
              </p>
            </div>
          </div>

          {/* Selector */}
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableForCustomize.map((book) => {
                const isSelected = selectedBooks.some((b) => b.id === book.id);
                const isFreeHere = isSelected && freeIds.has(book.id);
                return (
                  <div
                    key={book.id}
                    onClick={() => toggleBook(book)}
                    className={[
                      'relative bg-gray-50 rounded-xl p-4 cursor-pointer transition-all',
                      isSelected ? 'ring-4 ring-[hsl(333,65%,59%)] bg-pink-50' : 'hover:shadow-md hover:bg-gray-100',
                    ].join(' ')}
                  >
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] rounded-full flex items-center justify-center shadow-lg">
                        <Check size={18} className="text-white" />
                      </div>
                    )}

                    <div className="flex items-center gap-3">
                      <div className="hidden md:block w-12 h-16 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={book.cover} alt={book.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-800 mb-1 truncate">{book.title}</h4>
                        <p className="text-xs text-gray-600">
                          {book.pages}+ pages • 🔊 {book.audioMinutes}+ min
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {isFreeHere ? (
                          <div className="leading-tight">
                            <p className="text-gray-400 line-through text-sm">{formatCurrency(book.price)}</p>
                            <p className="text-green-600 font-bold text-base flex items-center gap-1 justify-end">
                              FREE <Gift size={16} />
                            </p>
                          </div>
                        ) : (
                          <p className="font-bold text-gray-800">{formatCurrency(book.price)}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-gray-700">
                  <span className="font-semibold">{selectedBooks.length}</span> selected •{' '}
                  <span className="text-green-600 font-semibold">{freeCount}</span> FREE
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Subtotal</div>
                  <div className="text-base font-semibold text-gray-800">{formatCurrency(subtotal)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-green-600">You save</div>
                  <div className="text-base font-bold text-green-600">{formatCurrency(discount)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600 line-through">{formatCurrency(subtotal)}</div>
                  <div className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                    {formatCurrency(total)}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => canAddToCart && onSelectBundle(selectedBooks)}
                disabled={!canAddToCart}
                className={`flex-1 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
                  canAddToCart
                    ? 'bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Gift size={20} />
                {canAddToCart ? 'Add Bundle to Cart' : 'Pick at least 3 eBooks'}
              </button>

              <button
                onClick={() => setView('landing')}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Back to options
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ---------- View Router (renders both mobile & desktop variants) ---------- */

  if (view === 'landing') {
    return (
      <>
        <MobileLanding />
        <DesktopLanding />
      </>
    );
  }

  if (view === 'recommended') {
    return (
      <>
        <MobileRecommended />
        <DesktopRecommended />
      </>
    );
  }

  if (view === 'customize') {
    return (
      <>
        <MobileCustomize />
        <DesktopCustomize />
      </>
    );
  }

  return null;
};

export default BundleUpsellModal;
