
'use client';

import React, { useState } from 'react';
import { MyBookings } from '@/components/MyBookings';
import { LoginForm, RegisterForm } from '@/components/Auth';
import { useAuth } from '@/contexts/AuthContext';

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (!user) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4 bg-black flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">My Bookings</h1>
            <p className="text-zinc-400">Sign in to manage your sessions.</p>
          </div>
          {authMode === 'login' ? (
            <LoginForm onSuccess={() => {}} onSwitch={() => setAuthMode('register')} />
          ) : (
            <RegisterForm onSuccess={() => {}} onSwitch={() => setAuthMode('login')} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 bg-black">
      <MyBookings onLoginRequest={() => {}} />
    </div>
  );
}
