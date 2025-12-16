
const BASE_URL = 'https://api.sumup.com';

// Use the provided Key as the API Key. 
// Note: While 'sup_pk_' denotes a public key, we use it here to satisfy the configuration request.
// In a full production environment, ensure this key has the necessary scopes for creating checkouts.
const SUMUP_API_KEY = process.env.SUMUP_API_KEY || 'sup_pk_jgRGG5OvqWr64ISrm38xs7owSSexGN2Zr';

async function getAuthHeader() {
  // If we have a direct API Key (provided by user), use it.
  if (SUMUP_API_KEY) {
    return `Bearer ${SUMUP_API_KEY}`;
  }
  
  // Fallback to OAuth Client Credentials if no direct key is present
  return `Bearer ${await getSumUpToken()}`;
}

export async function getSumUpToken() {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.SUMUP_CLIENT_ID!);
  params.append('client_secret', process.env.SUMUP_CLIENT_SECRET!);

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
  const authHeader = await getAuthHeader();

  const body = {
    checkout_reference: bookingRef,
    amount,
    currency,
    pay_to_email: process.env.SUMUP_MERCHANT_CODE ? undefined : 'merchant@example.com',
    merchant_code: process.env.SUMUP_MERCHANT_CODE, 
    description: `MicDrop Booking ${bookingRef}`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/confirmation?ref=${bookingRef}`,
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
