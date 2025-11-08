import React from 'react';
import { ShoppingBag, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CartBadge from './CartBadge';

interface HeaderProps {
  cartItemCount: number;
  onCartClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemCount, onCartClick }) => {
  const navigate = useNavigate();
  
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLoginClick = () => {
    navigate('/portal/login');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-heading text-2xl font-bold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] bg-clip-text text-transparent">
            MagnificaFemina
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => scrollToSection('ebooks')}
              className="text-gray-700 transition-colors hover:text-[hsl(333,65%,59%)]"
            >
              eBooks
            </button>
            <button
              onClick={() => scrollToSection('bundles')}
              className="text-gray-700 transition-colors hover:text-[hsl(333,65%,59%)]"
            >
              Bundles
            </button>
            <button
              onClick={() => scrollToSection('testimonials')}
              className="text-gray-700 transition-colors hover:text-[hsl(333,65%,59%)]"
            >
              Reviews
            </button>
          </nav>

          <div className="flex items-center space-x-3">
            {/* Login Button - Desktop */}
            <button
              onClick={handleLoginClick}
              className="hidden md:flex items-center gap-2 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-5 py-2 rounded-full font-semibold hover:shadow-lg transition-all"
              aria-label="Login"
            >
              <LogIn size={18} />
              <span>Login</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={onCartClick}
              className="relative flex items-center gap-2 text-gray-600 transition-colors hover:text-[hsl(333,65%,59%)]"
              aria-label="Open cart"
            >
              <ShoppingBag size={20} />
              <span className="hidden sm:inline">Cart</span>
              <CartBadge count={cartItemCount} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile bottom bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex items-center">
          {/* Login - Mobile */}
          <button
            onClick={handleLoginClick}
            className="flex-1 py-3 flex flex-col items-center justify-center text-gray-600 hover:text-[hsl(333,65%,59%)]"
            aria-label="Login"
          >
            <LogIn size={20} />
            <span className="text-xs mt-1">Login</span>
          </button>

          {/* Bundles (bigger + lifted + vivid wave + bounce-shake) */}
          <button
            onClick={() => scrollToSection('bundles')}
            aria-label="Go to bundles"
            className="flex-[1.4] py-4 text-center text-base font-semibold text-white
                       bg-gradient-to-r from-[hsl(333,75%,58%)] via-[hsl(335,85%,75%)] to-[hsl(333,95%,63%)]
                       bg-[length:400%_400%] animate-bg-wave-ultra
                       shadow-xl shadow-[hsl(333,65%,59%)/35%] relative rounded-t-xl
                       translate-y-[-14px] overflow-hidden"
          >
            <span className="inline-block animate-lift-fastshake">Bundle & Save!</span>
          </button>

          {/* Checkout */}
          <button
            onClick={onCartClick}
            className="flex-1 py-3 flex flex-col items-center justify-center text-gray-600 hover:text-[hsl(333,65%,59%)] relative"
          >
            <ShoppingBag size={20} />
            <span className="text-xs mt-1">Cart</span>
            <CartBadge count={cartItemCount} />
          </button>
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        /* Subtle jump + faster shake */
        @keyframes lift-fastshake {
          0%, 100% { transform: translateY(0) rotate(0); }
          10% { transform: translateY(-3px) rotate(-1deg); }
          15% { transform: translateY(-6px) rotate(1deg); }
          20% { transform: translateY(-7px) rotate(-1deg); }
          25% { transform: translateY(-6px) rotate(1deg); }
          30% { transform: translateY(-5px) rotate(-1deg); }
          35% { transform: translateY(-3px) rotate(1deg); }
          45%, 100% { transform: translateY(0) rotate(0); }
        }

        .animate-lift-fastshake {
          animation: lift-fastshake 2.5s cubic-bezier(0.45, 0, 0.55, 1) infinite;
          will-change: transform;
        }

        /* High-contrast, two-way gradient wave (visible, elegant) */
        @keyframes bg-wave-ultra {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-bg-wave-ultra {
          animation: bg-wave-ultra 2.5s ease-in-out infinite;
          background-size: 400% 400%;
        }
      `}</style>
    </>
  );
};

export default Header;