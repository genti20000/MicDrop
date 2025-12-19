
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'micdrop_hostinger_secret';

// SumUp Config
const SUMUP_API_KEY = process.env.SUMUP_API_KEY || 'sup_pk_jgRGG5OvqWr64ISrm38xs7owSSexGN2Zr';
const SUMUP_MERCHANT_EMAIL = process.env.SUMUP_MERCHANT_EMAIL || 'genti28@gmail.com';

// MySQL Connection Pool (Hostinger Local DB)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'micdrop_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.use(cors());
app.use(express.json());

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Auth required' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// --- AUTH ENDPOINTS ---
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT email FROM users WHERE email = ?', [email]);
    if (rows.length > 0) return res.status(400).json({ error: 'User exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)',
      [name, email, passwordHash, new Date().toISOString()]
    );
    
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name, email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(400).json({ error: 'User not found' });
    
    const user = rows[0];
    if (!await bcrypt.compare(password, user.password_hash)) return res.status(400).json({ error: 'Wrong password' });
    
    const token = jwt.sign({ email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- BOOKING ENDPOINTS ---
app.get('/api/availability', async (req, res) => {
  const { roomId, date } = req.query;
  try {
    const [rows] = await pool.execute(
      'SELECT time, duration FROM bookings WHERE room_id = ? AND date = ? AND status = "confirmed"',
      [roomId || 'soho', date]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sumup/create-checkout', async (req, res) => {
  const { amount, date, time, duration, guests, name, email, phone } = req.body;
  const bookingRef = `LKC-${Date.now().toString(36).toUpperCase()}`;

  try {
    const sumupRes = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUMUP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_reference: bookingRef,
        amount,
        currency: 'GBP',
        pay_to_email: SUMUP_MERCHANT_EMAIL,
        description: `Soho Booking: ${date} ${time}`
      })
    });

    let checkoutId;
    const sumupData = await sumupRes.json();

    if (SUMUP_API_KEY.startsWith('sup_pk') || !sumupRes.ok) {
      checkoutId = `mock-${Date.now()}`;
    } else {
      checkoutId = sumupData.id;
    }

    // Save Pending Booking to MySQL
    await pool.execute(
      `INSERT INTO bookings 
      (booking_ref, checkout_id, amount, date, time, duration, guests, customer_name, customer_email, customer_phone, status, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [bookingRef, checkoutId, amount, date, time, duration, guests, name, email, phone, 'pending', new Date().toISOString()]
    );

    res.json({ bookingRef, checkoutId, amount });
  } catch (e) { 
    console.error('Checkout error:', e);
    res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/bookings/confirm', async (req, res) => {
  const { bookingRef, checkoutId } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM bookings WHERE booking_ref = ?', [bookingRef]);
    if (rows.length === 0) return res.status(404).json({ error: 'Booking not found' });

    await pool.execute(
      'UPDATE bookings SET status = "confirmed", paid_at = ? WHERE booking_ref = ?',
      [new Date().toISOString(), bookingRef]
    );
    
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/bookings', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM bookings WHERE customer_email = ? ORDER BY created_at DESC',
      [req.user.email]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`🚀 MicDrop Hostinger Backend on Port ${PORT}`));
