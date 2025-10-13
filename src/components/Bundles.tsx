import React, { useState } from 'react';
import { ShoppingCart, Package } from 'lucide-react';
import { Bundle, CartItem } from '../types';
import { formatCurrency } from '../utils/currency';
import { trackBundlePreselectedView } from '../utils/analytics';

interface BundlesProps {
  bundles: Bundle[];
  onAddToCart: (item: CartItem) => void;
}

const Bundles: React.FC<BundlesProps> = ({ bundles, onAddToCart }) => {
  React.useEffect(() => {
    trackBundlePreselectedView();
  }, []);

  const handleAddToCart = (bundle: Bundle) => {
    onAddToCart(bundle);
  };

  return (
    <section id="bundles" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
              Save up to 35% when you bundle
            </span>
          </h2>
          <h3 className="font-heading text-5xl md:text-6xl lg:text-7xl font-bold mb-8">
            <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
              Pick 2 eBooks, Get 1 Free!
            </span>
          </h3>
          <p className="text-xl md:text-2xl text-gray-700 mb-8 font-medium">
            One book opens your eyes. Three change your life.
          </p>
        
          {/* Action buttons */}
          <div className="flex flex-col md:flex-row gap-4 justify-center mt-8 max-w-2xl mx-auto">
            <button
              className="flex-1 border-2 border-[#D8558E] text-[#D8558E] px-8 py-4 rounded-2xl text-lg font-bold cursor-default flex items-center justify-center gap-2"
              disabled
            >
              See the Most Picked Bundles ↓
            </button>
            <button
              onClick={() => {
                const element = document.getElementById('custom-bundle');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="flex-1 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-8 py-4 rounded-2xl text-lg font-bold hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              Customize Your Bundle →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {bundles.map((bundle) => (
            <div
              key={bundle.id}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-purple-100 md:border-purple-100 max-md:border-2 max-md:border-[#E58FA6] max-md:hover:border-[#D1758A] flex flex-col"
            >
              {/* Premium badges */}
              <div className="flex flex-wrap gap-2 mb-6">
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  Best Deal
                </span>
                <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  3 Books for the Price of 2
                </span>
              </div>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] rounded-full flex items-center justify-center">
                  <Package size={28} className="text-white" />
                </div>
                <div>
                  <h3 className="font-heading text-2xl font-bold">
                    <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                      {bundle.title}
                    </span>
                  </h3>
                  <p className="text-base text-gray-600 min-h-[3rem] flex items-center">{bundle.description}</p>
                </div>
              </div>

              {/* Included books */}
              <div className="mb-8 flex-grow">
                <h4 className="font-semibold text-gray-800 mb-4 text-lg">Includes:</h4>
                <ul className="space-y-3">
                  {bundle.ebooks.map((ebook) => (
                    <li key={ebook.id} className="text-base text-gray-700 flex items-start gap-3">
                      <span className="font-bold" style={{ color: 'hsl(333, 65%, 59%)' }}>•</span>
                      <span className="font-medium">{ebook.title}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Pricing - Fixed at bottom */}
              <div className="mb-6 p-6 bg-white rounded-xl border border-purple-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-gray-500 line-through text-xl" aria-label={`Original price: ${formatCurrency(bundle.originalPrice)}`}>
                    {formatCurrency(bundle.originalPrice)}
                  </span>
                  <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-5 py-2 rounded-full text-sm font-bold">
                    Save {formatCurrency(bundle.savings)}, Get 1 FREE!
                  </span>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2" aria-label={`Bundle price: ${formatCurrency(bundle.price)}`}>
                  {formatCurrency(bundle.price)}
                </div>
                <p className="text-base text-gray-600">
                  That's only {formatCurrency(Math.round(bundle.price / bundle.ebooks.length))} per book!
                </p>
              </div>
              
              {/* Add to Cart Button - Always at bottom */}
              <button
                onClick={() => handleAddToCart(bundle)}
                className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-4 rounded-full text-lg font-semibold hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={22} />
                Add Bundle to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Bundles;