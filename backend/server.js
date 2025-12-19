
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Firestore } = require('@google-cloud/firestore');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 8080; // Cloud Run default
const JWT_SECRET = process.env.JWT_SECRET || 'gcp_micdrop_secure_key';

// SumUp Config
const SUMUP_API_KEY = process.env.SUMUP_API_KEY || 'sup_pk_jgRGG5OvqWr64ISrm38xs7owSSexGN2Zr';
const SUMUP_MERCHANT_EMAIL = process.env.SUMUP_MERCHANT_EMAIL || 'genti28@gmail.com';

// Firestore Init
const db = new Firestore();

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

// Endpoints
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userRef = db.collection('users').doc(email);
    const doc = await userRef.get();
    if (doc.exists) return res.status(400).json({ error: 'User exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = { name, email, passwordHash, createdAt: new Date().toISOString() };
    await userRef.set(user);
    
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name, email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const doc = await db.collection('users').doc(email).get();
    if (!doc.exists) return res.status(400).json({ error: 'User not found' });
    
    const user = doc.data();
    if (!await bcrypt.compare(password, user.passwordHash)) return res.status(400).json({ error: 'Wrong password' });
    
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, email } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/availability', async (req, res) => {
  const { roomId, date } = req.query;
  const snapshot = await db.collection('bookings')
    .where('roomId', '==', roomId)
    .where('date', '==', date)
    .where('status', '==', 'confirmed')
    .get();
  res.json(snapshot.docs.map(d => d.data()));
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

    const sumupData = await sumupRes.json();
    let checkoutId = sumupData.id;

    if (SUMUP_API_KEY.startsWith('sup_pk') || !sumupRes.ok) {
      checkoutId = `mock-${Date.now()}`;
    }

    await db.collection('bookings').doc(bookingRef).set({
      bookingRef, checkoutId, amount, date, time, duration, guests,
      customer: { name, email, phone },
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    res.json({ bookingRef, checkoutId, amount });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/bookings/confirm', async (req, res) => {
  const { bookingRef, checkoutId } = req.body;
  try {
    // In production, verify checkoutId status via SumUp API here
    await db.collection('bookings').doc(bookingRef).update({ 
      status: 'confirmed',
      paidAt: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/bookings', auth, async (req, res) => {
  const snapshot = await db.collection('bookings')
    .where('customer.email', '==', req.user.email)
    .get();
  res.json(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
});

app.listen(PORT, () => console.log(`🚀 GCP Cloud Run Backend on ${PORT}`));
