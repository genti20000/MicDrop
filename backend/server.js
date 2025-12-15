/**
 * BACKEND STUB - RUN SEPARATELY
 * 
 * To run this:
 * 1. Initialize a new npm project in a 'backend' folder
 * 2. npm install express cors stripe dotenv
 * 3. node server.js
 * 
 * NOTE: You must provide your own STRIPE_SECRET_KEY in a .env file
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(cors({ origin: 'http://localhost:5173' })); // Allow Vite frontend
app.use(express.json());

app.post('/api/create-payment-intent', async (req, res) => {
  const { amount, currency = 'gbp' } = req.body;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
