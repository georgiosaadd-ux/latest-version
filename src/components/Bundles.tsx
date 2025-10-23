import React from 'react';
import { ShoppingCart, Package, Clock, Shield, Volume2 } from 'lucide-react';
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

  const bundle = bundles[0];

  if (!bundle) return null;

  return (
    <section id="bundles" className="py-16 bg-gradient-to-br from-gray-50 to-pink-50">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-12 md:mb-16">
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

        {/* MOBILE DESIGN - Old Compact Version */}
        <div className="md:hidden">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg border-2 border-[#E58FA6]">
            {/* Premium badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                Best Deal
              </span>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                3 Books for the Price of 2
              </span>
            </div>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] rounded-full flex items-center justify-center">
                <Package size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-bold">
                  <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                    {bundle.title}
                  </span>
                </h3>
                <p className="text-sm text-gray-600">{bundle.description}</p>
              </div>
            </div>

            {/* Included books */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3 text-base">Includes:</h4>
              <ul className="space-y-2">
                {bundle.ebooks.map((ebook) => (
                  <li key={ebook.id} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="font-bold" style={{ color: 'hsl(333, 65%, 59%)' }}>•</span>
                    <span className="font-medium">{ebook.title}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pricing */}
            <div className="mb-6 p-4 bg-white rounded-xl border border-purple-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-500 line-through text-lg">
                  {formatCurrency(bundle.originalPrice)}
                </span>
                <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-3 py-1 rounded-full text-xs font-bold">
                  Save {formatCurrency(bundle.savings)}
                </span>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {formatCurrency(bundle.price)}
              </div>
              <p className="text-sm text-gray-600">
                That's only {formatCurrency(Math.round(bundle.price / bundle.ebooks.length))} per book!
              </p>
            </div>
            
            {/* Add to Cart Button */}
            <button
              onClick={() => handleAddToCart(bundle)}
              className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-full text-base font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart size={20} />
              Add Bundle to Cart
            </button>
          </div>
        </div>

        {/* DESKTOP DESIGN - New Large Version */}
        <div className="hidden md:block max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 md:p-12 shadow-2xl border-2 border-pink-200">
            
            {/* Bundle Header */}
            <div className="text-center mb-12">
              <div className="flex justify-center gap-4 mb-6">
                <span className="bg-green-500 text-white px-6 py-3 rounded-full text-lg md:text-xl font-bold shadow-md">
                  Best Deal
                </span>
                <span className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg md:text-xl font-bold shadow-md">
                  3 Books for the Price of 2
                </span>
              </div>
              
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] rounded-full flex items-center justify-center shadow-lg">
                  <Package size={40} className="text-white" />
                </div>
              </div>
              
              <h4 className="font-heading text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">
                <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                  {bundle.title}
                </span>
              </h4>
              <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto">
                {bundle.description}
              </p>
            </div>

            {/* eBooks Grid */}
            <div className="mb-12">
              <h5 className="text-2xl md:text-3xl font-bold text-center mb-8">
                <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                  Includes:
                </span>
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {bundle.ebooks.map((ebook) => (
                  <div key={ebook.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                    <div className="relative h-72 overflow-hidden">
                      <img
                        src={ebook.cover}
                        alt={ebook.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                    </div>
                    <div className="p-6 text-center">
                      <h6 className="font-heading font-bold text-xl md:text-2xl mb-2">
                        <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                          {ebook.title}
                        </span>
                      </h6>
                      <p className="text-base md:text-lg text-gray-600">{ebook.subtitle}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-white rounded-2xl p-8 md:p-10 mb-8 shadow-lg">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="text-center lg:text-left flex-1">
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-3">
                    <span className="text-3xl md:text-4xl text-gray-400 line-through">
                      {formatCurrency(bundle.originalPrice)}
                    </span>
                    <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-5 py-2 rounded-full text-sm font-bold shadow-md">
                      Save {formatCurrency(bundle.savings)}, Get 1 FREE!
                    </span>
                  </div>
                  <div className="text-5xl md:text-6xl font-extrabold mb-3">
                    <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                      {formatCurrency(bundle.price)}
                    </span>
                  </div>
                  <p className="text-lg md:text-xl text-gray-600">
                    That's only <span className="font-bold text-pink-600">{formatCurrency(Math.round(bundle.price / bundle.ebooks.length))} per book!</span>
                  </p>
                </div>
                
                <button
                  onClick={() => handleAddToCart(bundle)}
                  className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-10 md:px-14 py-5 md:py-6 rounded-full text-xl md:text-2xl font-bold hover:shadow-2xl transition-all transform hover:-translate-y-1 flex items-center gap-3 shadow-lg"
                >
                  <ShoppingCart size={28} />
                  Add Bundle to Cart
                </button>
              </div>
            </div>

            {/* Value Props */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <Clock size={28} className="text-white" />
                </div>
                <h6 className="font-bold text-gray-800 mb-2 text-lg">Instant Access</h6>
                <p className="text-sm text-gray-600">Download immediately after purchase</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <Shield size={28} className="text-white" />
                </div>
                <h6 className="font-bold text-gray-800 mb-2 text-lg">Secure Payment</h6>
                <p className="text-sm text-gray-600">Protected checkout process</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <Volume2 size={28} className="text-white" />
                </div>
                <h6 className="font-bold text-gray-800 mb-2 text-lg">Voice Summaries</h6>
                <p className="text-sm text-gray-600">Audio versions included</p>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial - Desktop only */}
        <div className="hidden md:block text-center mt-12 max-w-3xl mx-auto">
          <p className="text-lg md:text-xl text-gray-600 italic">
            "This bundle changed everything for me. I finally understood the patterns and broke free." 
            <span className="font-bold text-pink-600"> — Sarah M.</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Bundles;