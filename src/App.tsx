import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CheckoutForm } from './types';
import { ebooks, bundles } from './data/products';
import { useCart } from './hooks/useCart';
import { trackPurchase, trackBeginCheckout } from './utils/analytics';
import { createCheckoutSession } from './utils/stripe';

// Components
import Header from './components/Header';
import Hero from './components/Hero';
import PainStrip from './components/PainStrip';
import FeaturedEbook from './components/FeaturedEbook';
import EbookGrid from './components/EbookGrid';
import Bundles from './components/Bundles';
import CustomBundle from './components/CustomBundle';
import Testimonials from './components/Testimonials';
import HowItWorks from './components/HowItWorks';
import FAQ from './components/FAQ';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';
import Cart from './components/Cart';
import CartToast from './components/CartToast';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';

function HomePage() {
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

  // Refs for smooth scrolling (kept if you need them later)
  const ebooksRef = useRef<HTMLElement>(null);
  const bundlesRef = useRef<HTMLElement>(null);

  const featuredEbook = ebooks.find(book => book.id === 'dating-age-manipulators') || ebooks[0];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Handy wrappers
  const onBrowseClick = () => scrollToSection('ebooks');
  const onBundlesClick = () => scrollToSection('bundles');
  const onReviewsClick = () => scrollToSection('testimonials'); // <-- used by Hero stat boxes

  const handleAddToCart = (item: any, source: 'card' | 'modal' = 'card') => {
    addToCart(item.item || item, source);
  };

  const getDiscountedTotal = () => {
    const summary = getCartSummary();
    return summary.totalAfterDiscounts ?? summary.total;
  };

  const handleCheckout = async (form: CheckoutForm) => {
    const total = getDiscountedTotal();

    trackBeginCheckout(cart, total);

    try {
      // Prepare the checkout session request
      const checkoutRequest = {
        items: cart,
        customer: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          marketingConsent: form.marketingConsent,
        },
        successUrl: `${window.location.origin}/success`,
        cancelUrl: `${window.location.origin}/cancel`,
      };

      console.log('Creating checkout session with:', checkoutRequest);

      // Call the Supabase Edge Function
      const session = await createCheckoutSession(checkoutRequest);

      // Redirect to Stripe Checkout
      if (session.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL received from server');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      alert(`Checkout failed: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Header cartItemCount={getCartItemCount()} onCartClick={openCart} />

      <Hero
        onBrowseClick={onBrowseClick}
        onBundlesClick={onBundlesClick}
        onReviewsClick={onReviewsClick}
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

      {/* Ensure there is a scroll target for the Hero stat boxes */}
      <section id="testimonials">
        <Testimonials />
      </section>

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
      <div className="h-16 md:h-0" />
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/success" element={<CheckoutSuccess />} />
        <Route path="/cancel" element={<CheckoutCancel />} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;
