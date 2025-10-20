import React, { useState } from 'react';
import { X, ShoppingCart, Gift, Check } from 'lucide-react';
import { EBook, Bundle } from '../types';
import { formatCurrency } from '../utils/currency';
import { bundles, ebooks } from '../data/products';
import FreeEbookProgress from './FreeEbookProgress';

interface BundleUpsellModalProps {
  isOpen: boolean;
  currentEbook: EBook;
  onSelectBundle: (selectedBooks: EBook[]) => void;
  onContinueWithoutBundle: () => void;
  onDismiss: () => void;
}

const BundleUpsellModal: React.FC<BundleUpsellModalProps> = ({
  isOpen,
  currentEbook,
  onSelectBundle,
  onContinueWithoutBundle,
  onDismiss
}) => {
  const [showBookSelector, setShowBookSelector] = useState(false);
  const [selectedBundleCategory, setSelectedBundleCategory] = useState<string>('');
  const [selectedBooks, setSelectedBooks] = useState<EBook[]>([]);

  if (!isOpen) return null;

  // Create bundle options based on current ebook's category
  const getBundleOptions = () => {
    const currentCategory = currentEbook.category;
    
    if (currentCategory === 'Manipulation & Toxic Relationships') {
      return [
        {
          id: 'healing-self-worth',
          title: 'Healing & Self-Worth Bundle',
          tagline: 'Spot the patterns, rebuild your confidence',
          category: 'Manipulation & Toxic Relationships',
          originalPrice: 117, // Sum of 3 most expensive in category
          bundlePrice: 78, // 2 most expensive
          savings: 39,
          books: ebooks.filter(book => book.category === 'Manipulation & Toxic Relationships').slice(0, 3)
        },
        {
          id: 'complete-protection',
          title: 'Complete Protection Bundle',
          tagline: 'See through every manipulation tactic',
          category: 'Manipulation & Toxic Relationships',
          originalPrice: 117,
          bundlePrice: 78,
          savings: 39,
          books: ebooks.filter(book => book.category === 'Manipulation & Toxic Relationships')
        }
      ];
    } else {
      return [
        {
          id: 'dating-red-flags',
          title: 'Dating Red Flags Bundle',
          tagline: 'Navigate modern dating with confidence',
          category: 'Dating & Red Flags',
          originalPrice: 117,
          bundlePrice: 78,
          savings: 39,
          books: ebooks.filter(book => book.category === 'Dating & Red Flags').slice(0, 3)
        },
        {
          id: 'complete-dating-guide',
          title: 'Complete Dating Wisdom Bundle',
          tagline: 'Master every dating situation',
          category: 'Dating & Red Flags',
          originalPrice: 117,
          bundlePrice: 78,
          savings: 39,
          books: ebooks.filter(book => book.category === 'Dating & Red Flags')
        }
      ];
    }
  };

  const bundleOptions = getBundleOptions();

  const handleBundleSelect = (bundle: any) => {
    setSelectedBundleCategory(bundle.category);
    setSelectedBooks([currentEbook]); // Pre-select current ebook
    setShowBookSelector(true);
  };

  const handleBookToggle = (book: EBook) => {
    if (book.id === currentEbook.id) return; // Can't deselect current ebook
    
    setSelectedBooks(prev => {
      const isSelected = prev.find(b => b.id === book.id);
      if (isSelected) {
        return prev.filter(b => b.id !== book.id);
      } else if (prev.length < 3) {
        return [...prev, book];
      }
      return prev;
    });
  };

  const handleConfirmBundle = () => {
    if (selectedBooks.length === 3) {
      onSelectBundle(selectedBooks);
    }
  };

  const availableBooks = ebooks.filter(book => 
    book.category === selectedBundleCategory && book.id !== currentEbook.id
  );

  if (showBookSelector) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-gray-900">Choose your 2 additional ebooks</h3>
              <button
                onClick={onDismiss}
                className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            
            <div className="mb-4">
              <FreeEbookProgress ebookCount={selectedBooks.length} />
            </div>
            
            <p className="text-gray-600">
              <span className="font-semibold text-gray-800">{currentEbook.title}</span> is already selected. 
              Pick 2 more to complete your bundle:
            </p>
          </div>

          <div className="p-6 max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableBooks.map((book) => {
                const isSelected = selectedBooks.find(b => b.id === book.id);
                const canSelect = selectedBooks.length < 3 || isSelected;

                return (
                  <div
                    key={book.id}
                    className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-[#D8558E] bg-pink-50' 
                        : canSelect 
                          ? 'border-gray-200 hover:border-[#D8558E] hover:bg-pink-50' 
                          : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-50'
                    }`}
                    onClick={() => canSelect && handleBookToggle(book)}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-sm mb-1">
                          {book.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2">
                          {book.pages}+ pages • {book.audioMinutes}+ min audio
                        </p>
                        <div className="text-sm font-bold text-gray-900">
                          {formatCurrency(book.price)}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 bg-[#D8558E] rounded-full flex items-center justify-center flex-shrink-0">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600">
                  Selected: {selectedBooks.length}/3 books
                </p>
                {selectedBooks.length === 3 && (
                  <p className="text-sm font-semibold text-green-600">
                    ✨ You'll save {formatCurrency(Math.min(...selectedBooks.map(b => b.price)))} with this bundle!
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowBookSelector(false)}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirmBundle}
                disabled={selectedBooks.length !== 3}
                className={`flex-1 py-3 rounded-full font-semibold transition-all flex items-center justify-center gap-2 ${
                  selectedBooks.length === 3
                    ? 'bg-gradient-to-r from-[#D8558E] to-[#E58FA6] text-white hover:shadow-lg'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <ShoppingCart size={18} />
                Add My Bundle & Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Before you finish checkout…
            </h2>
            <button
              onClick={onDismiss}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            >
              <X size={18} className="text-gray-600" />
            </button>
          </div>

          <div className="text-center mb-8">
            <p className="text-lg text-gray-700 mb-2">
              You're one step away from unlocking your best deal.
            </p>
            <p className="text-xl font-semibold text-gray-900 mb-2">
              Get 3 ebooks for the price of 2 — and save instantly!
            </p>
            <p className="text-gray-600">
              Most readers choose one of these popular bundles 👇
            </p>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-center mb-6">
              <span className="bg-gradient-to-r from-[#D8558E] to-[#4B2E4C] bg-clip-text text-transparent">
                Most Chosen Bundles
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {bundleOptions.map((bundle) => (
                <div
                  key={bundle.id}
                  className="border-2 border-gray-200 rounded-2xl p-6 hover:border-[#D8558E] hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => handleBundleSelect(bundle)}
                >
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">
                      {bundle.title}
                    </h4>
                    <p className="text-gray-600 text-sm mb-4">
                      {bundle.tagline}
                    </p>
                  </div>

                  {/* Book covers preview */}
                  <div className="flex justify-center gap-2 mb-4">
                    {bundle.books.slice(0, 3).map((book, index) => (
                      <img
                        key={book.id}
                        src={book.cover}
                        alt={book.title}
                        className="w-12 h-16 object-cover rounded-lg shadow-md"
                        style={{ zIndex: 3 - index }}
                      />
                    ))}
                  </div>

                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-gray-500 line-through text-lg">
                        {formatCurrency(bundle.originalPrice)}
                      </span>
                      <span className="text-2xl font-bold text-gray-900">
                        {formatCurrency(bundle.bundlePrice)}
                      </span>
                    </div>
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold inline-block">
                      Save {formatCurrency(bundle.savings)} (33%)
                    </div>
                  </div>

                  <button className="w-full bg-gradient-to-r from-[#D8558E] to-[#E58FA6] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all group-hover:scale-105 flex items-center justify-center gap-2">
                    <Gift size={18} />
                    Choose This Bundle
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onContinueWithoutBundle}
              className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
            >
              No thanks, continue to checkout
            </button>
            <button
              onClick={() => handleBundleSelect(bundleOptions[0])}
              className="flex-1 bg-gradient-to-r from-[#D8558E] to-[#E58FA6] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Build My Bundle
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            Offer available for a limited time only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BundleUpsellModal;