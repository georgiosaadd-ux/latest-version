import { CartItem } from '../types';
import { SecurityValidator, RateLimiter } from './security';

export interface CheckoutSessionRequest {
  items: CartItem[];
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    marketingConsent: boolean;
  };
  successUrl: string;
  cancelUrl: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export const createCheckoutSession = async (
  request: CheckoutSessionRequest
): Promise<CheckoutSessionResponse> => {
  // Rate limiting check
  const clientId = `${request.customer.email}-${Date.now()}`;
  const rateLimitCheck = RateLimiter.checkLimit(clientId, 3, 300000); // 3 requests per 5 minutes
  
  if (!rateLimitCheck.allowed) {
    throw new Error('Too many checkout attempts. Please wait before trying again.');
  }

  // Input validation
  const emailValidation = SecurityValidator.validateEmail(request.customer.email);
  if (!emailValidation.isValid) {
    throw new Error(emailValidation.error || 'Invalid email');
  }

  const firstNameValidation = SecurityValidator.validateName(request.customer.firstName, 'First name');
  if (!firstNameValidation.isValid) {
    throw new Error(firstNameValidation.error || 'Invalid first name');
  }

  const lastNameValidation = SecurityValidator.validateName(request.customer.lastName, 'Last name');
  if (!lastNameValidation.isValid) {
    throw new Error(lastNameValidation.error || 'Invalid last name');
  }

  // Validate cart items
  if (!Array.isArray(request.items) || request.items.length === 0 || request.items.length > 20) {
    throw new Error('Invalid cart items');
  }

  for (const item of request.items) {
    const itemValidation = SecurityValidator.validateCartItem(item);
    if (!itemValidation.isValid) {
      throw new Error(itemValidation.error || 'Invalid cart item');
    }
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Configuration error. Please contact support.');
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/create-checkout-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'X-Client-Version': '1.0.0',
          'X-Request-ID': crypto.randomUUID(),
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
        mode: 'cors',
        credentials: 'omit',
      }
    );

    if (!response.ok) {
      let errorMessage = 'Failed to create checkout session';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (parseError) {
        // If we can't parse the error response, use the status text
        errorMessage = response.statusText || errorMessage;
      }
      
      console.error('Checkout session creation failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorMessage
      });
      
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.url) {
      throw new Error('No checkout URL received');
    }

    return data;
  } catch (error) {
    console.error('Network error during checkout:', error);
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and try again.');
    }
    
    throw error;
  }
};