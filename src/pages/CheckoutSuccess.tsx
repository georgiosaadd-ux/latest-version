const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';

type PaymentStatus = 'loading' | 'success' | 'failed' | 'error';

const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('loading');

  useEffect(() => {
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

    // Optional: auto-redirect to home after 10 seconds
    const timer = setTimeout(() => navigate('/'), 10000);
    return () => clearTimeout(timer);

  }, [sessionId, navigate]);

  const renderContent = () => {
    switch (paymentStatus) {
      case 'loading':
        return (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 animate-pulse">
              <AlertCircle size={48} className="text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Verifying Payment...</h1>
            <p className="text-lg text-gray-600 mb-8">Please wait while we confirm your payment.</p>
          </>
        );

      case 'success':
        return (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-lg text-gray-600 mb-8">Thank you for your purchase. Your order is confirmed.</p>
          </>
        );

      case 'failed':
        return (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <AlertCircle size={48} className="text-red-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Payment Failed</h1>
            <p className="text-lg text-gray-600 mb-8">Your payment could not be processed. Please try again.</p>
          </>
        );

      case 'error':
        return (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
              <AlertCircle size={48} className="text-yellow-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Unable to Verify Payment</h1>
            <p className="text-lg text-gray-600 mb-8">
              We couldn't verify your payment status. Check your email for confirmation.
            </p>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
        {renderContent()}
        <button
          onClick={() => navigate('/')}
          className="mt-6 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
        >
          Go Home
        </button>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
