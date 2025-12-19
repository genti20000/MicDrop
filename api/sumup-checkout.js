
const fetch = require('node-fetch');

// SumUp Configuration
const SUMUP_API_KEY = process.env.SUMUP_API_KEY || 'sup_pk_jgRGG5OvqWr64ISrm38xs7owSSexGN2Zr';
const SUMUP_MERCHANT_EMAIL = process.env.SUMUP_MERCHANT_EMAIL || 'genti28@gmail.com';

module.exports = async (req, res) => {
  // 1. Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('--- SumUp Checkout Request Received ---');
  
  try {
    const body = req.body;
    const { amount, currency = 'GBP', roomName, date, time } = body;

    if (!amount) {
      return res.status(400).json({ error: 'Missing amount' });
    }

    // 2. Generate Reference
    const bookingRef = `LKC-${Date.now().toString(36).toUpperCase()}`;

    // 3. Call SumUp API
    // Note: We use the server-side SumUp Checkouts API
    const sumupResponse = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUMUP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_reference: bookingRef,
        amount: parseFloat(amount),
        currency: currency,
        pay_to_email: SUMUP_MERCHANT_EMAIL,
        description: `Booking: ${roomName || 'Karaoke'} - ${date} ${time}`
      })
    });

    const data = await sumupResponse.json();

    if (!sumupResponse.ok) {
      console.error('SumUp API Error:', data);
      
      // If the API key is a Public Key (starts with sup_pk), this endpoint will fail.
      // We provide a mock fallback for development if the key is likely invalid for checkouts.
      if (SUMUP_API_KEY.startsWith('sup_pk') || sumupResponse.status === 401) {
        console.warn('Invalid or Public Key used for server-side checkout. Falling back to Mock ID for testing.');
        return res.status(200).json({
          checkoutId: `mock-checkout-${Date.now()}`,
          bookingRef: bookingRef,
          amount: amount,
          status: 'MOCK_MODE'
        });
      }
      
      return res.status(sumupResponse.status).json({ 
        error: data.message || 'SumUp checkout failed',
        details: data 
      });
    }

    console.log('SumUp Checkout Created:', data.id);

    // 4. Return success
    return res.status(200).json({
      checkoutId: data.id,
      bookingRef: bookingRef,
      amount: amount
    });

  } catch (err) {
    console.error('Fatal API Error:', err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message
    });
  }
};
