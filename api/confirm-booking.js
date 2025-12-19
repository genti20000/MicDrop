
const fetch = require('node-fetch');
const { Firestore } = require('@google-cloud/firestore');

const db = new Firestore();
const SUMUP_API_KEY = process.env.SUMUP_API_KEY || 'sup_pk_jgRGG5OvqWr64ISrm38xs7owSSexGN2Zr';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { bookingRef, checkoutId } = req.body;

    if (!bookingRef || !checkoutId) {
      return res.status(400).json({ error: 'Missing reference or checkout ID' });
    }

    let isPaid = false;

    if (checkoutId.startsWith('mock-')) {
      isPaid = true;
    } else {
      const response = await fetch(`https://api.sumup.com/v0.1/checkouts/${checkoutId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${SUMUP_API_KEY}` }
      });
      const data = await response.json();
      isPaid = data.status === 'PAID' || data.status === 'SUCCESSFUL';
    }

    if (isPaid) {
      // Update Firestore record
      const docRef = db.collection('bookings').doc(bookingRef);
      await docRef.update({ 
        status: 'confirmed',
        paidAt: new Date().toISOString()
      });
      
      return res.status(200).json({ success: true, status: 'confirmed' });
    } else {
      return res.status(400).json({ error: 'Payment not completed' });
    }

  } catch (err) {
    console.error('Confirmation Error:', err);
    return res.status(500).json({ error: 'Server error during confirmation' });
  }
};
