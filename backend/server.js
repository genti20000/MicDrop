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

// Database Initialization
async function initDb() {
  try {
    // Create Users Table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create Bookings Table with unique booking_ref
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        booking_ref VARCHAR(50) UNIQUE NOT NULL,
        checkout_id VARCHAR(100),
        amount DECIMAL(10, 2) NOT NULL,
        date DATE NOT NULL,
        time TIME NOT NULL,
        duration INT NOT NULL,
        guests INT NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        paid_at DATETIME
      )
    `);

    // Seed Default Admin if none exists
    const [rows] = await pool.execute('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    if (rows.length === 0) {
      const adminEmail = 'admin@londonkaraoke.club';
      const adminPass = 'admin123';
      const hashedPass = await bcrypt.hash(adminPass, 10);
      await pool.execute(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        ['System Admin', adminEmail, hashedPass, 'admin']
      );
      console.log('✅ Default admin created: admin@londonkaraoke.club / admin123');
    }
  } catch (err) {
    console.error('❌ DB Init Error:', err.message);
  }
}

initDb();

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
      'INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
      [name, email, passwordHash, 'user', new Date().toISOString()]
    );
    
    const token = jwt.sign({ email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name, email, role: 'user' } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(400).json({ error: 'User not found' });
    
    const user = rows[0];
    if (!await bcrypt.compare(password, user.password_hash)) return res.status(400).json({ error: 'Wrong password' });
    
    const token = jwt.sign({ email, name: user.name, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, email, role: user.role || 'user' } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- ADMIN ENDPOINTS ---
app.get('/api/admin/bookings', auth, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM bookings ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// --- BOOKING ENDPOINTS ---
app.get('/api/availability', async (req, res) => {
  const { roomId, date } = req.query;
  try {
    const [rows] = await pool.execute(
      'SELECT time, duration FROM bookings WHERE date = ? AND status = "confirmed"',
      [date]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/sumup/create-checkout', async (req, res) => {
  const { amount, date, time, duration, guests, name, email, phone } = req.body;
  // Format: BK<timestamp>
  const bookingRef = `BK${Date.now()}`;

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