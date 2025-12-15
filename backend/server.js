/**
 * BACKEND STUB - RUN SEPARATELY
 * 
 * To run this:
 * 1. Initialize a new npm project in a 'backend' folder
 * 2. npm install express cors stripe dotenv
 * 3. node server.js
 * 
 * NOTE: You must provide your own STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET in a .env file
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();

app.use(cors({ origin: 'http://localhost:5173' })); // Allow Vite frontend

// --- STRIPE WEBHOOK HANDLER ---
// This must be defined BEFORE app.use(express.json()) because it needs the raw body
app.post('/webhook', express.raw({ type: 'application/json' }), async (request, response) => {
  const sig = request.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    // Verify the webhook signature to ensure it came from Stripe
    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Signature Verification Failed: ${err.message}`);
    return response.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('💰 Payment captured!');
      console.log(`PaymentIntent ID: ${paymentIntent.id}`);
      console.log(`Amount: ${paymentIntent.amount}`);
      
      // TODO: Update your database here to mark the booking as confirmed
      // e.g., await db.bookings.update({ status: 'confirmed' }, { where: { paymentIntentId: paymentIntent.id } });
      break;
      
    case 'payment_intent.payment_failed':
      const failedIntent = event.data.object;
      console.log('❌ Payment failed.');
      console.log(`Error: ${failedIntent.last_payment_error?.message}`);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});

// Parse JSON for standard API routes (must be after webhook route)
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