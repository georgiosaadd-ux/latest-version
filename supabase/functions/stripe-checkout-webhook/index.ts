import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import Stripe from 'npm:stripe@14.11.0';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature'
};
function calculateServerSideTotal(items) {
  const productPrices = {
    'trapped-in-his-game': 4200,
    'gaslighting-unmasked': 3400,
    'love-bombed-left': 3600,
    'why-attract-toxic': 3900,
    'dating-age-manipulators': 4200,
    'mr-almost': 3900,
    'love-vs-lust': 3600,
    'charmer-trap': 3600,
    'manipulation-recovery': 8100,
    'dating-red-flags': 8100
  };
  let subtotalCents = 0;
  for (const item of items){
    const pricePerUnit = productPrices[item.id];
    if (!pricePerUnit) {
      throw new Error(`Unknown product: ${item.id}`);
    }
    subtotalCents += pricePerUnit * item.quantity;
  }
  const discountCents = 0;
  const totalCents = subtotalCents - discountCents;
  return {
    subtotalCents,
    discountCents,
    totalCents
  };
}
async function processOrder(supabase, session) {
  // Extract customer info from session metadata
  const customerData = {
    firstName: session.metadata?.customer_first_name || '',
    lastName: session.metadata?.customer_last_name || '',
    email: session.customer_email || session.metadata?.customer_email || '',
    marketingConsent: session.metadata?.marketing_consent === 'true'
  };
  if (!customerData.email) {
    throw new Error('Customer email not found in session');
  }
  // Get line items from Stripe to reconstruct the order
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecretKey) {
    throw new Error('Stripe secret key not configured');
  }
  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16'
  });
  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: [
      'data.price.product'
    ]
  });
  // Convert line items back to our format
  const items = lineItems.data.map((lineItem)=>{
    const product = lineItem.price?.product;
    const productId = product?.metadata?.product_id || product?.name?.toLowerCase().replace(/\s+/g, '-') || 'unknown';
    const productType = product?.metadata?.product_type || 'ebook';
    const priceInDollars = (lineItem.price?.unit_amount || 0) / 100;
    return {
      type: productType,
      id: productId,
      quantity: lineItem.quantity || 1,
      item: {
        id: productId,
        title: product?.name || 'Unknown Product',
        subtitle: product?.description || '',
        price: priceInDollars,
        ebookIds: productType === 'bundle' ? [] : undefined // Will be populated based on bundle logic
      }
    };
  });
  const { subtotalCents, discountCents, totalCents } = calculateServerSideTotal(items);
  // Check if existing customer
  const { data: existingCustomer } = await supabase.from('customers').select('id').eq('email', customerData.email.toLowerCase()).maybeSingle();
  let customerId;
  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const { data: newCustomer, error: customerError } = await supabase.from('customers').insert({
      email: customerData.email.toLowerCase(),
      first_name: customerData.firstName,
      last_name: customerData.lastName
    }).select('id').single();
    if (customerError) {
      console.error('Customer creation error:', customerError);
      throw new Error('Failed to create customer');
    }
    customerId = newCustomer.id;
  }
  // Create order
  const { data: order, error: orderError } = await supabase.from('orders').insert({
    customer_id: customerId,
    status: 'paid',
    subtotal_cents: subtotalCents,
    discount_cents: discountCents,
    total_cents: totalCents,
    items_count: items.reduce((sum, item)=>sum + item.quantity, 0),
    bundle_free_count: 0
  }).select('id').single();
  if (orderError) {
    console.error('Order creation error:', orderError);
    throw new Error('Failed to create order');
  }
  // Create order items
  const orderItems = items.flatMap((item)=>{
    const items = [];
    for(let i = 0; i < item.quantity; i++){
      items.push({
        order_id: order.id,
        product_id: item.id,
        product_type: item.type,
        title: item.item.title,
        unit_price_cents: Math.round(item.item.price * 100),
        is_free: false
      });
    }
    return items;
  });
  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) {
    console.error('Order items creation error:', itemsError);
    throw new Error('Failed to create order items');
  }
  // Create download records
  const downloadRecords = items.flatMap((item)=>{
    if (item.type === 'ebook') {
      return [
        {
          order_id: order.id,
          product_id: item.id,
          signed_url: null,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
    } else if (item.type === 'bundle') {
      // For bundles, we need to map to individual ebooks
      const bundleEbookMap = {
        'manipulation-recovery': [
          'trapped-in-his-game',
          'gaslighting-unmasked',
          'love-bombed-left'
        ],
        'marriage-clarity': [
          'married-but-lonely',
          'married-miserable',
          'silent-divorce'
        ],
        'healing-betrayal': [
          'shattered-trust',
          'he-cheated-now-what',
          'broken-to-brilliant'
        ],
        'self-worth-reset': [
          'stop-settling',
          'choosing-you',
          'strong-single-thriving'
        ],
        'dating-red-flags': [
          'dating-age-manipulators',
          'mr-almost',
          'charmer-trap'
        ]
      };
      const ebookIds = bundleEbookMap[item.id] || [];
      return ebookIds.map((ebookId)=>({
          order_id: order.id,
          product_id: ebookId,
          signed_url: null,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        }));
    }
    return [];
  });
  if (downloadRecords.length > 0) {
    const { error: downloadsError } = await supabase.from('downloads').insert(downloadRecords);
    if (downloadsError) {
      console.error('Downloads creation error:', downloadsError);
    }
  }
  console.log('Order created successfully:', {
    orderId: order.id,
    customerId,
    sessionId: session.id,
    totalCents,
    itemsCount: orderItems.length
  });
  return {
    orderId: order.id,
    items: items
  };
}
// This is the main handler function that Supabase will call
Deno.serve(async (req)=>{
  const requestId = crypto.randomUUID();
  console.log('=== Stripe Webhook Debug Start ===');
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  console.log('Request ID:', requestId);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
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
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    console.log('Environment check:', {
      hasStripeKey: !!stripeSecretKey,
      stripeKeyPrefix: stripeSecretKey?.substring(0, 7) || 'MISSING',
      hasWebhookSecret: !!stripeWebhookSecret,
      webhookSecretPrefix: stripeWebhookSecret?.substring(0, 10) || 'MISSING',
      requestId
    });
    if (!stripeSecretKey) {
      console.error('STRIPE_SECRET_KEY not configured');
      return new Response(JSON.stringify({
        error: 'Stripe not configured'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16'
    });
    const signature = req.headers.get('stripe-signature');
    const body = await req.text();
    console.log('=== Webhook Signature Debug ===');
    console.log('Raw signature header:', signature);
    console.log('Body length:', body.length);
    console.log('Body preview (first 200 chars):', body.substring(0, 200));
    console.log('Environment variables check:', {
      hasSignature: !!signature,
      hasWebhookSecret: !!stripeWebhookSecret,
      webhookSecretLength: stripeWebhookSecret?.length || 0,
      webhookSecretPrefix: stripeWebhookSecret?.substring(0, 8) || 'MISSING',
      requestId
    });
    let event;
    // Verify webhook signature if secret is configured
    if (stripeWebhookSecret && signature) {
      try {
        console.log('=== Attempting Signature Verification ===');
        console.log('Using webhook secret (first 8 chars):', stripeWebhookSecret.substring(0, 8));
        console.log('Signature header parts:', signature.split(','));
        event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
        console.log('✅ Webhook signature verified successfully!');
        console.log('Event details:', {
          type: event.type,
          id: event.id,
          created: event.created,
          requestId
        });
      } catch (err) {
        console.error('❌ Webhook signature verification FAILED:');
        console.error('Error name:', err.name);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        console.error('Debug info:', {
          error: err.message,
          signatureLength: signature?.length || 0,
          secretLength: stripeWebhookSecret?.length || 0,
          bodyLength: body.length,
          requestId,
          timestamp: new Date().toISOString()
        });
        return new Response(JSON.stringify({
          error: 'Invalid signature',
          details: err.message,
          timestamp: new Date().toISOString(),
          debug: {
            hasSignature: !!signature,
            hasSecret: !!stripeWebhookSecret,
            signatureLength: signature?.length || 0,
            secretLength: stripeWebhookSecret?.length || 0,
            bodyLength: body.length
          }
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    } else {
      // For testing without webhook secret (NOT recommended for production)
      console.warn('⚠️ WARNING: Processing webhook without signature verification!');
      console.warn('Missing components:', {
        hasSecret: !!stripeWebhookSecret,
        hasSignature: !!signature,
        requestId
      });
      try {
        event = JSON.parse(body);
        console.log('✅ Event parsed successfully (no verification):', {
          eventType: event.type,
          eventId: event.id,
          requestId
        });
      } catch (parseError) {
        console.error('❌ Failed to parse webhook body:', {
          error: parseError.message,
          bodyPreview: body.substring(0, 100),
          requestId
        });
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
    }
    console.log('=== Processing Webhook Event ===');
    console.log('Event type:', event.type);
    console.log('Event ID:', event.id);
    console.log('Event created:', new Date(event.created * 1000).toISOString());
    console.log('Request ID:', requestId);
    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('Checkout session completed:', {
        sessionId: session.id,
        customerEmail: session.customer_email,
        amountTotal: session.amount_total,
        paymentStatus: session.payment_status,
        requestId
      });
      // Check if already processed (idempotency)
      const { data: existingPaymentIntent } = await supabase.from('payment_intents').select('id, order_id, status').eq('stripe_checkout_session_id', session.id).maybeSingle();
      console.log('DEBUG: Payment Intent Lookup Status:', {
        sessionId: session.id,
        found: !!existingPaymentIntent,
        currentStatus: existingPaymentIntent?.status || 'N/A'
      });
      if (existingPaymentIntent?.order_id) {
        console.log('Session already processed:', {
          sessionId: session.id,
          orderId: existingPaymentIntent.order_id,
          requestId
        });
        return new Response(JSON.stringify({
          received: true,
          message: 'Already processed',
          orderId: existingPaymentIntent.order_id
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      try {
        // Process the order directly from session data
        const { orderId, items: purchasedItems } = await processOrder(supabase, session);
        // Update payment intent record if it exists
        if (existingPaymentIntent) {
          await supabase.from('payment_intents').update({
            order_id: orderId,
            status: 'succeeded',
            // 👈 ADD THIS LINE
            stripe_payment_intent_id: session.payment_intent,
            processed_at: new Date().toISOString()
          }).eq('stripe_checkout_session_id', session.id);
        }
        // Send email with ebooks
        try {
          const supabaseUrl = Deno.env.get('SUPABASE_URL');
          const emailResponse = await fetch(`${supabaseUrl}/functions/v1/send-ebook-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`
            },
            body: JSON.stringify({
              orderId: orderId,
              customerEmail: session.customer_email || session.metadata?.customer_email,
              customerName: `${session.metadata?.customer_first_name || ''} ${session.metadata?.customer_last_name || ''}`.trim(),
              items: purchasedItems
            })
          });
          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error('Email sending failed:', {
              error: errorText,
              requestId
            });
          } else {
            console.log('Email sent successfully:', {
              requestId
            });
          }
        } catch (emailError) {
          console.error('Email sending error:', {
            error: emailError.message,
            requestId
          });
        }
        console.log('Webhook processed successfully:', {
          sessionId: session.id,
          orderId,
          requestId
        });
        return new Response(JSON.stringify({
          received: true,
          orderId
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } catch (error1) {
        console.error('Failed to process completed checkout:', {
          error: error1.message,
          sessionId: session.id,
          requestId
        });
        // Update payment intent status to failed if it exists
        if (existingPaymentIntent) {
          await supabase.from('payment_intents').update({
            status: 'failed'
          }).eq('stripe_checkout_session_id', session.id);
        }
        return new Response(JSON.stringify({
          error: 'Failed to process order',
          details: error1.message
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    // Handle other events
    if (event.type === 'checkout.session.expired') {
      const session = event.data.object;
      await supabase.from('payment_intents').update({
        status: 'canceled'
      }).eq('stripe_checkout_session_id', session.id);
      console.log('Checkout session expired:', {
        sessionId: session.id,
        requestId
      });
    }
    return new Response(JSON.stringify({
      received: true
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error1) {
    console.error('Webhook processing failed:', {
      error: error1.message,
      stack: error1.stack,
      requestId
    });
    return new Response(JSON.stringify({
      error: 'Webhook processing failed',
      details: error1.message
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
