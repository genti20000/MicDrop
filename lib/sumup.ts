
const SUMUP_ENV = process.env.SUMUP_ENV || 'sandbox';
const BASE_URL = SUMUP_ENV === 'production' ? 'https://api.sumup.com' : 'https://api.sumup.com'; // V2 uses same endpoint, auth differs slightly usually, but for simple OAuth client creds:

// Note: SumUp Sandbox often uses specific test accounts, but the base URL structure is similar.
// For this implementation, we use standard endpoints.

export async function getSumUpToken() {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.SUMUP_CLIENT_ID!);
  params.append('client_secret', process.env.SUMUP_CLIENT_SECRET!);
  // Add scope if needed, e.g. 'payments'

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
  const token = await getSumUpToken();

  const body = {
    checkout_reference: bookingRef,
    amount,
    currency,
    pay_to_email: process.env.SUMUP_MERCHANT_CODE ? undefined : 'merchant@example.com', // In prod, merchant_code associates txn
    merchant_code: process.env.SUMUP_MERCHANT_CODE, 
    description: `MicDrop Booking ${bookingRef}`,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/confirmation?ref=${bookingRef}`,
  };

  const res = await fetch(`${BASE_URL}/v0.1/checkouts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
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
  const token = await getSumUpToken();

  const res = await fetch(`${BASE_URL}/v0.1/checkouts/${checkoutId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error('Failed to fetch checkout status');
  return res.json();
}
