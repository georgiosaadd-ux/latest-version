import React, { useEffect } from 'react';
import { XCircle, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CheckoutCancel: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect to home after 3 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
            <XCircle size={48} className="text-gray-600" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Checkout Cancelled
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Your payment was not processed. Your cart items are still saved.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <p className="text-gray-700 text-sm">
              No charges were made to your account. You can return to your cart to complete your purchase whenever you're ready.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-full font-semibold hover:bg-gray-50 transition-all"
            >
              <ArrowLeft size={20} />
              Return to Home
            </button>

            <button
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  const event = new CustomEvent('openCart');
                  window.dispatchEvent(event);
                }, 100);
              }}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-6 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
            >
              <ShoppingBag size={20} />
              View Cart
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-500">
            Redirecting automatically in 3 seconds...
          </div>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Questions? Contact us at{' '}
              <a href="mailto:support@heartwise.com" className="text-pink-600 hover:underline">
                support@heartwise.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCancel;
