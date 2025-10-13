import React from 'react';
import { ShoppingBag } from 'lucide-react';
import CartBadge from './CartBadge';
import { getSecurityHeaders } from '../utils/security';

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemCount, onCartClick }) => {

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50"
        role="banner"
      >
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-heading text-2xl font-bold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] bg-clip-text text-transparent">
            HeartWise
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <button 
              onClick={() => scrollToSection('ebooks')}
              className="text-gray-700 transition-colors hover:text-[hsl(333,65%,59%)]"
              aria-label="Navigate to eBooks section"
            >
              eBooks
            </button>
            <button 
              onClick={() => scrollToSection('bundles')}
              className="text-gray-700 transition-colors hover:text-[hsl(333,65%,59%)]"
              aria-label="Navigate to bundles section"
            >
              Bundles
            </button>
            <button 
              onClick={() => scrollToSection('testimonials')}
              className="text-gray-700 transition-colors hover:text-[hsl(333,65%,59%)]"
              aria-label="Navigate to testimonials section"
            >
              Reviews
            </button>
          </nav>

          <div className="flex items-center space-x-4">
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 text-gray-600 transition-colors hover:text-[hsl(333,65%,59%)]"
              aria-label={`Shopping cart with ${cartItemCount} items`}
            >
              <ShoppingBag size={20} />
              <span>Cart</span>
              <CartBadge count={cartItemCount} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center">
          <button
            onClick={() => scrollToSection('ebooks')}
            className="flex-1 py-3 text-center text-sm font-medium text-gray-600 hover:text-[hsl(333,65%,59%)]"
          >
            eBooks
          </button>
          <button
            onClick={() => scrollToSection('bundles')}
            className="flex-1 py-3 text-center text-sm font-medium text-gray-600 hover:text-[hsl(333,65%,59%)]"
          >
            Bundles
          </button>
          <button
            onClick={onCartClick}
            className="flex-1 py-3 text-center bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white font-semibold relative"
          >
            Checkout
            <CartBadge count={cartItemCount} />
          </button>
        </div>
      </div>
    </>
  );
};

export default Header;