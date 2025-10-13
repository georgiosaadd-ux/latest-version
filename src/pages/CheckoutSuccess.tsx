import React, { useEffect } from 'react';
import { CheckCircle, Download, Mail } from 'lucide-react';
import { useNavigate } from './useNavigate';

const CheckoutSuccess: React.FC = () => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  useEffect(() => {
    localStorage.removeItem('heartwise_cart');
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle size={48} className="text-green-600" />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Thank you for your purchase. Your order has been confirmed.
          </p>

          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4 mb-4">
              <Mail className="text-pink-600 flex-shrink-0 mt-1" size={24} />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Check Your Email</h3>
                <p className="text-gray-600 text-sm">
                  Your download links have been sent to your email address. If you don't see it, please check your spam folder.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Download className="text-purple-600 flex-shrink-0 mt-1" size={24} />
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 mb-2">Instant Access</h3>
                <p className="text-gray-600 text-sm">
                  Your eBooks are ready to download. Click the links in your email to get started right away.
                </p>
              </div>
            </div>
          </div>

          {sessionId && (
            <div className="text-xs text-gray-400 mb-6">
              Order ID: {sessionId}
            </div>
          )}

          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
          >
            Return to Home
          </button>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact us at{' '}
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

export default CheckoutSuccess;
