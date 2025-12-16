
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Authenticate with Supabase
      const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!user) throw new Error('Login failed');

      // 2. Verify Admin Status (Client-side check before redirect)
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminUser) {
        await supabase.auth.signOut();
        throw new Error('Access denied: You do not have administrator privileges.');
      }

      // 3. Success
      router.push('/admin');
      router.refresh();
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="bg-black border border-neutral-800 w-full max-w-md p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#FFD700]"></div>
        
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4 text-[#FFD700]">
                <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-black uppercase text-white tracking-tight">Admin Portal</h1>
            <p className="text-neutral-500 text-sm mt-1">Authorized Personnel Only</p>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-sm flex items-start">
                <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
            </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider mb-1.5">Email Address</label>
            <div className="relative">
                <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all pl-10 font-medium"
                    placeholder="admin@londonkaraoke.club"
                />
                <div className="absolute left-3 top-3.5 text-neutral-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </div>
            </div>
          </div>

          <div>
            <label className="block text-neutral-400 text-xs font-bold uppercase tracking-wider mb-1.5">Password</label>
             <div className="relative">
                <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all pl-10 font-medium"
                    placeholder="••••••••"
                />
                 <div className="absolute left-3 top-3.5 text-neutral-600">
                    <Lock size={18} />
                </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#FFD700] hover:bg-yellow-400 text-black font-black uppercase tracking-wider py-3 rounded-lg transition-all shadow-lg shadow-yellow-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Authenticate'}
          </button>
        </form>

        <div className="mt-6 text-center">
            <Link href="/" className="text-neutral-500 hover:text-white text-sm transition-colors">
                ← Return to Public Site
            </Link>
        </div>
      </div>
    </div>
  );
}
