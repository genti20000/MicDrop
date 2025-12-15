require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialize Firebase Admin (Firestore)
if (!admin.apps.length) {
  try {
    admin.initializeApp();
    console.log('🔥 Firebase Admin Initialized');
  } catch (error) {
    console.error('Firebase init failed:', error);
  }
}

const db = admin.firestore();
const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_prod';

app.use(cors());
app.use(express.json());

// --- SERVE STATIC FRONTEND ---
app.use(express.static(path.join(__dirname, '../dist')));

// --- MIDDLEWARE ---
const authenticateOptional = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) req.user = user;
      next();
    });
  } else {
    next();
  }
};

const authenticateRequired = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

// --- AUTH ENDPOINTS ---

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing fields' });

  try {
    // Check if user exists
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (!userSnapshot.empty) return res.status(400).json({ error: 'Email already exists' });

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create user
    const newUserRef = db.collection('users').doc();
    const newUser = {
      id: newUserRef.id,
      name,
      email,
      passwordHash,
      createdAt: Date.now()
    };
    await newUserRef.set(newUser);

    // Generate Token
    const token = jwt.sign({ uid: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ 
      token, 
      user: { id: newUser.id, name: newUser.name, email: newUser.email } 
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (userSnapshot.empty) return res.status(400).json({ error: 'Invalid credentials' });

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    const validPass = await bcrypt.compare(password, userData.passwordHash);
    if (!validPass) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ uid: userData.id, email: userData.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ 
      token, 
      user: { id: userData.id, name: userData.name, email: userData.email } 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// --- BOOKING HELPERS ---
const parseTime = (t) => parseInt(t.split(':')[0], 10);

const checkOverlap = async (roomId, date, time, duration) => {
  const newStart = parseTime(time);
  const newEnd = newStart + duration;

  const snapshot = await db.collection('bookings')
    .where('roomId', '==', roomId)
    .where('date', '==', date)
    .get();

  for (const doc of snapshot.docs) {
    const b = doc.data();
    const bStart = parseTime(b.time);
    const bEnd = bStart + b.duration;

    if (newStart < bEnd && newEnd > bStart) {
      return true;
    }
  }
  return false;
};

// --- BOOKING ENDPOINTS ---

// Check Availability (Public)
app.get('/api/availability', async (req, res) => {
  const { roomId, date } = req.query;
  if (!roomId || !date) return res.status(400).json({ error: 'Missing roomId or date' });

  try {
    const snapshot = await db.collection('bookings')
      .where('roomId', '==', roomId)
      .where('date', '==', date)
      .get();
    
    const busySlots = snapshot.docs.map(doc => ({
      time: doc.data().time,
      duration: doc.data().duration
    }));

    res.json(busySlots);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

// Get MY bookings (Protected)
app.get('/api/bookings', authenticateRequired, async (req, res) => {
  try {
    // Only return bookings for this user
    const snapshot = await db.collection('bookings')
      .where('userId', '==', req.user.uid)
      .orderBy('timestamp', 'desc')
      .get();
    
    const bookings = snapshot.docs.map(doc => doc.data());
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Create a booking (Optional Auth)
app.post('/api/bookings', authenticateOptional, async (req, res) => {
  try {
    const booking = req.body;
    
    // Attach User ID if logged in
    if (req.user) {
      booking.userId = req.user.uid;
    }

    const isBooked = await checkOverlap(booking.roomId, booking.date, booking.time, booking.duration);
    if (isBooked) return res.status(409).json({ error: 'Time slot is no longer available' });

    await db.collection('bookings').doc(booking.id).set(booking);
    res.status(201).json({ status: 'saved' });
  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

// Delete a booking (Protected)
app.delete('/api/bookings/:id', authenticateRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('bookings').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ error: 'Booking not found' });
    
    // Check ownership
    if (doc.data().userId !== req.user.uid) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await docRef.delete();
    res.json({ status: 'deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// --- STRIPE ---
app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, currency = 'gbp', metadata } = req.body;
  
  if (metadata && metadata.roomId) {
    try {
      const isBooked = await checkOverlap(
        metadata.roomId, 
        metadata.date, 
        metadata.time, 
        parseInt(metadata.duration)
      );
      if (isBooked) return res.status(409).send({ error: { message: "Slot taken." } });
    } catch (e) {
      // ignore
    }
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: metadata || {}
    });
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (e) {
    res.status(400).send({ error: { message: e.message } });
  }
});

app.post('/api/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
  response.send();
});

// --- CATCH-ALL ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));