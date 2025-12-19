
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/constants';
import { cn } from '@/lib/utils';
import { Loader2, TrendingUp, Users, Calendar, LogOut, ExternalLink } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, logout, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        router.push('/admin/login');
      } else {
        fetchAdminData();
      }
    }
  }, [user, authLoading]);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('lkc_token');
      const res = await fetch(`${API_URL}/admin/bookings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch admin data');
      const data = await res.json();
      setBookings(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#FFD700]" size={40} />
      </div>
    );
  }

  const totalRevenue = bookings.reduce((acc, b) => b.status === 'confirmed' ? acc + parseFloat(b.amount) : acc, 0);
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter text-[#FFD700]">Admin Dashboard</h1>
            <p className="text-neutral-500">Managing MicDrop operations in London.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-bold text-white uppercase tracking-wider">{user?.name}</p>
              <p className="text-xs text-neutral-500">{user?.email}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2.5 bg-neutral-900 border border-neutral-800 rounded-lg hover:border-red-500/50 hover:text-red-400 transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                <TrendingUp size={24} />
              </div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Revenue</span>
            </div>
            <p className="text-3xl font-black">£{totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Total processed</p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                <Calendar size={24} />
              </div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Bookings</span>
            </div>
            <p className="text-3xl font-black">{confirmedCount}</p>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Confirmed sessions</p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl lg:col-span-1 sm:col-span-2">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                <Users size={24} />
              </div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Conversion</span>
            </div>
            <p className="text-3xl font-black">
              {bookings.length > 0 ? ((confirmedCount / bookings.length) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Checkout success rate</p>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
            <h2 className="text-lg font-bold uppercase tracking-wider">Recent Activity</h2>
            <Link href="/" target="_blank" className="text-xs text-[#FFD700] hover:underline flex items-center gap-1">
              View Site <ExternalLink size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-black/50 text-neutral-500 uppercase text-[10px] font-black tracking-widest">
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4">Session</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {bookings.map((booking) => (
                  <tr key={booking.booking_ref} className="hover:bg-neutral-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <span className="font-mono text-[#FFD700] font-bold">{booking.booking_ref}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">{booking.customer_name}</span>
                        <span className="text-xs text-neutral-500">{booking.customer_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-white">{booking.date}</span>
                        <span className="text-xs text-neutral-500">{booking.time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-neutral-400">{booking.duration}h / {booking.guests} Guests</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        booking.status === 'confirmed' 
                          ? "bg-green-500/10 text-green-500 border-green-500/20" 
                          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                      )}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-white">£{parseFloat(booking.amount).toFixed(2)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {bookings.length === 0 && (
            <div className="p-12 text-center text-neutral-500">
              No records found in database.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
