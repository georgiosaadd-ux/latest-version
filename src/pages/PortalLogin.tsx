// pages/PortalLogin.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { Lock, Mail, BookOpen, ArrowLeft } from 'lucide-react';

const PortalLogin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect'); // Get redirect parameter
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // If already logged in, redirect to dashboard
      navigate('/portal/dashboard');
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/portal/dashboard`,
          }
        });
        if (signUpError) throw signUpError;
        
        // After successful registration, automatically sign in
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) {
          // If auto sign-in fails, show success message and switch to login
          setSuccessMessage('Account created! Please check your email to confirm, then sign in.');
          setTimeout(() => {
            setIsSignUp(false);
            setLoading(false);
            setPassword('');
          }, 2000);
        } else if (data.session) {
          // Auto sign-in successful
          setSuccessMessage('Account created successfully! Redirecting to your library...');
          setTimeout(() => {
            navigate(redirectTo === 'dashboard' ? '/portal/dashboard' : '/portal/dashboard');
          }, 1000);
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        if (data.session) {
          setSuccessMessage('Sign in successful! Redirecting...');
          setTimeout(() => {
            navigate(redirectTo === 'dashboard' ? '/portal/dashboard' : '/portal/dashboard');
          }, 1000);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/portal/dashboard`,
        }
      });
      if (error) throw error;
      setSuccessMessage('Redirecting to Google...');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 flex items-center justify-center p-4">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-gradient-to-br from-[hsl(333,65%,85%)] to-[hsl(335,77%,90%)] rounded-full opacity-20 animate-pulse" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-gradient-to-br from-[hsl(333,65%,85%)] to-[hsl(335,77%,90%)] rounded-full opacity-20 animate-pulse" />

      <div className="max-w-md w-full relative z-10">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] rounded-full mb-4 shadow-lg">
            <BookOpen className="text-white" size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            {isSignUp ? 'Create Your Account' : 'Welcome Back'}
          </h1>
          <p className="text-gray-600">
            {redirectTo === 'dashboard' 
              ? (isSignUp ? 'Register to access your purchased eBooks' : 'Sign in to access your purchased eBooks')
              : (isSignUp ? 'Join us to access your eBooks' : 'Sign in to access your library')
            }
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
          
          {/* Purchase Notice */}
          {redirectTo === 'dashboard' && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm bg-blue-50 border border-blue-200 text-blue-700">
              <p className="font-semibold mb-1">✓ Payment Successful!</p>
              <p className="text-xs">Please {isSignUp ? 'create an account' : 'sign in'} to access your purchased eBooks.</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm bg-green-50 border border-green-200 text-green-700">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:border-gray-400 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mb-6 group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500 font-medium">Or continue with email</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${loading ? 'text-gray-300' : 'text-gray-400'}`} size={20} />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder="your@email.com"
                />
              </div>
              {redirectTo === 'dashboard' && isSignUp && (
                <p className="mt-1 text-xs text-gray-500">Use the same email from your purchase</p>
              )}
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${loading ? 'text-gray-300' : 'text-gray-400'}`} size={20} />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                  placeholder={isSignUp ? "Create a password (min 6 characters)" : "Enter your password"}
                  minLength={isSignUp ? 6 : undefined}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[hsl(333,65%,59%)] to-[hsl(335,77%,80%)] text-white py-3 px-4 rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 mt-6"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  {isSignUp ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : (
                isSignUp ? 'Create Account & Access Library' : 'Sign In'
              )}
            </button>
          </form>

          {/* Toggle Sign In/Sign Up */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
                setSuccessMessage('');
                setPassword('');
              }}
              disabled={loading}
              className="text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSignUp 
                ? '← Already have an account? Sign In' 
                : "Don't have an account? Sign Up →"
              }
            </button>
          </div>
        </div>

        {/* Back to Store */}
        <div className="text-center mt-6">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium text-sm transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Store
          </a>
        </div>

        {/* Trust Badge */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            🔒 Secure authentication powered by Supabase
          </p>
        </div>
      </div>
    </div>
  );
};

export default PortalLogin;