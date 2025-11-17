import React, { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { CheckoutForm } from './types';
import { ebooks, bundles } from './data/products';
import { useCart } from './hooks/useCart';
import { trackPurchase, trackBeginCheckout } from './utils/analytics';
import { createCheckoutSession } from './utils/stripe';
import { supabase } from './utils/supabase';
import { LogIn, BookOpen } from 'lucide-react';

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

// Portal Components
import ProtectedRoute from './components/ProtectedRoute';
import PortalLogin from './pages/PortalLogin';
import PortalDashboard from './pages/PortalDashboard';
import EbookReader from './pages/EbookReader';

// Portal Button Component
function PortalButton() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user || null);
  };

  return (
    <Link
      to={user ? "/portal/dashboard" : "/portal/login"}
      className="group relative flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-gradient-to-r from-pink-300 to-pink-400 text-white rounded-full text-sm md:text-base font-semibold hover:from-pink-400 hover:to-pink-500 hover:shadow-lg transition-all duration-300 overflow-hidden"
    >
      {/* Shine effect on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" />
      
      {user ? (
        <>
          <BookOpen size={18} className="relative z-10" />
          <span className="relative z-10 hidden sm:inline">My Library</span>
          <span className="relative z-10 sm:hidden">Library</span>
        </>
      ) : (
        <>
          <LogIn size={18} className="relative z-10" />
          <span className="relative z-10">Login</span>
        </>
      )}
    </Link>
  );
}

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

  const ebooksRef = useRef<HTMLElement>(null);
  const bundlesRef = useRef<HTMLElement>(null);

  const featuredEbook = ebooks.find(book => book.id === 'dating-age-manipulators') || ebooks[0];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const onBrowseClick = () => scrollToSection('ebooks');
  const onBundlesClick = () => scrollToSection('bundles');
  const onReviewsClick = () => scrollToSection('testimonials');

  const handleAddToCart = (item: any, source: 'card' | 'modal' = 'card') => {
    addToCart(item.item || item, source);
  };

  const getDiscountedTotal = () => {
    const summary = getCartSummary();
    return summary.totalAfterDiscounts ?? summary.total;
  };

  const handleCheckout = async (form?: CheckoutForm) => {
    const total = getDiscountedTotal();

    trackBeginCheckout(cart, total);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    let customerData;

    if (user) {
      // User is logged in - use their account info
      let profile = null;
      try {
        const { data } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        profile = data;
      } catch (err) {
        console.log('Profile not found or error:', err);
      }

      const firstName = profile?.first_name 
        || user.user_metadata?.first_name 
        || user.user_metadata?.full_name?.split(' ')[0] 
        || user.email?.split('@')[0] 
        || 'Customer';

      const lastName = profile?.last_name 
        || user.user_metadata?.last_name 
        || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') 
        || 'User';

      customerData = {
        firstName: firstName,
        lastName: lastName,
        email: user.email || '',
        marketingConsent: false,
        userId: user.id,
      };
    } else if (form) {
      // Guest checkout - use form data
      customerData = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        marketingConsent: form.marketingConsent,
      };
    } else {
      throw new Error('No customer data available');
    }

    const checkoutRequest = {
      items: cart,
      customer: customerData,
      successUrl: user 
        ? `${window.location.origin}/portal/dashboard?payment=success`
        : `${window.location.origin}/success`,
      cancelUrl: `${window.location.origin}/cancel`,
    };

    console.log('Creating checkout session with:', checkoutRequest);

    const checkoutSession = await createCheckoutSession(checkoutRequest);

    if (checkoutSession.url) {
      window.location.href = checkoutSession.url;
    } else {
      throw new Error('No checkout URL received from server');
    }
  } catch (error) {
    console.error('Checkout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    alert(`Checkout failed: ${errorMessage}`);
    throw error; // Re-throw so Cart component can handle it
  }
};

  return (
    <div className="min-h-screen bg-white">
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm shadow-sm z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] bg-clip-text text-transparent">
              Magnifica Femina
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <PortalButton />
            <button
              onClick={openCart}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              {getCartItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {getCartItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="pt-20">
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

        <div className="h-16 md:h-0" />
      </div>
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
        
        <Route path="/portal/login" element={<PortalLogin />} />
        <Route
          path="/portal/dashboard"
          element={
            <ProtectedRoute>
              <PortalDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/portal/read/:productId"
          element={
            <ProtectedRoute>
              <EbookReader />
            </ProtectedRoute>
          }
        />
        
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  );
}

export default App;