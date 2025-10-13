import React from 'react';
import { X, Plus } from 'lucide-react';
import { EBook } from '../types';
import { formatCurrency } from '../utils/currency';
import FreeEbookProgress from './FreeEbookProgress';

interface UpsellModalProps {
  isOpen: boolean;
  primaryEbook: EBook;
  companionEbook: EBook;
  onAddAndCheckout: () => void;
  onContinueWithoutAdding: () => void;
  onDismiss: () => void;
  currentEbookCount: number;
}

const UpsellModal: React.FC<UpsellModalProps> = ({
  isOpen,
  primaryEbook,
  companionEbook,
  onAddAndCheckout,
  onContinueWithoutAdding,
  onDismiss,
  currentEbookCount
}) => {
  if (!isOpen) return null;

  const getMessageParts = () => {
    if (primaryEbook.category === 'Dating & Red Flags') {
      return {
        prefix: 'You picked ',
        middle: '. Most women also add ',
        suffix: '—because together these two make the hidden signs crystal clear and help you trust what you already feel. Add it now and get'
      };
    }

    if (primaryEbook.category === 'Manipulation & Toxic Relationships') {
      return {
        prefix: 'You chose ',
        middle: '. Women often pair it with ',
        suffix: '—because together they reveal the exact mind games men use and how to protect yourself. Add it now and get'
      };
    }

    return { prefix: '', middle: '', suffix: '' };
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="relative p-6 sm:p-8">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors z-10"
            aria-label="Close"
          >
            <X size={18} className="text-gray-600" />
          </button>

          <div className="mb-5">
            <FreeEbookProgress ebookCount={currentEbookCount} />
          </div>

          <div className="mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Before you finish checkout…
            </h2>
            <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
              {getMessageParts().prefix}
              <span className="font-bold text-gray-900">{primaryEbook.title}</span>
              {getMessageParts().middle}
              <span className="font-bold text-gray-900">{companionEbook.title}</span>
              {getMessageParts().suffix}{' '}
              <span className="text-pink-600 font-bold">✨ 10% OFF on BOTH titles ✨</span>
            </p>
          </div>

          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-4">
              <img
                src={companionEbook.cover}
                alt={companionEbook.title}
                className="w-20 h-28 object-cover rounded-lg shadow-md flex-shrink-0"
              />
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 mb-1 text-lg">
                  {companionEbook.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {companionEbook.subtitle}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 line-through text-sm">
                    {formatCurrency(companionEbook.price)}
                  </span>
                  <span className="text-pink-600 font-bold text-lg">
                    {formatCurrency(Math.round(companionEbook.price * 0.9))}
                  </span>
                  <span className="bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                    10% OFF
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={onAddAndCheckout}
              className="w-full bg-gradient-to-r from-pink-600 to-pink-500 text-white py-4 rounded-full font-bold text-base sm:text-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Plus size={20} strokeWidth={3} />
              <span>Add & Apply 10%</span>
            </button>

            <button
              onClick={onContinueWithoutAdding}
              className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-50 transition-all"
            >
              No thanks, continue to checkout
            </button>
          </div>

          <p className="text-xs text-gray-500 text-center mt-4">
            This offer is only available right now
          </p>
        </div>
      </div>
    </div>
  );
};

export default UpsellModal;
