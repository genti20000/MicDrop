
const fetch = require('node-fetch');
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    const { bookingRef, checkoutId } = req.body;
    // Assuming payment verification happened or is mock
    await pool.execute(
      'UPDATE bookings SET status = "confirmed", paid_at = ? WHERE booking_ref = ?',
      [new Date().toISOString(), bookingRef]
    );
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
