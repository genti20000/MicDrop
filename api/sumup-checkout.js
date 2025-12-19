
const fetch = require('node-fetch');
const { Firestore } = require('@google-cloud/firestore');

// Initialize Firestore
// In a real GCP environment, this uses service account credentials from env
const db = new Firestore();

const SUMUP_API_KEY = process.env.SUMUP_API_KEY || 'sup_pk_jgRGG5OvqWr64ISrm38xs7owSSexGN2Zr';
const SUMUP_MERCHANT_EMAIL = process.env.SUMUP_MERCHANT_EMAIL || 'genti28@gmail.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { amount, currency = 'GBP', roomName, date, time, duration, guests, customerEmail, customerName, customerPhone } = req.body;

    if (!amount || !customerEmail) {
      return res.status(400).json({ error: 'Missing required booking information' });
    }

    const bookingRef = `LKC-${Date.now().toString(36).toUpperCase()}`;

    // 1. Create SumUp Checkout
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

    const sumupData = await sumupResponse.json();
    let checkoutId = sumupData.id;

    // Handle public key / dev mode
    if (SUMUP_API_KEY.startsWith('sup_pk') || sumupResponse.status === 401) {
      checkoutId = `mock-checkout-${Date.now()}`;
    }

    // 2. Save Pending Booking to Google Cloud Firestore
    const bookingData = {
      bookingRef,
      checkoutId,
      amount: parseFloat(amount),
      currency,
      roomName: roomName || 'Soho Suite',
      date,
      time,
      duration: parseInt(duration),
      guests: parseInt(guests),
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone
      },
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await db.collection('bookings').doc(bookingRef).set(bookingData);

    return res.status(200).json({
      checkoutId,
      bookingRef,
      amount
    });

  } catch (err) {
    console.error('GCP Firestore/SumUp Error:', err);
    return res.status(500).json({ error: 'Failed to initialize booking in Google Cloud', message: err.message });
  }
};
