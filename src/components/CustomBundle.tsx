import React, { useState, useEffect } from 'react';
import { ShoppingCart, Check, X, Info, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
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
    trackEvent('bundle_item_removed', {
      id: book.id,
      title: book.title,
      source: 'sheet'
    });

    setSelectedBooks(prev => prev.filter(b => b.id !== book.id));
  };

  const clearAllSelections = () => {
    trackEvent('bundle_cleared_all', {
      previous_count: selectedBooks.length
    });
    
    setSelectedBooks([]);
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
    setIsPanelCollapsed(!isPanelCollapsed);
  };

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

  const totalSelected = selectedBooks.length;
  const freeCount = Math.floor(totalSelected / 3);
  const subtotal = selectedBooks.reduce((sum, book) => sum + book.price, 0);
  
  let discount = 0;
  if (freeCount > 0) {
    const sortedPrices = [...selectedBooks].sort((a, b) => a.price - b.price);
    discount = sortedPrices.slice(0, freeCount).reduce((sum, book) => sum + book.price, 0);
  }
  
  const total = subtotal - discount;
  const totalPages = selectedBooks.reduce((sum, book) => sum + book.pages, 0);
  const totalAudioMinutes = selectedBooks.reduce((sum, book) => sum + book.audioMinutes, 0);

  const handleAddToCart = () => {
    if (selectedBooks.length >= 3) {
      const customBundle = {
        id: `custom-bundle-${Date.now()}`,
        title: `Custom Bundle (${totalSelected} books)`,
        description: `Your personalized selection: ${selectedBooks.map(b => b.title).join(', ')}`,
        price: total,
        originalPrice: subtotal,
        savings: discount,
        ebookIds: selectedBooks.map(b => b.id),
        ebooks: selectedBooks,
        freeCount: freeCount
      };

      const cartItem = {
        type: 'bundle' as const,
        id: `custom-bundle-${Date.now()}`,
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
            Pick any 3 or more eBooks from all categories and you'll always get one free.
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
                <div className={`absolute top-4 right-4 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all z-10 ${
                  selected 
                    ? 'bg-[hsl(333,65%,59%)] border-[hsl(333,65%,59%)] text-white' 
                    : 'border-gray-300 bg-white'
                }`}>
                  {selected && <Check size={16} />}
                </div>

                <div className="relative h-40 overflow-hidden rounded-t-2xl">
                  <img
                    src={book.cover}
                    alt={book.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>

                <div className="p-4">
                  <h4 className="font-heading text-lg font-bold mb-2">
                    <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                      {book.title}
                    </span>
                  </h4>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {book.description}
                  </p>
                  
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
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(book.price)}
                    </span>
                    {book.badges && book.badges.length > 0 && (
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

        {/* Summary Bar - Appears after first selection */}
        {selectedBooks.length > 0 && (
          <div className={`bg-white rounded-2xl shadow-xl border-2 border-[hsl(333,65%,59%)] transition-all duration-300 ${
            isSticky ? 'lg:fixed lg:bottom-4 lg:left-4 lg:right-4 lg:z-40 lg:max-w-4xl lg:mx-auto' : ''
          }`}>
            
            {/* Mobile Drag Handle */}
            <div className="lg:hidden flex justify-center pt-3 pb-2">
              <button
                onClick={togglePanelCollapse}
                className="flex flex-col items-center justify-center w-16 h-6 hover:bg-gray-50 rounded-lg transition-colors"
                aria-label={isPanelCollapsed ? "Expand panel" : "Collapse panel"}
              >
                <div className="w-10 h-1 bg-gray-400 rounded-full" />
              </button>
            </div>

            {/* Collapsed State (Mobile Only) */}
            {isPanelCollapsed ? (
              <div className="lg:hidden px-6 pb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3 text-sm flex-wrap">
                    <span className="font-medium text-gray-700">
                      {selectedBooks.length} selected
                    </span>
                    {freeCount > 0 && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-green-600 font-medium">
                          {freeCount} free
                        </span>
                      </>
                    )}
                    {discount > 0 && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-[#D8558E] font-medium">
                          Save {formatCurrency(discount)}
                        </span>
                      </>
                    )}
                  </div>
                  <button
                    onClick={togglePanelCollapse}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ChevronUp size={20} />
                  </button>
                </div>
                
                <button
                  onClick={handleAddToCart}
                  disabled={selectedBooks.length < 3}
                  className={`w-full px-6 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
                    selectedBooks.length >= 3
                      ? 'bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white hover:shadow-lg'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart size={18} />
                  Add Bundle ({formatCurrency(total)})
                </button>
                
                {selectedBooks.length < 3 && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Pick {3 - selectedBooks.length} more to unlock 1 free
                  </p>
                )}
              </div>
            ) : (
              /* Expanded State */
              <div className="p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                  
                  {/* Desktop: Selected books pills */}
                  <div className="flex-1 hidden lg:block">
                    <h4 className="font-heading text-lg font-bold mb-3">
                      <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                        Your Custom Bundle ({selectedBooks.length} books)
                      </span>
                    </h4>
                    
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto">
                        {selectedBooks.map((book) => (
                          <div key={book.id} className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                            <span className="text-sm font-medium">{book.title}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBook(book);
                              }}
                              className="text-gray-500 hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-6 text-sm text-gray-600 mb-4">
                      <div className="flex items-center gap-1">
                        <span>📄</span>
                        <span>Total: <strong>{totalPages}+ pages</strong></span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span>🔊</span>
                        <span>Audio: <strong>{totalAudioMinutes}+ min</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Mobile: Selected button */}
                  <div className="flex-1 lg:hidden w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-heading text-lg font-bold">
                        <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                          Your Custom Bundle
                        </span>
                      </h4>
                      <button
                        onClick={togglePanelCollapse}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <ChevronDown size={20} />
                      </button>
                    </div>
                    
                    <button
                      onClick={openSelectionSheet}
                      className="inline-flex items-center gap-2 border-2 border-[#D8558E] text-[#D8558E] px-4 py-2 rounded-full text-sm font-medium hover:bg-[#D8558E] hover:text-white transition-all relative mb-4"
                    >
                      <Info size={14} />
                      <span>View {selectedBooks.length} selected</span>
                      {selectedBooks.length > 0 && (
                        <span className="absolute -top-2 -right-2 bg-[#D8558E] text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                          {selectedBooks.length}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Pricing Summary */}
                  <div className="w-full lg:min-w-[240px] lg:w-auto">
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-gray-600">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      {freeCount > 0 && (
                        <>
                          <div className="flex justify-between text-green-600 font-medium">
                            <span>Free books:</span>
                            <span>{freeCount}</span>
                          </div>
                          <div className="flex justify-between text-[#D8558E] font-medium">
                            <span>You save:</span>
                            <span>{formatCurrency(discount)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t border-gray-200">
                        <span>Total:</span>
                        <span>{formatCurrency(total)}</span>
                      </div>
                    </div>
                    
                    <button
                      onClick={handleAddToCart}
                      disabled={selectedBooks.length < 3}
                      className={`w-full px-6 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
                        selectedBooks.length >= 3
                          ? 'bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white hover:shadow-lg'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingCart size={20} />
                      Add to Cart
                    </button>
                    
                    {selectedBooks.length < 3 && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        Pick {3 - selectedBooks.length} more to unlock 1 free
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mobile Selection Sheet */}
        {showSelectionSheet && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden">
            <div className="absolute inset-0" onClick={closeSelectionSheet} />
            <div 
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl"
              style={{ height: '70vh' }}
            >
              <div className="flex justify-center pt-4 pb-3">
                <button
                  onClick={closeSelectionSheet}
                  className="w-10 h-1 bg-gray-400 rounded-full"
                />
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">
                  Your Selections ({selectedBooks.length})
                </h3>
                <button
                  onClick={closeSelectionSheet}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(70vh - 180px)' }}>
                <div className="space-y-3">
                  {selectedBooks.map((book) => (
                    <div key={book.id} className="flex items-center justify-between py-3 border-b border-gray-100">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 truncate">{book.title}</h4>
                        <p className="text-sm text-gray-500">{formatCurrency(book.price)}</p>
                      </div>
                      <button
                        onClick={() => removeBookFromSheet(book)}
                        className="ml-4 w-8 h-8 bg-red-50 hover:bg-red-100 rounded-full flex items-center justify-center text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-medium text-gray-700">
                      {selectedBooks.length} selected
                    </span>
                    {freeCount > 0 && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-green-600 font-medium">
                          {freeCount} free
                        </span>
                      </>
                    )}
                  </div>
                  {selectedBooks.length > 0 && (
                    <button
                      onClick={clearAllSelections}
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Every 3 you pick unlocks 1 free
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CustomBundle;