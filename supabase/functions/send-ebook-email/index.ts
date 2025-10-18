function getCorsHeaders(supabaseUrl) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://habit-tracker-app-bemz.bolt.host',
    supabaseUrl
  ];
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey'
  };
}
Deno.serve(async (req)=>{
  const requestId = req.headers.get('sb-request-id') || crypto.randomUUID();
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const corsHeaders = getCorsHeaders(supabaseUrl);
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    console.log('Method not allowed:', {
      method: req.method,
      requestId
    });
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
    const data = await req.json();
    const { orderId, customerEmail, customerName, items } = data;
    const allEbookIds = [];
    items.forEach((item)=>{
      if (item.type === 'ebook') {
        allEbookIds.push(item.id);
      } else if (item.type === 'bundle' && item.item.ebookIds) {
        allEbookIds.push(...item.item.ebookIds);
      }
    });
    // Generate secure download links for each ebook
    const downloadLinks = [];
    for (const ebookId of allEbookIds){
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/generate-download`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            orderId: orderId,
            productId: ebookId
          })
        });
        if (!response.ok) {
          console.error(`Failed to generate download link for ${ebookId}:`, await response.text());
          continue; // Skip this ebook if we can't generate a secure link
        }
        const downloadData = await response.json();
        const fileName = `${ebookId}.html`;
        downloadLinks.push({
          id: ebookId,
          fileName: fileName,
          downloadUrl: downloadData.download_url
        });
      } catch (error) {
        console.error(`Error generating download link for ${ebookId}:`, error);
      // Skip this ebook if there's an error
      }
    }
    if (downloadLinks.length === 0) {
      throw new Error('Failed to generate any secure download links');
    }
    const downloadLinksHtml = downloadLinks.map((link)=>{
      const title = link.id.split('-').map((word)=>word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      return `
          <div style="margin-bottom: 15px; padding: 15px; background-color: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong style="color: #1f2937; font-size: 15px;">${title}</strong>
                <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">PDF Format</p>
              </div>
              <a href="${link.downloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #6b21a8 0%, #e11d48 100%); color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Download
              </a>
            </div>
          </div>
        `;
    }).join('');
    const itemsList = items.map((item)=>{
      const subtitle = item.item.subtitle ? `<br><span style="color: #6b7280; font-size: 14px;">${item.item.subtitle}</span>` : '';
      return `
          <div style="margin-bottom: 15px; padding: 15px; background-color: #f3f4f6; border-radius: 8px;">
            <strong style="color: #1f2937; font-size: 16px;">${item.item.title}</strong>${subtitle}
            <div style="margin-top: 8px; color: #6b7280; font-size: 14px;">
              <span>Type: ${item.type === 'ebook' ? 'eBook' : 'Bundle'}</span> |
              <span>Quantity: ${item.quantity}</span> |
              <span>Price: $${item.item.price}</span>
            </div>
          </div>
        `;
    }).join('');
    const totalAmount = items.reduce((sum, item)=>sum + item.item.price * item.quantity, 0);
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <div style="background: linear-gradient(135deg, #6b21a8 0%, #e11d48 50%, #ec4899 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">HeartWise</h1>
      <p style="color: #ffffff; margin: 10px 0 0 0; opacity: 0.9; font-size: 18px;">Your eBooks Are Ready!</p>
    </div>

    <div style="padding: 40px 20px;">
      <h2 style="color: #1f2937; margin: 0 0 10px 0; font-size: 24px;">Hi ${customerName},</h2>
      <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0; font-size: 16px;">
        Thank you for your purchase! We're excited to support you on your journey. Your eBooks are ready to download below.
      </p>

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #92400e; margin: 0; font-weight: 500; font-size: 14px;">
          📥 Important: Please download your eBooks within the next 30 days. Save them to your device for permanent access.
        </p>
      </div>

      <h3 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 20px;">Download Your eBooks</h3>
      ${downloadLinksHtml}

      <h3 style="color: #1f2937; margin: 30px 0 15px 0; font-size: 20px;">Order Summary</h3>
      <p style="color: #6b7280; margin: 0 0 15px 0; font-size: 14px;">Order ID: <strong>${orderId}</strong></p>
      
      ${itemsList}

      <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
        <p style="color: #1f2937; font-size: 20px; font-weight: bold; margin: 0;">
          Total: $${totalAmount.toFixed(2)}
        </p>
      </div>

      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #e5e7eb;">
        <h4 style="color: #1f2937; margin: 0 0 10px 0; font-size: 16px;">Need Help?</h4>
        <p style="color: #6b7280; margin: 0; line-height: 1.6; font-size: 14px;">
          If you have any questions or issues downloading your eBooks, please contact our support team. We're here to help!
        </p>
      </div>

      <p style="color: #4b5563; line-height: 1.6; margin: 20px 0 0 0; font-size: 15px;">
        Thank you for choosing HeartWise. We're honored to be part of your journey to clarity and healing.
      </p>

      <p style="color: #4b5563; margin: 30px 0 0 0; font-size: 15px;">
        With love and support,<br>
        <strong>The HeartWise Team</strong>
      </p>
    </div>

    <div style="background-color: #1f2937; padding: 30px 20px; text-align: center;">
      <p style="color: #9ca3af; margin: 0 0 10px 0; font-size: 14px;">
        HeartWise - Empowering women to choose love that honors them
      </p>
      <p style="color: #6b7280; margin: 0; font-size: 12px;">
        © ${new Date().getFullYear()} HeartWise. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
    `;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'HeartWise <onboarding@resend.dev>',
          to: [
            customerEmail
          ],
          subject: 'Your HeartWise eBooks Are Ready! 📚',
          html: emailHtml
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API error: ${errorText}`);
      }
      const result = await response.json();
      console.log('Email sent successfully via Resend:', result);
      return new Response(JSON.stringify({
        success: true,
        message: 'Email sent successfully',
        recipient: customerEmail,
        emailId: result.id
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    } else {
      console.log('RESEND_API_KEY not configured. Email HTML generated but not sent.');
      console.log('Email would be sent to:', customerEmail);
      console.log('Download links generated:', downloadLinks.length);
      return new Response(JSON.stringify({
        success: true,
        message: 'Email service not configured. HTML generated successfully.',
        recipient: customerEmail,
        downloadLinks: downloadLinks
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    console.error('Email error:', {
      error: error.message,
      requestId
    });
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Failed to send email'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
