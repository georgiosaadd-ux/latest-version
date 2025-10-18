import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import Stripe from 'npm:stripe@14.11.0';
// --- Configuration ---
const MAX_REQUESTS = 15;
const WINDOW_MS = 5 * 60_000; // 5 minutes
const BLOCK_DURATION_MS = 60 * 60_000; // 1 hour
const RATE_LIMIT_BLOCK_MSG = 'Too many requests. Please wait and try again.';
const INVALID_METHOD_MSG = 'Method not allowed';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Version, X-Request-ID'
};
// --- Product price list (Server's source of truth) ---
const PRICE_LIST = {
  'trapped-in-his-game': 4200,
  'gaslighting-unmasked': 3400,
  'love-bombed-left': 3600,
  'why-attract-toxic': 3900,
  'dating-age-manipulators': 4200,
  'mr-almost': 3900,
  'love-vs-lust': 3600,
  'charmer-trap': 3600
};
// --- Helper functions ---
// FIX: Modified to THROW an error on price mismatch instead of correcting it.
function validateAndCalculateTotal(items) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 20) throw new Error('Invalid cart items');
  let totalCents = 0;
  const lineItems = [];
  for (const item of items){
    if (!item?.item?.id || !item.item.title) throw new Error('Invalid item data');
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) throw new Error('Invalid quantity');
    const serverPriceCents = PRICE_LIST[item.item.id];
    if (!serverPriceCents) throw new Error(`Unknown product: ${item.item.id}`);
    const clientPriceCents = Math.round(item.item.price * 100);
    // BLOCK on price mismatch (1 cent tolerance to account for potential float precision)
    if (Math.abs(clientPriceCents - serverPriceCents) > 1) {
      console.warn(`Price manipulation attempt blocked for ${item.item.id}: client=${clientPriceCents}, server=${serverPriceCents}`);
      throw new Error(`Price mismatch detected for ${item.item.title}. Cannot proceed with payment.`);
    }
    totalCents += serverPriceCents * item.quantity;
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.item.title,
          metadata: {
            product_id: item.item.id,
            product_type: item.type
          }
        },
        unit_amount: serverPriceCents
      },
      quantity: item.quantity
    });
  }
  if (totalCents <= 0 || totalCents > 100_000_00) throw new Error('Invalid total amount');
  return {
    totalCents,
    lineItems
  };
}
function validateCustomerData(customer) {
  if (!customer || typeof customer !== 'object') throw new Error('Invalid customer data');
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!customer.email || !emailRegex.test(customer.email)) throw new Error('Invalid email format');
  if (!customer.firstName || !customer.lastName) throw new Error('First and last name required');
  if (!/^[a-zA-Z\s\-']+$/.test(customer.firstName) || !/^[a-zA-Z\s\-']+$/.test(customer.lastName)) {
    throw new Error('Names contain invalid characters');
  }
}
function validateUrl(url) {
  try {
    const parsed = new URL(url);
    if (![
      'http:',
      'https:'
    ].includes(parsed.protocol)) throw new Error();
    return parsed.toString();
  } catch  {
    throw new Error('Invalid URL');
  }
}
// --- Logging helper ---
function safeLog(label, data) {
  const redacted = JSON.parse(JSON.stringify(data));
  if (redacted.customer_email) redacted.customer_email = '[REDACTED]';
  if (redacted.items) redacted.items = redacted.items.map((i)=>({
      id: i.item.id,
      quantity: i.quantity,
      type: i.type
    }));
  console.log(label, redacted);
}
// FIX: Rate Limiter using Supabase DB Function (Atomic)
async function checkRateLimit(supabase, ip) {
  // Call the atomic Postgres function to handle the read-modify-write logic
  const { data, error } = await supabase.rpc('rate_limit_request', {
    ip_address: ip
  }).single();
  if (error) {
    console.error('Rate limit RPC error for IP:', ip, error);
    // Fail safe: assume allowed to avoid service outage
    return {
      allowed: true,
      blocked: false
    };
  }
  if (data?.allowed === false) {
    return {
      allowed: false,
      blocked: true
    };
  }
  return {
    allowed: true,
    blocked: false
  };
}
// --- Main handler ---
Deno.serve(async (req)=>{
  const requestId = crypto.randomUUID();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || req.conn?.remoteAddr?.hostname || 'unknown';
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({
      error: INVALID_METHOD_MSG
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) throw new Error('Server configuration error');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // ✅ Rate limit check
    const rateCheck = await checkRateLimit(supabase, ip);
    if (!rateCheck.allowed) {
      console.warn('Rate limit exceeded for IP:', ip);
      return new Response(JSON.stringify({
        error: RATE_LIMIT_BLOCK_MSG
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Parse and validate request
    const requestData = await req.json();
    validateCustomerData(requestData.customer);
    requestData.successUrl = validateUrl(requestData.successUrl);
    requestData.cancelUrl = validateUrl(requestData.cancelUrl);
    // Validation includes the new strict price check
    const { totalCents, lineItems } = validateAndCalculateTotal(requestData.items);
    safeLog('Checkout request received:', {
      customer_email: requestData.customer.email,
      items: requestData.items,
      totalCents
    });
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });
    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: [
        'card'
      ],
      line_items: lineItems,
      mode: 'payment',
      success_url: requestData.successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: requestData.cancelUrl,
      customer_email: requestData.customer.email,
      metadata: {
        customer_first_name: requestData.customer.firstName,
        customer_last_name: requestData.customer.lastName,
        request_id: requestId
      },
      billing_address_collection: 'auto',
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60
    });
    // Save payment intent to Supabase
    await supabase.from('payment_intents').insert({
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id: null,
      amount_cents: totalCents,
      currency: 'usd',
      status: 'pending',
      customer_email: requestData.customer.email,
      metadata: {
        items: requestData.items.map((i)=>({
            id: i.item.id,
            title: i.item.title,
            quantity: i.quantity,
            type: i.type
          })),
        requestId
      }
    });
    safeLog('Checkout session created:', {
      sessionId: session.id,
      totalCents
    });
    return new Response(JSON.stringify({
      sessionId: session.id,
      url: session.url
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    let statusCode = 500;
    let errorMessage = error.message || 'Failed to create checkout session';
    // Classify errors for proper HTTP status codes
    if (errorMessage.includes('Invalid') || errorMessage.includes('required') || errorMessage.includes('Price mismatch') || errorMessage.includes('Unknown product')) {
      statusCode = 400; // Bad Request (e.g., invalid data or attempted price manipulation)
    } else if (errorMessage.includes('Too many')) {
      statusCode = 429; // Too Many Requests
    }
    console.warn('Checkout error:', {
      error: errorMessage,
      requestId
    });
    return new Response(JSON.stringify({
      error: errorMessage,
      requestId
    }), {
      status: statusCode,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
