
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getSumUpCheckoutStatus } from '@/lib/sumup';

export async function POST(req: Request) {
  try {
    const { bookingRef, checkoutId } = await req.json();

    // 1. Verify with SumUp API
    const checkoutStatus = await getSumUpCheckoutStatus(checkoutId);

    // 2. Check if paid
    if (checkoutStatus.status === 'PAID' || checkoutStatus.status === 'SUCCESSFUL') { // SumUp status codes vary slightly by API version, PAID/SUCCESSFUL common
      
      // 3. Update Payment
      await supabaseAdmin
        .from('payments')
        .update({ status: 'paid' })
        .eq('sumup_checkout_id', checkoutId);

      // 4. Update Booking
      await supabaseAdmin
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('booking_ref', bookingRef);

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Payment not paid', status: checkoutStatus.status }, { status: 400 });
    }

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
