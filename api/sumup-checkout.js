
const fetch = require('node-fetch');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const SUMUP_API_KEY = process.env.SUMUP_API_KEY || 'sup_pk_jgRGG5OvqWr64ISrm38xs7owSSexGN2Zr';
const SUMUP_MERCHANT_EMAIL = process.env.SUMUP_MERCHANT_EMAIL || 'genti28@gmail.com';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { amount, date, time, duration, guests, customerEmail, customerName, customerPhone } = req.body;

    const bookingRef = `LKC-${Date.now().toString(36).toUpperCase()}`;

    const sumupResponse = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUMUP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_reference: bookingRef,
        amount: parseFloat(amount),
        currency: 'GBP',
        pay_to_email: SUMUP_MERCHANT_EMAIL,
        description: `Booking - ${date} ${time}`
      })
    });

    const sumupData = await sumupResponse.json();
    let checkoutId = SUMUP_API_KEY.startsWith('sup_pk') ? `mock-${Date.now()}` : sumupData.id;

    await pool.execute(
      `INSERT INTO bookings (booking_ref, checkout_id, amount, date, time, duration, guests, customer_name, customer_email, customer_phone, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [bookingRef, checkoutId, amount, date, time, duration, guests, customerName, customerEmail, customerPhone, new Date().toISOString()]
    );

    return res.status(200).json({ checkoutId, bookingRef, amount });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
