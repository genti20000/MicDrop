
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldCheck, Lock, AlertCircle, ArrowLeft, Info } from 'lucide-react';

export default function AdminLogin() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      
      const savedUser = JSON.parse(localStorage.getItem('lkc_user') || '{}');
      
      if (savedUser.role !== 'admin') {
        localStorage.removeItem('lkc_token');
        localStorage.removeItem('lkc_user');
        throw new Error('Access denied: You do not have administrator privileges.');
      }

      // Using hash for SPA navigation
      window.location.hash = 'admin';
      
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
        <div className="absolute top-0 left-0 w-full h-1 bg-[#FFD700]"></div>
        
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center mb-4 text-[#FFD700]">
                <ShieldCheck size={32} />
            </div>
            <h1 className="text-2xl font-black uppercase text-white tracking-tight">Admin Portal</h1>
            <p className="text-neutral-500 text-sm mt-1">Authorized Personnel Only</p>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg text-red-200 text-sm flex items-start animate-in fade-in slide-in-from-top-1">
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
            className="w-full bg-[#FFD700] hover:bg-yellow-400 text-black font-black uppercase tracking-wider py-3 rounded-lg transition-all shadow-lg shadow-yellow-900/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center font-bold"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Authenticate'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-neutral-800">
            <div className="bg-neutral-900/50 p-3 rounded-lg flex items-start gap-3">
                <Info size={16} className="text-[#FFD700] mt-0.5 flex-shrink-0" />
                <div className="text-[11px] text-neutral-400 leading-relaxed">
                    <p className="font-bold text-neutral-300 uppercase mb-1">Dev Credentials:</p>
                    <p>Email: <span className="text-white font-mono">admin@londonkaraoke.club</span></p>
                    <p>Pass: <span className="text-white font-mono">admin123</span></p>
                </div>
            </div>
        </div>

        <div className="mt-6 text-center">
            <button onClick={() => window.location.hash = ''} className="text-neutral-500 hover:text-white text-sm transition-colors inline-flex items-center gap-2">
                <ArrowLeft size={14} /> Return to Public Site
            </button>
        </div>
      </div>
    </div>
  );
}
