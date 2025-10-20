import React, { useState, useRef } from 'react';
import { CheckoutForm } from './types';
import { ebooks, bundles } from './data/products';
import { useCart } from './hooks/useCart';
import { trackPurchase, trackBeginCheckout } from './utils/analytics';

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

function App() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const {
    cart,
    isCartOpen,
    showToast,
    toastMessage,
    appliedDiscounts,
    bundleUpsellDismissed,
    addToCart,
    updateItemQuantity,
    removeFromCart,
    openCart,
    closeCart,
    clearCart,
    getCartItemCount,
    getCartSummary,
    dismissBundleUpsell
  } = useCart();

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
    console.log('Adding to cart:', item, source);
    
    addToCart(item.item || item, source);
  };

  const handleCheckout = async (form: CheckoutForm) => {
    const total = getDiscountedTotal();

    trackBeginCheckout(cart, total);

    // Simulate payment processing
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate transaction ID
      const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Track purchase
      trackPurchase(transactionId, cart, total);
      
      // Simulate email sending
      const downloadLinks = cart.map(item => ({
        title: item.item.title,
        downloadUrl: `https://downloads.heartwise.com/${item.item.title.toLowerCase().replace(/\s+/g, '-')}.pdf`
      }));

      alert(`Thank you ${form.firstName}! 🎉\n\nYour purchase is complete. Check your email (${form.email}) for download links.\n\nTransaction ID: ${transactionId}`);
      
      // Clear cart and close
      clearCart();
      closeCart();
    } catch (error) {
      alert('Payment did not go through, please try again or contact support.');
    }
  };

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
        onAddToCart={(item) => addToCart(item, 'modal')}
        bundleUpsellDismissed={bundleUpsellDismissed}
        onDismissBundleUpsell={dismissBundleUpsell}
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