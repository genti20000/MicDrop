
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Database } from '@/types/supabase'; // Assuming generic or any
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
  
  // 1. Check Auth & Admin Role
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login'); // You'd need a generic login page or use Supabase UI

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', session.user.id)
    .single();

  if (!adminUser) return <div className="p-8 text-red-500">Access Denied. You are not an admin.</div>;

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
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <div className="text-sm text-slate-400">User: {session.user.email}</div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-slate-400 text-sm font-medium">Total Revenue (Recent)</h3>
          <p className="text-3xl font-bold text-green-400">£{totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-slate-400 text-sm font-medium">Confirmed Bookings</h3>
          <p className="text-3xl font-bold text-cyan-400">{pendingCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <h3 className="text-slate-400 text-sm font-medium">Total Records</h3>
          <p className="text-3xl font-bold text-white">{bookings?.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Ref</th>
                <th className="px-6 py-4">Venue</th>
                <th className="px-6 py-4">Date/Time</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {bookings?.map((b: any) => (
                <tr key={b.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 font-mono text-cyan-500">{b.booking_ref}</td>
                  <td className="px-6 py-4">{(b.venues as any)?.name}</td>
                  <td className="px-6 py-4">
                    <div>{b.date}</div>
                    <div className="text-xs">{b.start_time} ({b.duration_hours}h)</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-white">{b.name}</div>
                    <div className="text-xs">{b.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded text-xs font-bold",
                      b.status === 'confirmed' ? "bg-green-900 text-green-400" : 
                      b.status === 'cancelled' ? "bg-red-900 text-red-400" : 
                      "bg-yellow-900 text-yellow-400"
                    )}>
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">£{b.total_gbp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
