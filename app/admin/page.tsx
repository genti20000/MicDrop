'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/constants';
import { cn } from '@/lib/utils';
import { 
  Loader2, 
  TrendingUp, 
  Users, 
  Calendar, 
  LogOut, 
  ExternalLink, 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  X,
  Phone,
  Mail,
  User,
  Clock,
  CreditCard,
  MessageSquare
} from 'lucide-react';

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

export default function AdminDashboard() {
  const { user, logout, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'created_at', direction: 'desc' });
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user || user.role !== 'admin') {
        window.location.hash = 'admin/login';
      } else {
        fetchAdminData();
      }
    }
  }, [user, authLoading]);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('lkc_token');
      const res = await fetch(`${API_URL}?action=admin_bookings`, {
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
    window.location.hash = 'admin/login';
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredAndSortedBookings = useMemo(() => {
    let result = [...bookings];

    // Filter by Search
    if (searchTerm) {
      const lowSearch = searchTerm.toLowerCase();
      result = result.filter(b => 
        b.booking_ref.toLowerCase().includes(lowSearch) ||
        b.customer_name.toLowerCase().includes(lowSearch) ||
        b.customer_email.toLowerCase().includes(lowSearch)
      );
    }

    // Filter by Status
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [bookings, searchTerm, statusFilter, sortConfig]);

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
            <p className="text-neutral-500">Managing LKC London operations.</p>
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
          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
              <TrendingUp size={80} />
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                <TrendingUp size={24} />
              </div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Revenue</span>
            </div>
            <p className="text-3xl font-black">£{totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Total processed</p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
              <Calendar size={80} />
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-500">
                <Calendar size={24} />
              </div>
              <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Bookings</span>
            </div>
            <p className="text-3xl font-black">{confirmedCount}</p>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Confirmed sessions</p>
          </div>

          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group lg:col-span-1 sm:col-span-2">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
              <Users size={80} />
            </div>
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

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
            <input 
              type="text" 
              placeholder="Search by ref, name, or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-brand-yellow focus:ring-1 focus:ring-brand-yellow outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:border-brand-yellow outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Bookings Table */}
        <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative">
          <div className="p-6 border-b border-neutral-800 flex justify-between items-center">
            <h2 className="text-lg font-bold uppercase tracking-wider">Session Activity</h2>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span>Showing {filteredAndSortedBookings.length} results</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-black/50 text-neutral-500 uppercase text-[10px] font-black tracking-widest">
                  <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('booking_ref')}>
                    <div className="flex items-center gap-2">
                      Reference <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('customer_name')}>
                    <div className="flex items-center gap-2">
                      Customer <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-2">
                      Date & Time <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-6 py-4">Session</th>
                  <th className="px-6 py-4 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-2">
                      Status <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('amount')}>
                    <div className="flex items-center gap-2 justify-end">
                      Amount <ArrowUpDown size={12} />
                    </div>
                  </th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {filteredAndSortedBookings.map((booking) => (
                  <tr 
                    key={booking.booking_ref} 
                    className="hover:bg-neutral-800/30 transition-colors group cursor-pointer"
                    onClick={() => setSelectedBooking(booking)}
                  >
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
                          : booking.status === 'pending'
                          ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                          : "bg-red-500/10 text-red-500 border-red-500/20"
                      )}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-white">£{parseFloat(booking.amount).toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight size={18} className="text-neutral-700 group-hover:text-[#FFD700] transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredAndSortedBookings.length === 0 && (
            <div className="p-12 text-center text-neutral-500">
              No matching records found.
            </div>
          )}
        </div>
      </div>

      {/* Booking Detail Drawer */}
      {selectedBooking && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in"
            onClick={() => setSelectedBooking(null)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl z-[70] animate-in slide-in-from-right duration-300">
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-black/20">
                <div>
                  <h3 className="text-xs font-black text-[#FFD700] uppercase tracking-[0.2em] mb-1">Booking Details</h3>
                  <p className="text-xl font-mono font-bold text-white">{selectedBooking.booking_ref}</p>
                </div>
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 hover:bg-neutral-800 rounded-full transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Status Card */}
                <div className={cn(
                  "p-6 rounded-2xl border flex items-center justify-between",
                  selectedBooking.status === 'confirmed' 
                    ? "bg-green-500/5 border-green-500/20" 
                    : "bg-yellow-500/5 border-yellow-500/20"
                )}>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase text-neutral-500 tracking-widest">Current Status</p>
                    <p className={cn(
                      "text-xl font-black uppercase tracking-tighter",
                      selectedBooking.status === 'confirmed' ? "text-green-500" : "text-yellow-500"
                    )}>
                      {selectedBooking.status}
                    </p>
                  </div>
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    selectedBooking.status === 'confirmed' ? "bg-green-500 text-black" : "bg-yellow-500 text-black"
                  )}>
                    <CreditCard size={24} />
                  </div>
                </div>

                {/* Customer Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-[#FFD700]">
                    <User size={16} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Customer Information</h4>
                  </div>
                  <div className="bg-black/30 rounded-2xl p-5 space-y-4 border border-white/5">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-neutral-800 rounded-lg"><User size={14} /></div>
                      <div>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase">Full Name</p>
                        <p className="font-bold text-white">{selectedBooking.customer_name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-neutral-800 rounded-lg"><Mail size={14} /></div>
                      <div>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase">Email Address</p>
                        <p className="font-bold text-white">{selectedBooking.customer_email}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-neutral-800 rounded-lg"><Phone size={14} /></div>
                      <div>
                        <p className="text-[10px] text-neutral-500 font-bold uppercase">Phone Number</p>
                        <p className="font-bold text-white">{selectedBooking.customer_phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Session Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-[#FFD700]">
                    <Clock size={16} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Session Details</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/30 rounded-2xl p-5 border border-white/5">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Date</p>
                      <p className="font-black text-lg text-white">{selectedBooking.date}</p>
                    </div>
                    <div className="bg-black/30 rounded-2xl p-5 border border-white/5">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Time</p>
                      <p className="font-black text-lg text-white">{selectedBooking.time}</p>
                    </div>
                    <div className="bg-black/30 rounded-2xl p-5 border border-white/5">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Duration</p>
                      <p className="font-black text-lg text-white">{selectedBooking.duration} Hours</p>
                    </div>
                    <div className="bg-black/30 rounded-2xl p-5 border border-white/5">
                      <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Guests</p>
                      <p className="font-black text-lg text-white">{selectedBooking.guests} People</p>
                    </div>
                  </div>
                </section>

                {/* Financials Section */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-[#FFD700]">
                    <CreditCard size={16} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Financial Summary</h4>
                  </div>
                  <div className="bg-brand-yellow/5 rounded-2xl p-6 border border-brand-yellow/10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-bold text-neutral-400 uppercase">Total Amount</span>
                      <span className="text-3xl font-black text-[#FFD700]">£{parseFloat(selectedBooking.amount).toFixed(2)}</span>
                    </div>
                    <div className="pt-4 border-t border-white/5 space-y-2">
                       <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-neutral-600">
                          <span>Payment Method</span>
                          <span>SumUp Online</span>
                       </div>
                       <div className="flex justify-between text-[10px] uppercase font-bold tracking-wider text-neutral-600">
                          <span>Checkout ID</span>
                          <span className="font-mono">{selectedBooking.checkout_id || 'N/A'}</span>
                       </div>
                    </div>
                  </div>
                </section>

                {/* Special Requests */}
                {selectedBooking.special_requests && (
                  <section className="space-y-4 pb-8">
                    <div className="flex items-center gap-2 text-[#FFD700]">
                      <MessageSquare size={16} />
                      <h4 className="text-xs font-black uppercase tracking-widest">Notes / Requests</h4>
                    </div>
                    <div className="bg-black/30 rounded-2xl p-5 border border-white/5 italic text-sm text-neutral-400">
                      "{selectedBooking.special_requests}"
                    </div>
                  </section>
                )}
              </div>

              <div className="p-6 border-t border-neutral-800 bg-black/20">
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all"
                >
                  Close Panel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
