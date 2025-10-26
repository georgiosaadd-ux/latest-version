import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';

type PaymentStatus = 'loading' | 'success' | 'failed' | 'error';

interface PaymentIntent {
  stripe_checkout_session_id: string;
  status: string;
  amount_cents: number;
  customer_email: string;
}

const CheckoutSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('loading');
  const [paymentIntent, setPaymentIntent] = useState<PaymentIntent | null>(null);

  useEffect(() => {
    // Clear cart from localStorage
    localStorage.removeItem('heartwise_cart');

    // Check payment status from Supabase
    const checkPaymentStatus = async () => {
      if (!sessionId) {
        console.error('No session ID provided');
        setPaymentStatus('error');
        return;
      }

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
          console.error('Missing Supabase configuration');
          setPaymentStatus('error');
          return;
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Query payment_intents table
        const { data, error } = await supabase
          .from('payment_intents')
          .select('*')
          .eq('stripe_checkout_session_id', sessionId)
          .single();

        if (error) {
          console.error('Error fetching payment status:', error);
          setPaymentStatus('error');
          return;
        }

        if (data) {
          setPaymentIntent(data);
          // Check status column - only 'succeeded' means success
          if (data.status === 'succeeded') {
            setPaymentStatus('success');
          } else {
            setPaymentStatus('failed');
          }
        } else {
          // Payment intent not found yet (webhook might not have processed)
          // Wait a bit and try again
          setTimeout(async () => {
            const { data: retryData, error: retryError } = await supabase
              .from('payment_intents')
              .select('*')
              .eq('stripe_checkout_session_id', sessionId)
              .single();

            if (retryData) {
              setPaymentIntent(retryData);
              // Check status column - only 'succeeded' means success
              if (retryData.status === 'succeeded') {
                setPaymentStatus('success');
              } else {
                setPaymentStatus('failed');
              }
            } else if (retryError) {
              console.error('Error retrying payment status:', retryError);
              setPaymentStatus('error');
            } else {
              setPaymentStatus('error');
            }
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setPaymentStatus('error');
      }
    };

    checkPaymentStatus();
  }, [sessionId]);

  const renderContent = () => {
    switch (paymentStatus) {
      case 'loading':
        return (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 animate-pulse">
              <AlertCircle size={48} className="text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Verifying Payment...
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Please wait while we confirm your payment.
            </p>
          </>
        );

      case 'success':
        return (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle size={48} className="text-green-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Thank you for your purchase. Your order has been confirmed.
            </p>
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-8">
              <p className="text-gray-700">
                Check your email for download links and order confirmation.
              </p>
            </div>
          </>
        );

      case 'failed':
        return (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
              <AlertCircle size={48} className="text-red-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Payment Failed
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your payment could not be processed.
            </p>
            <div className="bg-red-50 rounded-xl p-6 mb-8">
              <p className="text-gray-700">
                Please try again or contact support if the problem persists.
              </p>
            </div>
          </>
        );

      case 'error':
        return (
          <>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6">
              <AlertCircle size={48} className="text-yellow-600" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Unable to Verify Payment
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              We couldn't verify your payment status. Please check your email for confirmation.
            </p>
            <div className="bg-yellow-50 rounded-xl p-6 mb-8">
              <p className="text-gray-700">
                Check your email for order confirmation. If you have any questions, please contact support.
              </p>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <div className="text-center">
          {renderContent()}

          {paymentIntent && (
            <div className="text-xs text-gray-400 mb-6 space-y-1">
              <div>Status: {paymentIntent.status}</div>
              {sessionId && (
                <div>Session ID: {sessionId.substring(0, 20)}...</div>
              )}
            </div>
          )}

          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all"
          >
            Go Home
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
