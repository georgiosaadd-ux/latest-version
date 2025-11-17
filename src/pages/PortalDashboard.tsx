// pages/PortalDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, PurchasedEbook } from '../utils/supabase';
import { BookOpen, LogOut, Loader2, AlertCircle, CheckCircle, X, ShoppingBag, Sparkles, Tag, TrendingUp, Heart, Star, Home, Download } from 'lucide-react';
import { ebooks, bundles } from '../data/products';
import { useCart } from '../hooks/useCart';
import Cart from '../components/Cart';

const ensureCustomerRecord = async (userEmail: string) => {
  const { data, error } = await supabase
    .from('customers')
    .select('id')
    .eq('email', userEmail)
    .single();

  if (error && error.code === 'PGRST116') {
    await supabase
      .from('customers')
      .insert({ email: userEmail });
  }
};

const PortalDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const showPaymentSuccess = searchParams.get('payment') === 'success';
  
  const [loading, setLoading] = useState(true);
  const [purchasedEbooks, setPurchasedEbooks] = useState<PurchasedEbook[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const [showSuccessBanner, setShowSuccessBanner] = useState(showPaymentSuccess);
  const [activeTab, setActiveTab] = useState<'library' | 'shop'>('library');

  const { addToCart, openCart, clearCart, cart, isCartOpen, closeCart, updateItemQuantity, removeFromCart, bundleUpsellDismissed, dismissBundleUpsell, getCartItemCount } = useCart();

  useEffect(() => {
    checkAuth();
    fetchPurchasedEbooks();
    
    if (showPaymentSuccess) {
      console.log('Payment successful - clearing cart');
      clearCart();
      
      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
        searchParams.delete('payment');
        setSearchParams(searchParams);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/portal/login');
      return;
    }
    setUserEmail(session.user.email || '');
  };

  const fetchPurchasedEbooks = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await ensureCustomerRecord(user.email!);

      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (customerError) throw customerError;

      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('customer_id', customers.id)
        .eq('status', 'paid');

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        setPurchasedEbooks([]);
        setLoading(false);
        return;
      }

      const orderIds = orders.map(o => o.id);

      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, title, order_id')
        .in('order_id', orderIds)
        .eq('product_type', 'ebook');

      if (itemsError) throw itemsError;

      const orderDates = orders.reduce((acc, order) => {
        acc[order.id] = order.created_at;
        return acc;
      }, {} as Record<string, string>);

      const uniqueEbooks = items?.reduce((acc, item) => {
        if (!acc.find(e => e.product_id === item.product_id)) {
          acc.push({
            product_id: item.product_id,
            title: item.title,
            purchase_date: orderDates[item.order_id]
          });
        }
        return acc;
      }, [] as PurchasedEbook[]) || [];

      setPurchasedEbooks(uniqueEbooks);
    } catch (err: any) {
      console.error('Error fetching ebooks:', err);
      setError(err.message || 'Failed to load your ebooks');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/portal/login');
  };

  const handleReadEbook = (productId: string) => {
    navigate(`/portal/read/${productId}`);
  };

