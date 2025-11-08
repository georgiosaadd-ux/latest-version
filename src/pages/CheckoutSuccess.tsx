const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

type PaymentStatus = 'loading' | 'success' | 'failed' | 'error';

const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('loading');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuthStatus();
    
    // Clear local cart
    localStorage.removeItem('heartwise_cart');

    if (!sessionId) {
      setPaymentStatus('error');
      return;
    }

    const verifyPayment = async () => {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/verify-payment?session_id=${sessionId}`);
        const data = await res.json();

        if (data.status === 'succeeded') setPaymentStatus('success');
        else if (data.status === 'failed') setPaymentStatus('failed');
        else setPaymentStatus('error');

      } catch (err) {
        console.error('Verify payment failed:', err);
        setPaymentStatus('error');
      }
    };

    verifyPayment();

  }, [sessionId, navigate]);

  const checkAuthStatus = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session?.user);
  };

  const handleGoToLibrary = () => {
    if (isLoggedIn) {
      // User is logged in, go directly to library
      navigate('/portal/dashboard');
    } else {
      // User is not logged in, go to login/register page
      navigate('/portal/login?redirect=dashboard');
    }
  };

  const renderContent = () => {
    switch (paymentStatus) {
      case 'loading':
        return (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-pink-100 rounded-full mb-6 animate-pulse">
              <AlertCircle size={48} className="text-pink-500" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4">Verifying Payment...</h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">Please wait while we confirm your payment.</p>
          </>
        );

      case 'success':
        return (
          <>
            <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 bg-green-100 rounded-full mb-4">
              <CheckCircle size={40} className="text-green-500 md:hidden" strokeWidth={2.5} />
              <CheckCircle size={48} className="text-green-500 hidden md:block" strokeWidth={2.5} />
            </div>
            
            <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-3">
              Payment Successful!
            </h1>
            <p className="text-base md:text-xl text-gray-600 mb-6">Thank you for your purchase 🎉</p>
            
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-5 md:p-8 mb-5 border-2 border-pink-200">
              <div className="flex items-center justify-center mb-3">
                <div className="bg-white p-3 rounded-full shadow-md">
                  <BookOpen size={32} className="text-pink-500 md:hidden" />
                  <BookOpen size={40} className="text-pink-500 hidden md:block" />
                </div>
              </div>
              
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-3">
                {isLoggedIn ? 'Your eBooks Are Ready!' : 'Access Your eBooks'}
              </h2>
              
              {isLoggedIn ? (
                <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                  Click the button below to access your library and start reading immediately.
                </p>
              ) : (
                <div className="text-left">
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
                    To access your purchased eBooks, you'll need to create an account or sign in.
                  </p>
                  
                  <div className="bg-white rounded-xl p-4 md:p-5 border-2 border-pink-300">
                    <p className="text-sm md:text-base text-gray-800 mb-3 font-semibold">
                      📚 Next Steps:
                    </p>
                    <ul className="space-y-2.5 text-sm md:text-base text-gray-700">
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2 font-bold flex-shrink-0">✓</span>
                        <span>Click "Go to Library" below</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2 font-bold flex-shrink-0">✓</span>
                        <span>Register your account (use the same email from checkout)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-pink-500 mr-2 font-bold flex-shrink-0">✓</span>
                        <span>Access and download your eBooks instantly</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {!isLoggedIn && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                <p className="text-xs md:text-sm text-gray-700">
                  <span className="font-semibold">💡 Important:</span> Use the same email address you used during checkout to ensure your purchase is linked to your account.
                </p>
              </div>
            )}
          </>
        );

      case 'failed':
        return (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4 px-4">Payment Failed</h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 px-4">Your payment could not be processed. Please try again.</p>
          </>
        );

      case 'error':
        return (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
              <AlertCircle size={48} className="text-yellow-500" />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-gray-800 mb-4 px-4">Unable to Verify Payment</h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 px-4">
              We couldn't verify your payment status. Please contact support.
            </p>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-pink-50 to-purple-50">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-6 md:p-10 text-center">
        {renderContent()}
        
        {paymentStatus === 'success' ? (
          <button
            onClick={handleGoToLibrary}
            className="w-full md:w-auto mt-2 bg-gradient-to-r from-pink-400 to-pink-500 text-white px-10 py-4 rounded-full font-semibold text-base hover:from-pink-500 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 mx-auto"
          >
            <BookOpen size={20} />
            Go to Library
          </button>
        ) : (
          <button
            onClick={() => navigate('/')}
            className="w-full md:w-auto mt-2 bg-gradient-to-r from-pink-400 to-pink-500 text-white px-10 py-4 rounded-full font-semibold text-base hover:from-pink-500 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl active:scale-95"
          >
            Return to Home
          </button>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccess;