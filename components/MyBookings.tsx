import React, { useState, useEffect } from 'react';
import { getBookings, deleteBooking } from '../services/storage';
import { ConfirmedBooking } from '../types';
import { Trash2, Calendar, Clock, Music } from 'lucide-react';
import { formatCurrency } from '../services/pricing';
import { format } from 'date-fns';
import { Button } from './ui/Button';

export const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<ConfirmedBooking[]>([]);

  useEffect(() => {
    setBookings(getBookings());
  }, []);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      deleteBooking(id);
      setBookings(getBookings());
    }
  };

  if (bookings.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-600">
          <Music size={32} />
        </div>
        <h3 className="text-xl font-bold text-zinc-300">No bookings found</h3>
        <p className="text-zinc-500 mt-2">You haven't booked any sessions yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-4">
      <h2 className="text-2xl font-bold mb-6">My Sessions</h2>
      {bookings.map((booking) => (
        <div key={booking.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-colors">
          <div className="flex justify-between items-start mb-4">
             <div>
               <h3 className="font-bold text-lg text-white">{booking.roomName}</h3>
               <p className="text-xs text-zinc-500 font-mono">ID: {booking.id}</p>
             </div>
             <div className="text-right">
                <div className="font-bold text-neon-cyan">{formatCurrency(booking.totalPrice)}</div>
                <div className="text-xs text-green-500 uppercase tracking-wider font-bold mt-1">Confirmed</div>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-zinc-300 mb-4">
            <div className="flex items-center">
              <Calendar size={14} className="mr-2 text-zinc-500" />
              {format(new Date(booking.date), 'EEE, d MMM')}
            </div>
            <div className="flex items-center">
              <Clock size={14} className="mr-2 text-zinc-500" />
              {booking.time} ({booking.duration}h)
            </div>
          </div>

          <div className="flex justify-end border-t border-zinc-800 pt-4">
            <button 
              onClick={() => handleDelete(booking.id)}
              className="text-red-500 hover:text-red-400 text-sm flex items-center transition-colors"
            >
              <Trash2 size={14} className="mr-1.5" /> Cancel Booking
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
