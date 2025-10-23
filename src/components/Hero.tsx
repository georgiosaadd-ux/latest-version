import React from 'react';
import { ArrowDown, Shield, Download, CheckCircle } from 'lucide-react';

interface HeroProps {
  onBrowseClick: () => void;
  onBundlesClick: () => void;
}

const Hero: React.FC<HeroProps> = ({ onBrowseClick, onBundlesClick }) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(333,65%,59%)]/10 via-[hsl(335,77%,80%)]/10 to-pink-500/10"></div>
      </div>
      
      {/* Floating elements for subtle animation */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-[hsl(333,65%,85%)] to-[hsl(335,77%,90%)] rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-[hsl(333,65%,85%)] to-[hsl(335,77%,90%)] rounded-full opacity-20 animate-pulse delay-1000"></div>
      
      <div className="container mx-auto px-4 text-center relative z-10 pt-20 pb-10">
        <div className="max-w-1xl mx-auto">
          <h1 className="font-heading text-6xl md:text-8xl lg:text-9xl font-bold mb-6 leading-tight">
            {/* Mobile layout: "Understand" on first line, "His Tactics" on second line */}
            <span className="md:hidden">
              <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                Understand
              </span>
              <br />
              <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                His{' '}
              </span>
              <span className="text-gray-800">Tactics</span>
            </span>
            
            {/* Desktop layout: "Understand His" on first line, "Tactics" on second line */}
            <span className="hidden md:inline">
              <span className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(297,22%,24%)] bg-clip-text text-transparent">
                Understand His
              </span>
              <br />
              <span className="text-gray-800">Tactics</span>
                
            </span>
          </h1>
      
          <p className="text-xl md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto leading-relaxed">
            From love-bombing to manipulation, from charm to control. See the hidden patterns men play, and finally protect your heart.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={onBrowseClick}
              className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-8 py-4 rounded-full text-lg font-semibold hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Browse eBooks
              <ArrowDown size={20} />
            </button>
            <button
              onClick={onBundlesClick}
              className="border-2 border-purple-300 text-purple-800 px-8 py-4 rounded-full text-lg font-semibold hover:border-purple-500 hover:text-purple-600 transition-all transform hover:-translate-y-1"
            >
              See Bundles & Save
            </button>
          </div>
          
          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600 opacity-90">
            <div className="flex items-center gap-2">
              <Download size={16} className="text-green-600" />
              <span>Instant downloads</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-600" />
              <span>Secure checkout</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span>Real results</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hero image */}
      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1/3 h-1/2 opacity-10 hidden lg:block">
       
      </div>
    </section>
  );
};

export default Hero;