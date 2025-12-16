
const BASE_URL = 'https://api.sumup.com';

// Check for environment variables, use fallback if missing
const SUMUP_API_KEY = process.env.SUMUP_API_KEY || 'sup_pk_jgRGG5OvqWr64ISrm38xs7owSSexGN2Zr';
const SUMUP_MERCHANT_EMAIL = process.env.SUMUP_MERCHANT_EMAIL || 'genti28@gmail.com';

const HAS_API_KEY = !!SUMUP_API_KEY;
const HAS_OAUTH = !!(process.env.SUMUP_CLIENT_ID && process.env.SUMUP_CLIENT_SECRET);
const IS_CONFIGURED = HAS_API_KEY || HAS_OAUTH;

async function getAuthHeader() {
  if (SUMUP_API_KEY) {
    return `Bearer ${SUMUP_API_KEY}`;
  }
  return `Bearer ${await getSumUpToken()}`;
}

export async function getSumUpToken() {
  if (!process.env.SUMUP_CLIENT_ID || !process.env.SUMUP_CLIENT_SECRET) {
    throw new Error("Missing SumUp OAuth Credentials");
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.SUMUP_CLIENT_ID);
  params.append('client_secret', process.env.SUMUP_CLIENT_SECRET);

  const res = await fetch(`${BASE_URL}/token`, {
    method: 'POST',
    body: params,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('SumUp Token Error:', err);
    throw new Error('Failed to obtain SumUp token');
  }

  const data = await res.json();
  return data.access_token;
}

export async function createSumUpCheckout(amount: number, currency: string, bookingRef: string, email: string) {
  // --- MOCK MODE FALLBACK ---
  // If no credentials are setup (and no fallback), return a mock checkout ID
  if (!IS_CONFIGURED) {
    console.warn("⚠️ SumUp credentials missing. Returning MOCK checkout ID.");
    return { id: `mock-checkout-${Date.now()}` };
  }
  // --------------------------

  const authHeader = await getAuthHeader();

  const body = {
    checkout_reference: bookingRef,
    amount,
    currency,
    pay_to_email: SUMUP_MERCHANT_EMAIL,
    description: `Booking ${bookingRef}`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/confirmation?ref=${bookingRef}`,
  };

  const res = await fetch(`${BASE_URL}/v0.1/checkouts`, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('SumUp Create Checkout Error:', err);
    throw new Error('Failed to create payment checkout');
  }

  return res.json();
}

export async function getSumUpCheckoutStatus(checkoutId: string) {
  // Handle Mock ID
  if (checkoutId.startsWith('mock-')) {
    return { status: 'PAID' };
  }

  const authHeader = await getAuthHeader();

  const res = await fetch(`${BASE_URL}/v0.1/checkouts/${checkoutId}`, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch checkout status');
  return res.json();
}
