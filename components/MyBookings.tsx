import React, { useState, useEffect } from 'react';
import { getBookings, deleteBooking } from '../services/storage';
import { ConfirmedBooking } from '../types';
import { Trash2, Calendar, Clock, Music, LogIn } from 'lucide-react';
import { formatCurrency } from '../services/pricing';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/Button';

interface MyBookingsProps {
  onLoginRequest: () => void;
}

export const MyBookings: React.FC<MyBookingsProps> = ({ onLoginRequest }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<ConfirmedBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const data = await getBookings();
      setBookings(data);
    } catch (error) {
      console.error("Error loading bookings", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBookings();
    else setLoading(false);
  }, [user]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to cancel this booking?')) {
      try {
        await deleteBooking(id);
        fetchBookings();
      } catch (error) {
        alert("Failed to cancel booking");
      }
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20 px-6">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 text-neon-purple">
          <LogIn size={32} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Login Required</h3>
        <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Please sign in to view and manage your scheduled sessions.</p>
        <Button onClick={onLoginRequest}>Sign In</Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-purple"></div>
      </div>
    );
  }

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
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">My Sessions</h2>
        <span className="text-sm text-zinc-500">Welcome, {user.user_metadata?.name || user.email}</span>
      </div>
      
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