import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, X, Info, ChevronDown, Trash2 } from 'lucide-react';
import { EBook, CartItem } from '../types';
import { trackEvent } from '../utils/analytics';
import { formatCurrency } from '../utils/currency';

interface CustomBundleProps {
  ebooks: EBook[];
  onAddToCart: (item: CartItem) => void;
}

const CustomBundle: React.FC<CustomBundleProps> = ({ ebooks, onAddToCart }) => {
  const [selectedBooks, setSelectedBooks] = useState<EBook[]>([]);
  const [isSticky, setIsSticky] = useState(false);
  const [showSelectionSheet, setShowSelectionSheet] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Handle sticky CTA
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
      const isSelected = prev.find(b => b.id === book.id);
      let newSelection;
      
      if (isSelected) {
        newSelection = prev.filter(b => b.id !== book.id);
      } else {
        newSelection = [...prev, book];
        
        // Check if we just unlocked a free book (hit multiple of 3)
        if (newSelection.length > 0 && newSelection.length % 3 === 0) {
          setToastMessage(`🎉 You unlocked 1 FREE book!`);
          setShowToast(true);
          setTimeout(() => setShowToast(false), 3000);
        }
      }
      
      return newSelection;
    });
  };

  const removeBookFromSheet = (book: EBook) => {
    // Track analytics
    trackEvent('bundle_item_removed', {
      id: book.id,
      title: book.title,
      source: 'sheet'
    });

    setSelectedBooks(prev => {
      const newSelection = prev.filter(b => b.id !== book.id);
      
      // Announce to screen readers
      announceToScreenReader(`Removed ${book.title}. ${newSelection.length} selected.`);
      
      return newSelection;
    });
  };

  const clearAllSelections = () => {
    trackEvent('bundle_cleared_all', {
      previous_count: selectedBooks.length
    });
    
    setSelectedBooks([]);
    announceToScreenReader('All selections cleared.');
  };

  const openSelectionSheet = () => {
    trackEvent('bundle_selected_view_opened', {
      selected_count: selectedBooks.length
    });
    setShowSelectionSheet(true);
  };

  const closeSelectionSheet = () => {
    trackEvent('bundle_selected_view_closed', {
      selected_count: selectedBooks.length
    });
    setShowSelectionSheet(false);
  };

  const togglePanelCollapse = () => {
    const newState = !isPanelCollapsed;
    setIsPanelCollapsed(newState);
    
    // Track analytics
    trackEvent('bundle_panel_toggled', {
      action: newState ? 'collapsed' : 'expanded',
      selected_count: selectedBooks.length
    });
    
    // Announce to screen readers
    announceToScreenReader(`Bundle panel ${newState ? 'collapsed' : 'expanded'}.`);
  };
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showSelectionSheet) {
        closeSelectionSheet();
      }
    };

    if (showSelectionSheet) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [showSelectionSheet]);

  const isSelected = (book: EBook) => selectedBooks.find(b => b.id === book.id);

  // Calculate pricing with new logic
  const totalSelected = selectedBooks.length;
  const freeCount = Math.floor(totalSelected / 3);
  const subtotal = selectedBooks.reduce((sum, book) => sum + book.price, 0);
  
  // Calculate discount by taking cheapest books
  let discount = 0;
  if (freeCount > 0) {
    const sortedPrices = [...selectedBooks].sort((a, b) => a.price - b.price);
    discount = sortedPrices.slice(0, freeCount).reduce((sum, book) => sum + book.price, 0);
  }
  
  const total = subtotal - discount;

  // Calculate total pages and audio minutes
  const totalPages = selectedBooks.reduce((sum, book) => sum + book.pages, 0);
  const totalAudioMinutes = selectedBooks.reduce((sum, book) => sum + book.audioMinutes, 0);

  const handleAddToCart = () => {
    if (selectedBooks.length >= 3) {
      // Track custom bundle creation
      trackEvent('bundle_custom_created', {
        selected_books: selectedBooks.map(book => ({
          id: book.id,
          title: book.title,
          price: book.price
        })),
        total_selected: totalSelected,
        free_count: freeCount,
        subtotal: subtotal,
        discount: discount,
        total: total
      });

      // Create custom bundle item
      const customBundle = {
        id: 'manipulation-recovery', // Map to a valid bundle ID from your PRICE_LIST
        title: `Custom Bundle (${totalSelected} books)`,
        description: `Your personalized selection: ${selectedBooks.map(b => b.title).join(', ')}`,
        price: total,
        originalPrice: subtotal,
        savings: discount,
        ebookIds: selectedBooks.map(b => b.id),
        ebooks: selectedBooks,
        freeCount: freeCount
      };

      // Create cart item with metadata to prevent double discounting
      const cartItem = {
        type: 'bundle' as const,
        id: 'manipulation-recovery', // Use the same ID as the bundle
        item: customBundle,
        quantity: 1,
        metadata: {
          subtotal: subtotal,
          discount: discount,
          freeCount: freeCount,
          pricingMode: 'bundle_pre_discounted' as const,
          originalItems: selectedBooks.map(book => ({
            title: book.title,
            price: book.price
          }))
        }
      };

      onAddToCart(cartItem);

      // Reset selection
      setSelectedBooks([]);
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
          <p className="text-2xl md:text-3xl text-gray-700 font-medium mb-4">
            Your Story, Your Choice
          </p>
          <p className="text-xl text-gray-600 mb-2">
            Pick any 3 or more eBooks and you'll always get one free.
          </p>
          <p className="text-lg text-gray-500">
            Every 3 you pick unlocks 1 free — Mix & match as you like!
          </p>
        </div>

        {/* Live Counter - Desktop */}
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
          
          {/* Total pages and audio summary */}
          {selectedBooks.length > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <span>📄</span>
                  <span>Total pages (approx): <strong>{totalPages}</strong></span>
                </div>
                <div className="flex items-center gap-1">
                  <span>🔊</span>
                  <span>Total audio: <strong>{totalAudioMinutes} min</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toast notification */}
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
                  selected 
                    ? 'ring-4 ring-[hsl(333,65%,59%)] shadow-xl transform scale-105' 
                    : 'hover:shadow-xl hover:transform hover:-translate-y-1'
                }`}
                onClick={() => toggleBook(book)}
              >
                {/* Selection indicator */}
                <div className={`absolute top-4 right-4 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                  selected 
                    ? 'bg-[hsl(333,65%,59%)] border-[hsl(333,65%,59%)] text-white' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {selected && <Check size={16} />}
                </div>

                {/* Cover */}
                <div className="relative h-40 overflow-hidden rounded-t-2xl">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h4 className="font-heading text-lg font-bold mb-2">
                    <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                      {book.title}
                    </span>
                  </h4>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {book.description}
                  </p>
                  
                  {/* Pages and Audio meta */}
                  <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <span>📄</span>
                      <span>{book.pages}+ pages</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🔊</span>
                      <span>{book.audioMinutes}+ min voice</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900" aria-label={`Price: ${formatCurrency(book.price)}`}>
                      {formatCurrency(book.price)}
                    </span>
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

        {/* Summary Bar */}
        {selectedBooks.length > 0 && (
          <>
            {/* Mobile Drag Handle - Only show on mobile */}
            <div className="lg:hidden flex justify-center mb-2">
              <button
                onClick={togglePanelCollapse}
                className="flex flex-col items-center justify-center w-16 h-6 hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#D8558E] focus:ring-opacity-50"
                aria-label={isPanelCollapsed ? "Expand custom bundle panel" : "Collapse custom bundle panel"}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    togglePanelCollapse();
                  }
                }}
              >
                <div 
                  className="w-9 h-1 bg-gray-400 rounded-full opacity-70 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#B7B7B7' }}
                />
                <span className="sr-only">Drag to collapse or expand panel</span>
              </button>
            </div>

            {/* Mobile Drag Handle - Only show on mobile */}
            <div className="lg:hidden flex justify-center mb-2">
              <button
                onClick={togglePanelCollapse}
                className="flex flex-col items-center justify-center w-16 h-6 hover:bg-gray-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#D8558E] focus:ring-opacity-50"
                aria-label={isPanelCollapsed ? "Expand custom bundle panel" : "Collapse custom bundle panel"}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    togglePanelCollapse();
                  }
                }}
              >
                <div 
                  className="w-9 h-1 bg-gray-400 rounded-full opacity-70 hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: '#B7B7B7' }}
                />
                <span className="sr-only">Drag to collapse or expand panel</span>
              </button>
            </div>

            <div className={`bg-white rounded-2xl shadow-xl border-2 border-[hsl(333,65%,59%)] transition-all duration-300 ${
              isSticky ? 'fixed bottom-4 left-4 right-4 z-40 max-w-4xl mx-auto' : ''
            } ${isPanelCollapsed ? 'lg:p-6' : 'p-6'}`}>
              {/* Mobile Collapsed State */}
              {isPanelCollapsed && (
                <div className="lg:hidden">
                  <div className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-gray-700">
                        Selected: {selectedBooks.length}
                      </span>
                      {freeCount > 0 && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-green-600 font-medium">
                            Free: {freeCount}
                          </span>
                        </>
                      )}
                      {discount > 0 && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-[#D8558E] font-medium">
                            Saved: {formatCurrency(discount)}
                          </span>
                        </>
                      )}
                    </div>
                    <button
                      onClick={togglePanelCollapse}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label="Expand custom bundle panel"
                    >
                      <ChevronDown size={20} className="transform rotate-180" />
                    </button>
                  </div>
                  
                  {/* CTA in collapsed state */}
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
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      Pick 3+ to unlock 1 free.
                    </p>
                  )}
                </div>
              )}

              {/* Full Panel Content (Desktop always, Mobile when expanded) */}
              <div className={`${isPanelCollapsed ? 'hidden lg:flex' : 'flex'} flex-col lg:flex-row items-start lg:items-center gap-6`}>
                {/* Selected books preview - Desktop */}
                <div className="flex-1 hidden lg:block">
                  <h4 className="font-heading text-lg font-bold mb-3">
                    <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                      Your Custom Bundle ({selectedBooks.length} books)
                    </span>
                  </h4>
                  
                  {/* Scrollable pills container */}
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto overscroll-contain" style={{ scrollbarWidth: 'thin' }}>
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
                    
                    {/* Show count indicator if many books */}
                    {selectedBooks.length > 6 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Showing all {selectedBooks.length} selected books
                      </p>
                    )}
                  </div>
                  
                  {/* Aggregated meta info */}
                  <div className="flex justify-center gap-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-1">
                      <span>📄</span>
                      <span>Total pages (approx): <strong>{totalPages}</strong></span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>🔊</span>
                      <span>Total audio: <strong>{totalAudioMinutes} min</strong></span>
                    </div>
                  </div>
                </div>

                {/* Mobile compact view with clickable Selected pill */}
                <div className="flex-1 lg:hidden">
                  <h4 className="font-heading text-lg font-bold mb-3">
                    <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                      Your Custom Bundle
                    </span>
                  </h4>
                  
                  {/* Clickable Selected pill */}
                  <div className="mb-4">
                    <button
                      onClick={openSelectionSheet}
                      className="inline-flex items-center gap-2 border-2 border-[#D8558E] text-[#D8558E] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#D8558E] hover:text-white transition-all relative"
                    >
                      <Info size={14} />
                      <span>Selected: {selectedBooks.length}</span>
                      {selectedBooks.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-[#D8558E] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                          {selectedBooks.length}
                        </span>
                      )}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      Every 3 you pick unlocks 1 free.
                    </p>
                  </div>
                </div>

                {/* Pricing Summary */}
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
                    <p className="text-sm text-gray-500 mt-2">
                      Pick 3+ to unlock 1 free.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Mobile Selection Sheet */}
        {showSelectionSheet && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden">
            <div 
              className="absolute inset-0"
              onClick={closeSelectionSheet}
            />
            <div 
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl animate-slide-in-right"
              style={{ height: '70vh' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="selection-sheet-title"
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-4 pb-3">
                <button
                  onClick={closeSelectionSheet}
                  className="w-10 h-1 bg-gray-400 rounded-full hover:bg-gray-500 transition-colors cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-[#D8558E] focus:ring-opacity-50"
                  aria-label="Close panel"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      closeSelectionSheet();
                    }
                  }}
                >
                  <span className="sr-only">Drag down or tap to close</span>
                </button>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 
                  id="selection-sheet-title"
                  className="text-lg font-bold text-gray-800"
                >
                  Your Selections ({selectedBooks.length})
                </h3>
                <button
                  onClick={closeSelectionSheet}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                >
                  <ChevronDown size={16} className="text-gray-600" />
                </button>
              </div>

              {/* Book list */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className="space-y-3">
                  {selectedBooks.map((book) => (
                    <div
                      key={book.id}
                      className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 truncate">
                          {book.title}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(book.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeBookFromSheet(book)}
                        className="ml-4 w-8 h-8 bg-red-50 hover:bg-red-100 rounded-full flex items-center justify-center text-red-500 hover:text-red-700 transition-colors"
                        aria-label={`Remove ${book.title}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-gray-700">
                      Selected: {selectedBooks.length}
                    </span>
                    {freeCount > 0 && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-green-600 font-medium">
                          Free: {freeCount}
                        </span>
                      </>
                    )}
                  </div>
                  {selectedBooks.length > 0 && (
                    <button
                      onClick={clearAllSelections}
                      className="text-sm text-red-500 hover:text-red-700 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Every 3 you pick unlocks 1 free.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
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

export default CustomBundle;