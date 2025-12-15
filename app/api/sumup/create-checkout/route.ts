
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createSumUpCheckout } from '@/lib/sumup';
import { calculatePrice, generateBookingRef } from '@/lib/utils';
import { RoomType } from '@/types/index';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { venueId, roomType, date, time, durationHours, guestCount, name, email, phone, specialRequests } = body;

    // 1. Basic Validation
    if (!venueId || !roomType || !date || !time || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    // 2. Availability Check (Simple exact match prevention)
    // Note: A robust system would check date+time ranges overlap.
    const { data: conflict } = await supabaseAdmin
      .from('bookings')
      .select('id')
      .eq('venue_id', venueId)
      .eq('room_type', roomType)
      .eq('date', date)
      .eq('start_time', time)
      .eq('status', 'confirmed') // Only check confirmed bookings
      .maybeSingle();

    if (conflict) {
      return NextResponse.json({ error: 'Slot already booked' }, { status: 409 });
    }

    // 3. Price Calculation (Server-Side Authority)
    const amount = calculatePrice(roomType as RoomType, durationHours, date);
    const bookingRef = generateBookingRef();

    // 4. Create SumUp Checkout
    const checkout = await createSumUpCheckout(amount, 'GBP', bookingRef, email);

    // 5. Insert Booking (Pending)
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

    if (bookingError) throw new Error(bookingError.message);

    // 6. Insert Payment Record
    const { error: paymentError } = await supabaseAdmin
      .from('payments')
      .insert({
        booking_id: booking.id,
        sumup_checkout_id: checkout.id,
        amount_gbp: amount,
        status: 'created'
      });
    
    if (paymentError) throw new Error(paymentError.message);

    return NextResponse.json({ 
      bookingRef, 
      checkoutId: checkout.id, 
      amount 
    });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Server error' }, { status: 500 });
  }
}