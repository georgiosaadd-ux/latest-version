import React from 'react';
import { X, ShoppingCart, Sparkles } from 'lucide-react';
import { UpsellRecommendation } from '../types';
import { formatCurrency } from '../utils/currency';

interface UpsellCardProps {
  recommendation: UpsellRecommendation;
  onAccept: () => void;
  onDismiss: () => void;
}

const UpsellCard: React.FC<UpsellCardProps> = ({ recommendation, onAccept, onDismiss }) => {
  if (!recommendation.show) return null;

  const { primary, companion, message } = recommendation;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] p-6 text-white relative">
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Sparkles size={24} />
            <h3 className="text-xl font-bold">Before you check out…</h3>
          </div>
          
          <div className="bg-white/20 rounded-full px-3 py-1 text-sm font-medium inline-block">
            Perfect Pair • 10% Off Both
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-6 leading-relaxed">
            {message}
          </p>

          {/* Book preview */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-4">
              <img
                src={companion.cover}
                alt={companion.title}
                className="w-16 h-20 object-cover rounded-lg shadow-md"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-1">
                  {companion.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {companion.subtitle}
                </p>
                <div className="text-lg font-bold text-gray-900">
                  {formatCurrency(companion.price)}
                </div>
              </div>
            </div>
          </div>

          {/* Savings highlight */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-green-800 font-medium">Your savings:</span>
              <span className="text-green-800 font-bold">
                {formatCurrency((primary.price + companion.price) * 0.1)}
              </span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              10% off both books with code PAIR10
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-full font-semibold hover:bg-gray-50 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={onAccept}
              className="flex-1 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-full font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Add & Apply 10%
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpsellCard;