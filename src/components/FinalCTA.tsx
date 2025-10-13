import React from 'react';
import { Heart, ShoppingBag, Package } from 'lucide-react';

interface FinalCTAProps {
  onShopClick: () => void;
  onBundlesClick: () => void;
}

const FinalCTA: React.FC<FinalCTAProps> = ({ onShopClick, onBundlesClick }) => {
  return (
    <section className="py-20 bg-gradient-to-br from-purple-800 via-rose-600 to-pink-500">
      <div className="container mx-auto px-4">
        <div className="text-center text-white max-w-4xl mx-auto">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <Heart size={32} className="text-white" />
          </div>
          
          <h2 className="font-heading text-4xl md:text-6xl font-bold mb-8 leading-tight">
            You are allowed to choose yourself
          </h2>
          
          <p className="text-xl md:text-2xl mb-12 opacity-95 leading-relaxed">
            Your healing matters. Your happiness matters. You matter.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button
              onClick={onShopClick}
              className="bg-white text-purple-800 px-8 py-4 rounded-full text-lg font-semibold hover:bg-gray-100 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 shadow-lg"
            >
              <ShoppingBag size={20} />
              Shop eBooks
            </button>
            <button
              onClick={onBundlesClick}
              className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-purple-800 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              <Package size={20} />
              Save with Bundles
            </button>
          </div>
          
          {/* Trust badges */}
          <div className="flex flex-wrap justify-center items-center gap-8 mt-12 text-white/80">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Instant download</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Secure checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span>Privacy protected</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;