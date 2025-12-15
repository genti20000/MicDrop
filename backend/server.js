require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_in_prod';

// SumUp Configuration
const SUMUP_API_KEY = process.env.SUMUP_API_KEY;
// The merchant email used to register the SumUp account
const SUMUP_MERCHANT_EMAIL = process.env.SUMUP_MERCHANT_EMAIL || 'merchant@example.com'; 

app.use(cors());
app.use(express.json());

// --- SERVE STATIC FRONTEND ---
app.use(express.static(path.join(__dirname, '../dist')));

// --- DATABASE ABSTRACTION (Mock vs Firebase) ---
let db;
let USE_MOCK = false;

// Mock DB Implementation
const mockData = { users: [], bookings: [] };

class MockCollection {
  constructor(name) { this.name = name; }
  
  doc(id) { 
    return {
      set: async (data) => {
        const item = { ...data, id: id || Math.random().toString(36).substr(2, 9) };
        const idx = mockData[this.name].findIndex(x => x.id === item.id);
        if (idx >= 0) mockData[this.name][idx] = item;
        else mockData[this.name].push(item);
        return item;
      },
      get: async () => {
        const item = mockData[this.name].find(x => x.id === id);
        return { exists: !!item, data: () => item };
      },
      delete: async () => {
        const idx = mockData[this.name].findIndex(x => x.id === id);
        if (idx >= 0) mockData[this.name].splice(idx, 1);
      }
    }
  }

  where(field, op, val) {
    // Return a query object
    return new MockQuery(this.name, (items) => items.filter(x => x[field] === val));
  }

  orderBy(field, dir) {
    return new MockQuery(this.name, (items) => items.sort((a,b) => dir === 'desc' ? b[field] - a[field] : a[field] - b[field]));
  }
}

class MockQuery {
  constructor(name, filterFn) {
    this.name = name;
    this.filterFn = filterFn;
  }

  where(field, op, val) {
    const oldFn = this.filterFn;
    this.filterFn = (items) => oldFn(items).filter(x => x[field] === val);
    return this;
  }

  orderBy(field, dir) {
    // Note: In simple mock, sorting after filtering is roughly fine
    const oldFn = this.filterFn;
    this.filterFn = (items) => oldFn(items).sort((a,b) => dir === 'desc' ? b[field] - a[field] : a[field] - b[field]);
    return this;
  }

  async get() {
    const items = this.filterFn(mockData[this.name] || []);
    return {
      empty: items.length === 0,
      docs: items.map(item => ({
        id: item.id,
        data: () => item
      }))
    }
  }
}

// Initialize Database
const admin = require('firebase-admin');
try {
  if (!admin.apps.length) {
     if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_CONFIG) {
        throw new Error("No credentials");
     }
     admin.initializeApp();
  }
  db = admin.firestore();
  console.log('🔥 Firebase Connected');
} catch (error) {
  console.log('⚠️  Firebase not configured. Switching to In-Memory Mock DB.');
  USE_MOCK = true;
  db = {
    collection: (name) => new MockCollection(name)
  };
}

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
    const userSnapshot = await db.collection('users').where('email', '==', email).get();
    if (!userSnapshot.empty) return res.status(400).json({ error: 'Email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const newUserId = Math.random().toString(36).substr(2, 9);
    
    const newUser = {
      id: newUserId,
      name,
      email,
      passwordHash,
      createdAt: Date.now()
    };
    
    await db.collection('users').doc(newUserId).set(newUser);
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
const parseTime = (t) => t ? parseInt(t.split(':')[0], 10) : 0;

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
    console.error('Availability error', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
});

app.get('/api/bookings', authenticateRequired, async (req, res) => {
  try {
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

app.post('/api/bookings', authenticateOptional, async (req, res) => {
  try {
    const booking = req.body;
    if (req.user) booking.userId = req.user.uid;

    const isBooked = await checkOverlap(booking.roomId, booking.date, booking.time, booking.duration);
    if (isBooked) return res.status(409).json({ error: 'Time slot is no longer available' });

    await db.collection('bookings').doc(booking.id).set(booking);
    res.status(201).json({ status: 'saved' });
  } catch (error) {
    console.error('Error saving booking:', error);
    res.status(500).json({ error: 'Failed to save booking' });
  }
});

app.delete('/api/bookings/:id', authenticateRequired, async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('bookings').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return res.status(404).json({ error: 'Booking not found' });
    if (doc.data().userId !== req.user.uid) return res.status(403).json({ error: 'Unauthorized' });

    await docRef.delete();
    res.json({ status: 'deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete booking' });
  }
});

// --- SUMUP PAYMENT ENDPOINT ---
app.post('/api/create-sumup-checkout', async (req, res) => {
  const { amount, currency = 'GBP', metadata } = req.body;
  
  // 1. Availability Check
  if (metadata && metadata.roomId) {
    try {
      const isBooked = await checkOverlap(
        metadata.roomId, 
        metadata.date, 
        metadata.time, 
        parseInt(metadata.duration)
      );
      if (isBooked) return res.status(409).send({ error: { message: "Slot taken." } });
    } catch (e) { /* ignore */ }
  }

  // 2. SumUp Integration
  try {
    // FALLBACK: If no SumUp API key is present, return a mock checkout ID for UI testing
    if (!SUMUP_API_KEY) {
       console.log('⚠️ No SumUp API Key found. Returning MOCK checkout.');
       return res.json({ id: 'mock-checkout-' + Date.now() });
    }

    // Call SumUp API to create a checkout resource
    const response = await fetch('https://api.sumup.com/v0.1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUMUP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        checkout_reference: `REF-${Date.now()}`,
        amount: amount,
        currency: currency,
        pay_to_email: SUMUP_MERCHANT_EMAIL,
        description: `Booking for ${metadata?.roomName || 'Karaoke'}`
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.message || 'SumUp API error');
    }

    const data = await response.json();
    res.json({ id: data.id });
    
  } catch (e) {
    console.error('SumUp Error:', e);
    res.status(500).send({ error: { message: e.message } });
  }
});

// --- CATCH-ALL ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));