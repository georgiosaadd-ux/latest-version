import React, { useEffect, useRef } from 'react';
import { X, ShoppingCart, Star, Award, BookOpen, Volume2, Play } from 'lucide-react';
import { EBook, CartItem } from '../types';
import { trackViewItemDetail } from '../utils/analytics';
import { formatCurrency } from '../utils/currency';

interface EbookModalProps {
  ebook: EBook | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: CartItem) => void;
}

const EbookModal: React.FC<EbookModalProps> = ({ ebook, isOpen, onClose, onAddToCart }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen && ebook) {
      // Store the element that triggered the modal for focus return
      triggerRef.current = document.activeElement as HTMLElement;

      // Track view item detail
      trackViewItemDetail(ebook);
      
      // Lock body scroll and hide bottom nav
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${window.scrollY}px`;
      
      // Hide bottom nav on mobile
      const bottomNav = document.querySelector('[class*="bottom-0"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = 'none';
      }

      // Focus on modal
      if (modalRef.current) {
        modalRef.current.focus();
      }
    } else {
      // Restore body scroll
      const scrollY = document.body.style.top;
      document.body.style.overflow = 'unset';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }

      // Show bottom nav
      const bottomNav = document.querySelector('[class*="bottom-0"]');
      if (bottomNav) {
        (bottomNav as HTMLElement).style.display = '';
      }

      // Return focus to trigger element
      if (triggerRef.current) {
        triggerRef.current.focus();
      }
    }

  }, [isOpen, ebook]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    const handleBackButton = () => {
      if (isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      window.addEventListener('popstate', handleBackButton);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleAddToCart = () => {
    if (ebook) {
      onAddToCart({
        type: 'ebook',
        id: ebook.id,
        item: ebook
      });
      onClose();
    }
  };

  if (!isOpen || !ebook) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom)',
        overscrollBehavior: 'contain'
      }}
    >
      <div 
        ref={modalRef}
        className="bg-white rounded-t-2xl md:rounded-2xl w-full md:max-w-2xl mx-4 md:mx-auto shadow-2xl flex flex-col"
        style={{ 
          maxHeight: '90vh',
          height: '90vh',
          marginBottom: 'env(safe-area-inset-bottom)'
        }}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div 
          className="flex-1 overflow-y-auto overscroll-contain"
          style={{ 
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin'
          }}
        >
          {/* Header with cover and basic info */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
            <div className="flex flex-col gap-6 items-center text-center">
              {/* Cover image */}
              <div className="relative w-40 h-52 md:w-48 md:h-60 rounded-xl overflow-hidden shadow-lg flex-shrink-0">
                <img
                  src={ebook.cover}
                  alt={ebook.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 via-transparent to-transparent"></div>
              </div>

              {/* Title and meta info */}
              <div className="flex-1">
                <h2 
                  id="modal-title"
                  className="font-heading text-2xl md:text-3xl font-bold mb-2 focus:outline-none"
                  tabIndex={-1}
                >
                  <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                    {ebook.title}
                  </span>
                </h2>
                <h3 className="text-lg md:text-xl text-gray-700 mb-4">{ebook.subtitle}</h3>

                {/* Badges */}
                {ebook.badges.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    {ebook.badges.map((badge) => (
                      <div
                        key={badge}
                        className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1"
                      >
                        {badge === 'Best Seller' && <Star size={14} />}
                        {badge === 'Reader Favorite' && <Award size={14} />}
                        {badge}
                      </div>
                    ))}
                  </div>
                )}

                {/* Meta row */}
                <div className="flex items-center justify-center gap-4 md:gap-6 text-gray-600 mb-4 text-sm md:text-base">
                  <div className="flex items-center gap-2">
                    <BookOpen size={20} />
                    <span className="font-bold text-[hsl(333,65%,59%)]">{ebook.pages}+ pages</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Volume2 size={20} />
                    <span className="font-bold text-[hsl(333,65%,59%)]">{ebook.audioMinutes}+ minute voice summary</span>
                  </div>
                </div>

                {/* Audio sample link */}
                <button className="text-sm text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1 mx-auto">
                  <Play size={14} />
                  Hear a 20s sample
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 md:p-8">
            {/* Description */}
            <p className="text-base md:text-lg text-gray-700 mb-6 md:mb-8 leading-relaxed text-center">
              {ebook.description}
            </p>

            {/* What you'll learn */}
            <div className="mb-6 md:mb-8">
              <h4 className="font-heading text-xl md:text-2xl font-bold mb-4 md:mb-6 text-center">
                <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                  What you'll learn:
                </span>
              </h4>
              <ul className="space-y-3 max-w-2xl mx-auto">
                {ebook.takeaways.map((takeaway, index) => (
                  <li key={index} className="flex items-start gap-3 text-gray-700 text-sm md:text-base">
                    <span className="w-6 h-6 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Preview section */}
            <div className="mb-6 md:mb-8">
              <h4 className="font-heading text-lg md:text-xl font-bold mb-4 text-center text-gray-800">
                Preview Pages
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-100 rounded-lg p-6 text-center">
                  <div className="w-full h-24 md:h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mb-3">
                    <BookOpen size={32} className="text-purple-400" />
                  </div>
                  <p className="text-sm text-gray-600">Sample page 1 - Introduction</p>
                </div>
                <div className="bg-gray-100 rounded-lg p-6 text-center">
                  <div className="w-full h-24 md:h-32 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mb-3">
                    <BookOpen size={32} className="text-purple-400" />
                  </div>
                  <p className="text-sm text-gray-600">Sample page 2 - Key insights</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Footer with CTA */}
        <div 
          className="border-t border-gray-200 bg-gray-50 p-4 md:p-6 flex-shrink-0 rounded-b-2xl md:rounded-b-2xl"
          style={{ 
            paddingBottom: `calc(1rem + env(safe-area-inset-bottom))`,
            marginBottom: 'env(safe-area-inset-bottom)'
          }}
        >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1" aria-label={`Price: ${formatCurrency(ebook.price)}`}>
                  {formatCurrency(ebook.price)}
                </div>
                <p className="text-xs md:text-sm text-gray-600">Instant download • Secure checkout</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700 transition-colors text-sm order-2 sm:order-1"
                >
                  Close
                </button>
                <button
                  onClick={handleAddToCart}
                  className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-6 md:px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 order-1 sm:order-2 min-w-[200px]"
                  aria-label={`Add ${ebook.title} to cart for ${formatCurrency(ebook.price)}`}
                >
                  <ShoppingCart size={20} />
                  Add to Cart
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default EbookModal;