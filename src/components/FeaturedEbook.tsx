import React, { useState } from 'react';
import { ShoppingCart, Eye, Star, Award, BookOpen, Volume2 } from 'lucide-react';
import { EBook, CartItem } from '../types';
import PreviewModal from './PreviewModal';
import { formatCurrency } from '../utils/currency';

interface FeaturedEbookProps {
  ebook: EBook;
  onAddToCart: (item: CartItem) => void;
}

const FeaturedEbook: React.FC<FeaturedEbookProps> = ({ ebook, onAddToCart }) => {
  const [showPreview, setShowPreview] = useState(false);

  const handleAddToCart = () => {
    onAddToCart(ebook);
  };

  return (
    <>
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="font-heading text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                  Featured eBook
                </span>
              </h2>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 lg:p-12">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Book Cover - Hidden on mobile, visible on desktop */}
                <div className="flex justify-center">
                  <div className="relative">
                    <img
                      src={ebook.cover}
                      alt={ebook.title}
                      className="w-[500px] h-auto rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 via-transparent to-transparent rounded-2xl"></div>
                  </div>
                </div>

                {/* Content */}
                <div className="text-left">
                  {/* Badges */}
                  {ebook.badges.length > 0 && (
                    <div className="flex justify-start gap-2 mb-6">
                      {ebook.badges.map((badge) => (
                        <div
                          key={badge}
                          className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-1 shadow-xl"
                        >
                          {badge === 'Best Seller' && <Star size={14} />}
                          {badge === 'Reader Favorite' && <Award size={14} />}
                          {badge}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <h3 className="font-heading text-4xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                      {ebook.title}
                    </span>
                  </h3>
                  <h4 className="text-xl text-gray-700 mb-6">{ebook.subtitle}</h4>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed">{ebook.description}</p>

                  {/* Pages and Audio info */}
                  <div className="flex items-center justify-start gap-6 mb-8 text-gray-600">
                    <div className="flex items-center gap-2">
                      <BookOpen size={20} />
                      <span className="font-bold text-[hsl(333,65%,59%)]">{ebook.pages}+ pages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Volume2 size={20} />
                      <span className="font-bold text-[hsl(333,65%,59%)]">{ebook.audioMinutes}+ minutes audio summary</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-start mb-8">
                    <div className="text-4xl font-bold text-gray-900" aria-label={`Price: ${formatCurrency(ebook.price)}`}>
                      {formatCurrency(ebook.price)}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-start max-w-lg">
                    <button
                      onClick={handleAddToCart}
                     className="flex-1 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
                    >
                      <ShoppingCart size={20} />
                      Add to Cart
                    </button>
                    <button
                      onClick={() => setShowPreview(true)}
                      className="flex-1 border-2 border-purple-300 text-purple-800 px-8 py-4 rounded-full text-lg font-semibold hover:border-purple-500 hover:text-purple-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye size={20} />
                      Preview
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {showPreview && (
        <PreviewModal
          ebook={ebook}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};

export default FeaturedEbook;