const handleDownloadEbook = async (productId: string, title: string) => {
    try {
      // Get the signed URL from Supabase Storage
      const { data, error } = await supabase
        .storage
        .from('ebooks') // Correct bucket name
        .createSignedUrl(`${productId}.pdf`, 60); // 60 seconds expiry

      if (error) {
        console.error('Supabase storage error:', error);
        alert('Failed to download ebook. Please try again.');
        return;
      }

      if (!data?.signedUrl) {
        alert('Download link not available.');
        return;
      }

      // Download directly using fetch
      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download ebook. Please try again.');
    }
  };

  const closeBanner = () => {
    setShowSuccessBanner(false);
    searchParams.delete('payment');
    setSearchParams(searchParams);
  };

  const handleAddToCart = (item: any) => {
    console.log('Adding to cart:', item);
    try {
      addToCart(item, 'card');
      console.log('Item added successfully');
      // DON'T open cart automatically - let user click cart icon when ready
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  const goToStore = () => {
    navigate('/');
  };

  const purchasedIds = new Set(purchasedEbooks.map(e => e.product_id));
  const availableEbooks = ebooks.filter(e => !purchasedIds.has(e.id) && !e.comingSoon);
  const featuredEbooks = availableEbooks.slice(0, 3);
  const allAvailableEbooks = availableEbooks.slice(3);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-purple-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading your library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50">
      {showSuccessBanner && (
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <CheckCircle size={24} />
                </div>
                <div>
                  <p className="font-semibold">Payment Successful! 🎉</p>
                  <p className="text-sm text-green-50">Your eBooks have been added to your library. Start reading now!</p>
                </div>
              </div>
              <button onClick={closeBanner} className="flex-shrink-0 p-1 rounded-full hover:bg-green-600 transition-colors" aria-label="Close banner">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-lg shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button onClick={goToStore} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] rounded-full flex items-center justify-center shadow-lg">
                <BookOpen className="text-white" size={24} />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] bg-clip-text text-transparent">
                  My Library
                </h1>
                <p className="text-sm text-gray-600">{userEmail}</p>
              </div>
            </button>

            <div className="flex items-center gap-3">
              <button onClick={goToStore} className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white rounded-full font-semibold hover:shadow-lg transition-all">
                <Home size={18} />
                Back to Store
              </button>
              <button onClick={goToStore} className="sm:hidden flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white rounded-full font-semibold hover:shadow-lg transition-all" aria-label="Back to store">
                <Home size={18} />
              </button>
              <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
                <LogOut size={20} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>

          <div className="flex gap-2 mt-4 border-b border-gray-200">
            <button onClick={() => setActiveTab('library')} className={`px-6 py-3 font-semibold transition-all relative ${activeTab === 'library' ? 'text-pink-600' : 'text-gray-600 hover:text-gray-800'}`}>
              <div className="flex items-center gap-2">
                <BookOpen size={18} />
                My Books
              </div>
              {activeTab === 'library' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)]" />
              )}
            </button>
            <button onClick={() => setActiveTab('shop')} className={`px-6 py-3 font-semibold transition-all relative ${activeTab === 'shop' ? 'text-pink-600' : 'text-gray-600 hover:text-gray-800'}`}>
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} />
                Shop More
                {availableEbooks.length > 0 && (
                  <span className="bg-pink-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {availableEbooks.length}
                  </span>
                )}
              </div>
              {activeTab === 'shop' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)]" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <>
            {purchasedEbooks.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="text-pink-600" size={40} />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800 mb-3">Your Library Awaits</h2>
                  <p className="text-gray-600 mb-8">Start building your collection of empowering relationship guides.</p>
                  <button onClick={() => setActiveTab('shop')} className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all transform hover:scale-105">
                    <Sparkles size={20} />
                    Discover Books
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-800">Your Collection</h2>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
                    <Star className="text-yellow-500 fill-yellow-500" size={20} />
                    <span className="font-semibold text-gray-700">{purchasedEbooks.length} {purchasedEbooks.length === 1 ? 'Book' : 'Books'}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {purchasedEbooks.map((ebook) => (
                    <div key={ebook.product_id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="h-48 bg-gradient-to-br from-purple-400 via-pink-400 to-rose-400 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all" />
                        <BookOpen className="text-white relative z-10" size={64} />
                        <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle size={14} />
                          Owned
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">{ebook.title}</h3>
                        <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                          <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
                          Purchased {new Date(ebook.purchase_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <div className="flex gap-2">
                          <button onClick={() => handleReadEbook(ebook.product_id)} className="flex-1 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 group">
                            <BookOpen size={18} className="group-hover:scale-110 transition-transform" />
                            Read
                          </button>
                          <button onClick={() => handleDownloadEbook(ebook.product_id, ebook.title)} className="flex-1 bg-white border-2 border-pink-400 text-pink-600 py-3 rounded-xl font-semibold hover:bg-pink-50 hover:shadow-lg transition-all flex items-center justify-center gap-2 group">
                            <Download size={18} className="group-hover:scale-110 transition-transform" />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {availableEbooks.length > 0 && (
                  <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 text-white text-center shadow-xl">
                    <Sparkles className="mx-auto mb-4" size={48} />
                    <h3 className="text-2xl font-bold mb-2">Continue Your Journey</h3>
                    <p className="text-purple-100 mb-6">Discover {availableEbooks.length} more empowering guides</p>
                    <button onClick={() => setActiveTab('shop')} className="bg-white text-purple-600 px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2">
                      <ShoppingBag size={20} />
                      Explore More Books
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-12">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Tag size={24} />
                  <span className="text-sm font-semibold uppercase tracking-wide">Member Exclusive</span>
                </div>
                <h2 className="text-4xl font-bold mb-3">Buy 3, Get 1 Free! 🎁</h2>
                <p className="text-lg text-pink-100 mb-6">Build your collection and save. The more you learn, the more you earn back in wisdom.</p>
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <span className="text-sm font-semibold">✨ Auto-applied at checkout</span>
                  </div>
                </div>
              </div>
            </div>

            {featuredEbooks.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="text-pink-600" size={28} />
                  <h2 className="text-3xl font-bold text-gray-800">Featured for You</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {featuredEbooks.map((ebook) => (
                    <div key={ebook.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                      <div className="h-56 bg-gradient-to-br from-purple-400 via-pink-400 to-rose-400 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all" />
                        <BookOpen className="text-white relative z-10 group-hover:scale-110 transition-transform" size={72} />
                        <div className="absolute top-3 right-3 bg-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                          ⭐ Popular
                        </div>
                      </div>
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2 min-h-[3.5rem]">{ebook.title}</h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{ebook.description}</p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-2xl font-bold text-gray-800">${ebook.price}</span>
                        </div>
                        <button onClick={() => handleAddToCart(ebook)} className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 group">
                          <ShoppingBag size={18} className="group-hover:scale-110 transition-transform" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {allAvailableEbooks.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Heart className="text-pink-600" size={28} />
                  <h2 className="text-3xl font-bold text-gray-800">Complete Your Collection</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {allAvailableEbooks.map((ebook) => (
                    <div key={ebook.id} className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                      <div className="h-48 bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all" />
                        <BookOpen className="text-white relative z-10 group-hover:scale-110 transition-transform" size={64} />
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 min-h-[3rem]">{ebook.title}</h3>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{ebook.description}</p>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xl font-bold text-gray-800">${ebook.price}</span>
                        </div>
                        <button onClick={() => handleAddToCart(ebook)} className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-2.5 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2">
                          <ShoppingBag size={18} />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {bundles && bundles.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Tag className="text-pink-600" size={28} />
                  <h2 className="text-3xl font-bold text-gray-800">Bundle Deals</h2>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {bundles.map((bundle) => (
                    <div key={bundle.id} className="group bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-purple-200">
                      <div className="p-8">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                              SAVE ${bundle.savings}
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 mb-2">{bundle.title}</h3>
                            <p className="text-gray-600 mb-4">{bundle.description}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-baseline gap-3 mb-6">
                          <span className="text-4xl font-bold text-gray-800">${bundle.price}</span>
                          <span className="text-xl text-gray-400 line-through">${bundle.originalPrice}</span>
                        </div>

                        <button onClick={() => handleAddToCart(bundle)} className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2 text-lg">
                          <ShoppingBag size={20} />
                          Get This Bundle
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {availableEbooks.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="text-green-600" size={40} />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">You Own Everything! 🎉</h2>
                <p className="text-gray-600 mb-6">Congratulations! You have our complete collection.</p>
                <button onClick={() => setActiveTab('library')} className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-8 py-4 rounded-full font-semibold hover:shadow-xl transition-all">
                  <BookOpen size={20} />
                  View My Library
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Cart Component */}
      <Cart
        isOpen={isCartOpen}
        onClose={closeCart}
        cart={cart}
        onUpdateQuantity={updateItemQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={async (form) => {
          // Import checkout function
          const { createCheckoutSession } = await import('../utils/stripe');
          
          // Get user session
          const { data: { session } } = await supabase.auth.getSession();
          const user = session?.user;

          let customerData;
          if (user) {
            // Logged in user - use their info
            let profile = null;
            try {
              const { data } = await supabase
                .from('profiles')
                .select('first_name, last_name')
                .eq('id', user.id)
                .single();
              profile = data;
            } catch (err) {
              console.log('Profile not found:', err);
            }

            const firstName = profile?.first_name || user.user_metadata?.first_name || user.email?.split('@')[0] || 'Customer';
            const lastName = profile?.last_name || user.user_metadata?.last_name || 'User';

            customerData = {
              firstName,
              lastName,
              email: user.email || '',
              marketingConsent: false,
              userId: user.id,
            };
          } else if (form) {
            // Guest checkout
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

          const checkoutSession = await createCheckoutSession(checkoutRequest);
          if (checkoutSession.url) {
            window.location.href = checkoutSession.url;
          }
        }}
        bundleUpsellDismissed={bundleUpsellDismissed}
        onDismissBundleUpsell={dismissBundleUpsell}
        onAddToCart={addToCart}
      />
    </div>
  );
};

export default PortalDashboard;