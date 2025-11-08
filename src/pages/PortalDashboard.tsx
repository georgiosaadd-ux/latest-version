// pages/PortalDashboard.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase, PurchasedEbook } from '../utils/supabase';
import { BookOpen, LogOut, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';

// Ensure customer record exists for new Google users
const ensureCustomerRecord = async (userEmail: string) => {
  const { data, error } = await supabase
    .from('customers')
    .select('id')
    .eq('email', userEmail)
    .single();

  if (error && error.code === 'PGRST116') {
    // Customer doesn't exist, create one
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
  const [ebooks, setEbooks] = useState<PurchasedEbook[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const [showSuccessBanner, setShowSuccessBanner] = useState(showPaymentSuccess);

  useEffect(() => {
    checkAuth();
    fetchPurchasedEbooks();
    
    // Auto-hide success banner after 5 seconds
    if (showPaymentSuccess) {
      const timer = setTimeout(() => {
        setShowSuccessBanner(false);
        // Remove the payment parameter from URL
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

      // Ensure customer record exists (important for Google sign-in users)
      await ensureCustomerRecord(user.email!);

      // Get customer
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single();

      if (customerError) throw customerError;

      // Get paid orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, created_at')
        .eq('customer_id', customers.id)
        .eq('status', 'paid');

      if (ordersError) throw ordersError;

      if (!orders || orders.length === 0) {
        setEbooks([]);
        setLoading(false);
        return;
      }

      const orderIds = orders.map(o => o.id);

      // Get order items (purchased ebooks)
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, title, order_id')
        .in('order_id', orderIds)
        .eq('product_type', 'ebook');

      if (itemsError) throw itemsError;

      // Create a map of order_id to purchase date
      const orderDates = orders.reduce((acc, order) => {
        acc[order.id] = order.created_at;
        return acc;
      }, {} as Record<string, string>);

      // Remove duplicates and add purchase dates
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

      setEbooks(uniqueEbooks);
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

  const closeBanner = () => {
    setShowSuccessBanner(false);
    searchParams.delete('payment');
    setSearchParams(searchParams);
  };

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
      {/* Payment Success Banner */}
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
              <button
                onClick={closeBanner}
                className="flex-shrink-0 p-1 rounded-full hover:bg-green-600 transition-colors"
                aria-label="Close banner"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] rounded-full flex items-center justify-center">
                <BookOpen className="text-white" size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">My Library</h1>
                <p className="text-sm text-gray-600">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
            >
              <LogOut size={20} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
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

        {ebooks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <BookOpen className="text-gray-300 mx-auto mb-4" size={64} />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No eBooks Yet</h2>
            <p className="text-gray-600 mb-6">You haven't purchased any eBooks yet.</p>
            <a
              href="/"
              className="inline-block bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Browse Store
            </a>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Your eBooks ({ebooks.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {ebooks.map((ebook) => (
                <div
                  key={ebook.product_id}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {ebook.title}
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Purchased: {new Date(ebook.purchase_date).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleReadEbook(ebook.product_id)}
                      className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <BookOpen size={18} />
                      Read Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PortalDashboard;