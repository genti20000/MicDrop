
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roomId = searchParams.get('roomId');
  const date = searchParams.get('date');

  if (!roomId || !date) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('bookings')
    .select('start_time, duration_hours')
    .eq('venue_id', roomId) // Note: Mapping logic might be needed if roomId != venue_id
    .eq('date', date)
    .neq('status', 'cancelled');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const busySlots = data.map(b => ({
    time: b.start_time,
    duration: b.duration_hours
  }));

  return NextResponse.json(busySlots);
}
