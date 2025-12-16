
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Database } from '@/types/supabase';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';

export default async function AdminDashboard() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored
          }
        },
      },
    }
  );
  
  // 1. Check Auth & Admin Role
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/admin/login'); 

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', session.user.id)
    .single();

  if (!adminUser) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-red-500 bg-neutral-950">
      <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
      <p className="text-neutral-400 mb-4">Your account does not have administrator privileges.</p>
      <Link href="/" className="text-[#FFD700] hover:underline">Return Home</Link>
    </div>
  );

  // 2. Fetch Data (Server Side)
  const { data: bookings } = await supabase
    .from('bookings')
    .select('*, venues(name), payments(status)')
    .order('created_at', { ascending: false })
    .limit(50);

  // Stats
  const totalRevenue = bookings?.reduce((acc: any, b: any) => b.status === 'confirmed' ? acc + b.total_gbp : acc, 0) || 0;
  const pendingCount = bookings?.filter((b: any) => b.status === 'confirmed').length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-neutral-950">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Dashboard</h1>
        <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400 bg-neutral-900 px-3 py-1 rounded-full border border-neutral-800 font-mono">
                {session.user.email}
            </div>
            <Link href="/" className="text-sm text-[#FFD700] hover:text-yellow-400 font-bold">Exit</Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl relative overflow-hidden group hover:border-[#FFD700]/50 transition">
          <h3 className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Total Revenue</h3>
          <p className="text-3xl font-black text-white mt-2">£{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl relative overflow-hidden group hover:border-[#FFD700]/50 transition">
          <h3 className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Confirmed Bookings</h3>
          <p className="text-3xl font-black text-[#FFD700] mt-2">{pendingCount}</p>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl relative overflow-hidden group hover:border-[#FFD700]/50 transition">
          <h3 className="text-neutral-500 text-xs font-bold uppercase tracking-widest">Total Records</h3>
          <p className="text-3xl font-black text-white mt-2">{bookings?.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="bg-black text-neutral-200 uppercase font-bold text-xs tracking-wider border-b border-neutral-800">
              <tr>
                <th className="px-6 py-4">Ref</th>
                <th className="px-6 py-4">Date/Time</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800">
              {bookings?.map((b: any) => (
                <tr key={b.id} className="hover:bg-neutral-800/50 transition">
                  <td className="px-6 py-4 font-mono text-[#FFD700] font-medium">{b.booking_ref}</td>
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{b.date}</div>
                    <div className="text-xs text-neutral-500">{b.start_time} ({b.duration_hours}h)</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white font-medium">{b.name}</div>
                    <div className="text-xs text-neutral-500">{b.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-bold border uppercase tracking-wide",
                      b.status === 'confirmed' ? "bg-green-900/30 text-green-400 border-green-900" : 
                      b.status === 'cancelled' ? "bg-red-900/30 text-red-400 border-red-900" : 
                      "bg-yellow-900/30 text-yellow-400 border-yellow-900"
                    )}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-white font-mono">£{b.total_gbp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
