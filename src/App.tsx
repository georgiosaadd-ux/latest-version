import React, { useState, useRef, useEffect } from 'react';
import { CheckoutForm } from './types';
import { ebooks, bundles } from './data/products';
import { useCart } from './hooks/useCart';
import { trackPurchase, trackBeginCheckout } from './utils/analytics';
import { RateLimiter, CSRFProtection } from './utils/security';

// Components
import Header from './components/Header';
import Hero from './components/Hero';
import PainStrip from './components/PainStrip';
import FeaturedEbook from './components/FeaturedEbook';
import EbookGrid from './components/EbookGrid';
import Bundles from './components/Bundles';
import CustomBundle from './components/CustomBundle';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import Cart from './components/Cart';
import CartToast from './components/CartToast';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';

function App() {
  // Security cleanup interval
  useEffect(() => {
    const cleanup = setInterval(() => {
      RateLimiter.cleanup();
      CSRFProtection.cleanup();
    }, 300000); // Every 5 minutes

    return () => clearInterval(cleanup);
  }, []);

  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const {
    cart,
    isCartOpen,
    showToast,
    toastMessage,
    appliedDiscounts,
    upsellDismissed,
    pair10EbookIds,
    addToCart,
    updateItemQuantity,
    removeFromCart,
    openCart,
    closeCart,
    clearCart,
    getCartItemCount,
    getCartSummary,
    getDiscountedTotal,
    applyDiscount,
    removeDiscount,
    dismissUpsell,
    getPair10Discount
  } = useCart();

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleOpenCart = () => {
      openCart();
    };
    window.addEventListener('openCart', handleOpenCart);
    return () => window.removeEventListener('openCart', handleOpenCart);
  }, [openCart]);

  // Refs for smooth scrolling
  const ebooksRef = useRef<HTMLElement>(null);
  const bundlesRef = useRef<HTMLElement>(null);

  const featuredEbook = ebooks.find(book => book.id === 'dating-age-manipulators') || ebooks[0];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAddToCart = (item: any, source: 'card' | 'modal' = 'card') => {
    // Security logging (without sensitive data)
    console.log('Add to cart attempt:', {
      itemId: item?.id || 'unknown',
      source,
      timestamp: new Date().toISOString()
    });
    
    addToCart(item.item || item, source);
  };

  const handleCheckout = async (form: CheckoutForm) => {
    // Security logging (without sensitive data)
    console.log('Checkout initiated:', {
      timestamp: new Date().toISOString(),
      itemCount: cart.length
    });
  };

  if (currentPath === '/checkout/success') {
    return <CheckoutSuccess />;
  }

  if (currentPath === '/checkout/cancel') {
    return <CheckoutCancel />;
  }

  return (
    <div className="min-h-screen bg-white">
      <Header cartItemCount={getCartItemCount()} onCartClick={openCart} />
      
      <Hero 
        onBrowseClick={() => scrollToSection('ebooks')}
        onBundlesClick={() => scrollToSection('bundles')}
      />
      
      <div className="transition-all duration-300 ease-out">
        <PainStrip />
      </div>
      
      <FeaturedEbook ebook={featuredEbook} onAddToCart={handleAddToCart} />
      
      <EbookGrid 
        ebooks={ebooks} 
        onAddToCart={(ebook) => handleAddToCart(ebook, 'card')}
      />
      
      <Bundles bundles={bundles} onAddToCart={handleAddToCart} />
      
      <CustomBundle ebooks={ebooks} onAddToCart={handleAddToCart} />
      
      <HowItWorks />
      
      <Testimonials />
      
      <FAQ />
      
      <FinalCTA 
        onShopClick={() => scrollToSection('ebooks')}
        onBundlesClick={() => scrollToSection('bundles')}
      />
      
      <Footer />

      <Cart
        isOpen={isCartOpen}
        onClose={closeCart}
        cart={cart}
        onUpdateQuantity={updateItemQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
        appliedDiscounts={appliedDiscounts}
        onAddToCart={(item) => addToCart(item, 'modal')}
        onApplyDiscount={applyDiscount}
        upsellDismissed={upsellDismissed}
        onDismissUpsell={dismissUpsell}
        pair10EbookIds={pair10EbookIds}
        getPair10Discount={getPair10Discount}
      />

      <CartToast
        show={showToast}
        message={toastMessage}
        onHide={() => {}}
      />

      {/* Add padding for mobile bottom bar */}
      <div className="h-16 md:h-0"></div>
    </div>
  );
}

export default App;