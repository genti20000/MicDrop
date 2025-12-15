
import { supabaseAdmin } from '@/lib/supabase';
import { Check } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function Confirmation({ searchParams }: { searchParams: { ref: string } }) {
  const { ref } = searchParams;

  const { data: booking } = await supabaseAdmin
    .from('bookings')
    .select('*, venues(name)')
    .eq('booking_ref', ref)
    .single();

  if (!booking) return notFound();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
      <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)]">
        <Check size={40} strokeWidth={4} />
      </div>
      <h1 className="text-4xl font-bold text-white mb-2">Booking Confirmed!</h1>
      <p className="text-slate-400 mb-8">Get ready to rock the mic.</p>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-sm w-full text-left space-y-4">
        <div className="flex justify-between border-b border-slate-800 pb-2">
          <span className="text-slate-500">Ref</span>
          <span className="font-mono text-cyan-400">{booking.booking_ref}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Venue</span>
          <span>{(booking.venues as any)?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Date</span>
          <span>{booking.date}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Time</span>
          <span>{booking.start_time}</span>
        </div>
        <div className="flex justify-between font-bold text-fuchsia-400 pt-2 border-t border-slate-800">
          <span>Paid</span>
          <span>£{booking.total_gbp}</span>
        </div>
      </div>

      <div className="mt-8">
        <Link href="/" className="text-slate-400 hover:text-white underline underline-offset-4">
          Return Home
        </Link>
      </div>
    </div>
  );
}
