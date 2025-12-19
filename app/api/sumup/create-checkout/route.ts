
import { NextResponse } from 'next/server';
// Switch to relative paths to ensure modules resolve correctly in all environments
import { supabaseAdmin, SUPABASE_URL } from '../../../../lib/supabase';
import { createSumUpCheckout } from '../../../../lib/sumup';
import { calculatePrice, generateBookingRef } from '../../../../lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  console.log('API Hit: /api/sumup/create-checkout');
  try {
    const body = await req.json();
    const { venueId, roomType, date, time, durationHours, guestCount, name, email, phone, specialRequests } = body;

    // 1. Basic Validation
    if (!venueId || !roomType || !date || !time || !email) {
      console.warn('Missing fields in checkout request');
      return NextResponse.json({ error: 'Missing fields: date, time, or email' }, { status: 400 });
    }

    const isDbConfigured = !SUPABASE_URL.includes('placeholder');

    // 2. Availability Check
    if (isDbConfigured) {
      try {
        const { data: conflict } = await supabaseAdmin
          .from('bookings')
          .select('id')
          .eq('venue_id', venueId)
          .eq('room_type', roomType)
          .eq('date', date)
          .eq('start_time', time)
          .eq('status', 'confirmed')
          .maybeSingle();

        if (conflict) {
          return NextResponse.json({ error: 'Slot already booked' }, { status: 409 });
        }
      } catch (dbErr) {
        console.warn('DB Availability check failed, proceeding anyway:', dbErr);
      }
    }

    // 3. Price Calculation
    const amount = calculatePrice(guestCount || 8, durationHours || 2);
    const bookingRef = generateBookingRef();

    // 4. Create SumUp Checkout
    console.log(`Creating SumUp checkout for ${email} (${amount} GBP)`);
    const checkout = await createSumUpCheckout(amount, 'GBP', bookingRef, email);

    // 5. Insert Booking
    if (isDbConfigured) {
        try {
            const { data: booking, error: bookingError } = await supabaseAdmin
            .from('bookings')
            .insert({
                booking_ref: bookingRef,
                venue_id: venueId,
                room_type: roomType,
                date,
                start_time: time,
                duration_hours: durationHours,
                guest_count: guestCount,
                name, email, phone, special_requests: specialRequests,
                total_gbp: amount,
                status: 'pending'
            })
            .select('id')
            .single();

            if (!bookingError && booking) {
                await supabaseAdmin
                .from('payments')
                .insert({
                    booking_id: booking.id,
                    sumup_checkout_id: checkout.id,
                    amount_gbp: amount,
                    status: 'created'
                });
            }
        } catch (dbErr) {
            console.error('DB Insert failed:', dbErr);
        }
    }

    return NextResponse.json({ 
      bookingRef, 
      checkoutId: checkout.id, 
      amount 
    });

  } catch (e: any) {
    console.error('Create Checkout Fatal Error:', e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
