const stripeSdk = require('stripe');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const secretKey = process.env.STRIPE_SECRET_KEY;

const missingEnv = [];
if (!secretKey) missingEnv.push('STRIPE_SECRET_KEY');
if (!endpointSecret) missingEnv.push('STRIPE_WEBHOOK_SECRET');

const envError =
  missingEnv.length > 0
    ? `Missing environment variables: ${missingEnv.join(', ')}`
    : null;

const stripe = secretKey ? stripeSdk(secretKey) : null;

// Helper to read the raw body from the request for signature verification
async function getRawBody(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  if (envError) {
    console.error(`Webhook configuration error: ${envError}`);
    return res.status(500).json({ error: envError });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    console.error('Webhook error: missing stripe-signature header');
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`Webhook Signature Verification Failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      console.log('💰 Payment captured via Vercel function!');
      console.log(`PaymentIntent ID: ${paymentIntent.id}`);
      // TODO: Update your database here to mark the booking as confirmed
      break;
    }

    case 'payment_intent.payment_failed': {
      const failedIntent = event.data.object;
      console.log('❌ Payment failed.');
      console.log(`Error: ${failedIntent.last_payment_error?.message}`);
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};

// Disable Vercel's default body parsing so we can verify the signature
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
