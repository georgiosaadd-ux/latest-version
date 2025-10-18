import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
};
// Rate limiting for download requests
const downloadRateLimit = new Map();
function checkDownloadRateLimit(identifier, maxRequests = 20, windowMs = 3600000) {
  const now = Date.now();
  const current = downloadRateLimit.get(identifier);
  if (!current || now > current.resetTime) {
    downloadRateLimit.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  if (current.count >= maxRequests) {
    return false;
  }
  current.count++;
  return true;
}
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { orderId, productId } = await req.json();
    if (!orderId || !productId) {
      return new Response(JSON.stringify({
        error: 'Order ID and Product ID required'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `download:${clientIP}:${orderId}`;
    if (!checkDownloadRateLimit(rateLimitKey)) {
      console.log('Download rate limit exceeded for:', rateLimitKey);
      return new Response(JSON.stringify({
        error: 'Too many download requests. Please try again later.'
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Verify the download record exists and is valid
    const { data: download, error: downloadError } = await supabase.from('downloads').select(`
        *,
        orders!inner (
          status,
          customers (email)
        )
      `).eq('order_id', orderId).eq('product_id', productId).single();
    if (downloadError || !download) {
      console.log('Download not found:', {
        orderId,
        productId
      });
      return new Response(JSON.stringify({
        error: 'Download not found or expired'
      }), {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Check if order is paid
    if (download.orders.status !== 'paid') {
      return new Response(JSON.stringify({
        error: 'Order not paid'
      }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Check if download has expired
    if (new Date(download.expires_at) < new Date()) {
      return new Response(JSON.stringify({
        error: 'Download link has expired'
      }), {
        status: 410,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Generate signed URL (placeholder - in production, use Supabase storage signed URLs)
    const fileName = `${productId}.html`;
    const expiresIn = 3600; // 1 hour
    try {
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage.from('ebooks').createSignedUrl(fileName, expiresIn);
      if (signedUrlError) {
        console.error('Failed to create signed URL:', signedUrlError);
        return new Response(JSON.stringify({
          success: false,
          error: 'Failed to generate secure download link',
          details: signedUrlError.message
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // Update download record with the signed URL
      await supabase.from('downloads').update({
        signed_url: signedUrlData.signedUrl
      }).eq('id', download.id);
      console.log('Signed URL generated:', {
        orderId,
        productId,
        customerEmail: download.orders.customers.email,
        expiresIn
      });
      return new Response(JSON.stringify({
        success: true,
        download_url: signedUrlData.signedUrl,
        expires_in: expiresIn
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } catch (storageError) {
      console.error('Storage error:', storageError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to generate download link'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Download generation failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate download link'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
