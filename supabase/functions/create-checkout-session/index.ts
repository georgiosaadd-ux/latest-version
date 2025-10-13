import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import Stripe from 'npm:stripe@14.11.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Version, X-Request-ID'
};

// Price list - server-side validation (matching your webhook prices)
const PRICE_LIST = {
  'trapped-in-his-game': 4200,
  'gaslighting-unmasked': 3400,
  'love-bombed-left': 3600,
  'why-attract-toxic': 3900,
  'dating-age-manipulators': 4200,
  'mr-almost': 3900,
  'love-vs-lust': 3600,
  'charmer-trap': 3600,
  'manipulation-recovery': 8100,
  'dating-red-flags': 8100,
};

interface CartItem {
  type: 'ebook' | 'bundle';
  id: string;
  quantity: number;
  item: {
    id: string;
    title: string;
    price: number;
    [key: string]: any;
  };
  metadata?: {
    subtotal?: number;
    discount?: number;
    freeCount?: number;
    pricingMode?: string;
    originalItems?: Array<{ title: string; price: number }>;
  };
}

interface CheckoutRequest {
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

function validateAndCalculateTotal(items: CartItem[]): { totalCents: number; lineItems: any[] } {
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) {
    throw new Error('Invalid cart items');
  }

  let totalCents = 0;
  const lineItems: any[] = [];

  for (const item of items) {
    if (!item || !item.item || !item.item.id || !item.item.title) {
      throw new Error('Invalid item data');
    }

    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
      throw new Error('Invalid quantity');
    }

    // Get server-side price
    const serverPriceCents = PRICE_LIST[item.item.id];
    if (!serverPriceCents) {
      throw new Error(`Unknown product: ${item.item.id}`);
    }

    // Validate client price matches server price (within 1 cent tolerance for rounding)
    const clientPriceCents = Math.round(item.item.price * 100);
    if (Math.abs(clientPriceCents - serverPriceCents) > 1) {
      console.warn(`Price mismatch for ${item.item.id}: client=${clientPriceCents}, server=${serverPriceCents}`);
      // Use server price for security
    }

    const itemTotalCents = serverPriceCents * item.quantity;
    totalCents += itemTotalCents;

    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.item.title,
          metadata: {
            product_id: item.item.id,
            product_type: item.type,
          },
        },
        unit_amount: serverPriceCents,
      },
      quantity: item.quantity,
    });
  }

  return { totalCents, lineItems };
}

function validateCustomerData(customer: any): void {
  if (!customer || typeof customer !== 'object') {
    throw new Error('Invalid customer data');
  }

  // Email validation
  if (!customer.email || typeof customer.email !== 'string') {
    throw new Error('Email is required');
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(customer.email)) {
    throw new Error('Invalid email format');
  }

  // Name validation
  if (!customer.firstName || typeof customer.firstName !== 'string' || customer.firstName.length > 100) {
    throw new Error('Invalid first name');
  }

  if (!customer.lastName || typeof customer.lastName !== 'string' || customer.lastName.length > 100) {
    throw new Error('Invalid last name');
  }

  // Sanitize names (remove potentially dangerous characters)
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(customer.firstName) || !nameRegex.test(customer.lastName)) {
    throw new Error('Names contain invalid characters');
  }
}

// This is the main handler function that Supabase will call
Deno.serve(async (req) => {
  const requestId = crypto.randomUUID();
  
  console.log('=== Create Checkout Session Request ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request ID:', requestId);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    // Environment validation
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', {
      hasStripeKey: !!stripeSecretKey,
      stripeKeyPrefix: stripeSecretKey?.substring(0, 7) || 'MISSING',
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      requestId
    });

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables', { requestId });
      return new Response(JSON.stringify({
        error: 'Server configuration error'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Parse and validate request
    let requestData: CheckoutRequest;
    try {
      requestData = await req.json();
      console.log('Request data received:', {
        itemCount: requestData.items?.length || 0,
        customerEmail: requestData.customer?.email || 'missing',
        requestId
      });
    } catch (error) {
      console.error('Failed to parse JSON:', error.message);
      return new Response(JSON.stringify({
        error: 'Invalid JSON'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Validate customer data
    validateCustomerData(requestData.customer);

    // Validate and calculate total
    const { totalCents, lineItems } = validateAndCalculateTotal(requestData.items);

    console.log('Validation passed:', {
      totalCents,
      lineItemCount: lineItems.length,
      requestId
    });

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: requestData.successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: requestData.cancelUrl,
      customer_email: requestData.customer.email,
      metadata: {
        customer_first_name: requestData.customer.firstName,
        customer_last_name: requestData.customer.lastName,
        customer_email: requestData.customer.email,
        marketing_consent: requestData.customer.marketingConsent.toString(),
        request_id: requestId,
      },
      billing_address_collection: 'auto',
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes
    });

    console.log('Stripe session created:', {
      sessionId: session.id,
      url: session.url,
      requestId
    });

    // Store payment intent for tracking
    try {
      await supabase.from('payment_intents').insert({
        stripe_payment_intent_id: session.id,
        amount_cents: totalCents,
        currency: 'usd',
        status: 'created',
        customer_email: requestData.customer.email,
        metadata: {
          items: requestData.items.map(item => ({
            id: item.item.id,
            title: item.item.title,
            quantity: item.quantity,
            type: item.type,
          })),
          customer: {
            firstName: requestData.customer.firstName,
            lastName: requestData.customer.lastName,
            email: requestData.customer.email,
          },
          requestId,
        },
      });
      console.log('Payment intent stored successfully');
    } catch (dbError) {
      console.error('Failed to store payment intent:', dbError, { requestId });
      // Continue anyway - this is not critical for checkout
    }

    console.log('Checkout session created successfully:', {
      sessionId: session.id,
      totalCents,
      itemCount: requestData.items.length,
      requestId,
    });

    return new Response(JSON.stringify({
      sessionId: session.id,
      url: session.url,
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Checkout session creation failed:', {
      error: error.message,
      stack: error.stack,
      requestId,
    });

    // Return user-friendly error message
    let errorMessage = 'Failed to create checkout session';
    let statusCode = 500;

    if (error.message.includes('Invalid') || error.message.includes('required')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('Unknown product')) {
      errorMessage = 'Invalid product selection';
      statusCode = 400;
    } else if (error.message.includes('rate limit') || error.message.includes('Too many')) {
      errorMessage = 'Too many requests. Please wait and try again.';
      statusCode = 429;
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      requestId,
    }), {
      status: statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});