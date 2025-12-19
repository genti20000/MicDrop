
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CheckCircle, Calendar, User, AlertCircle, ChevronDown, MapPin, Loader2 } from 'lucide-react';

import { ROOMS, DURATIONS, TIMES, API_URL } from '../constants';
import { StepIndicator } from './StepIndicator';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PaymentForm } from './PaymentForm';
import { calculatePrice, formatCurrency } from '../services/pricing';
import { BookingState } from '../types';
import { useAuth } from '../contexts/AuthContext';

const INITIAL_STATE: BookingState = {
  step: 1,
  selectedRoomId: ROOMS[0].id,
  date: new Date().toISOString().split('T')[0],
  time: '20:00',
  duration: 2,
  guests: 8,
  customer: { name: '', email: '', phone: '', notes: '' }
};

export const BookingWizard: React.FC = () => {
  const { user } = useAuth();
  const [state, setState] = useState<BookingState>(INITIAL_STATE);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (user) {
      setState(prev => ({
        ...prev,
        customer: { ...prev.customer, name: user.user_metadata?.name || '', email: user.email || '' }
      }));
    }
  }, [user]);

  const pricing = calculatePrice(state.guests, state.duration);
  const nextStep = () => setState(prev => ({ ...prev, step: prev.step + 1 }));
  const prevStep = () => setState(prev => ({ ...prev, step: prev.step - 1 }));

  const handlePaymentSuccess = async (transactionId: string, bookingRef: string) => {
    setIsConfirming(true);
    try {
      // Confirm the booking in Google Cloud Firestore
      const response = await fetch(`${API_URL}/confirm-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingRef, checkoutId: transactionId })
      });

      if (!response.ok) throw new Error('Confirmation failed in Google Cloud');
      
      setConfirmedRef(bookingRef);
      nextStep();
    } catch (err) {
      alert("Error confirming booking. Please contact support.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (state.step === 4 && confirmedRef) {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="text-zinc-400 mb-8">Data safely stored in Google Cloud Firestore.</p>
        <div className="bg-zinc-900 p-6 rounded-xl max-w-sm mx-auto mb-8 border border-zinc-800 text-left">
           <div className="space-y-3 text-sm">
             <div className="flex justify-between"><span className="text-zinc-500">Booking Ref</span> <span className="font-mono text-[#FFD700]">{confirmedRef}</span></div>
             <div className="flex justify-between"><span className="text-zinc-500">Room</span> <span className="text-white">Soho Suite</span></div>
             <div className="flex justify-between"><span className="text-zinc-500">Total</span> <span className="text-white">{formatCurrency(pricing.total)}</span></div>
           </div>
        </div>
        <Button onClick={() => window.location.href = '/'}>Finish</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
      <StepIndicator currentStep={state.step} />
      
      {state.step === 1 && (
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8"><h2 className="text-3xl font-black uppercase text-white mb-2">Book Soho</h2></div>
          <div className="space-y-6 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 backdrop-blur-sm">
            <Input label="Date" type="date" value={state.date} onChange={(e) => setState(prev => ({ ...prev, date: e.target.value }))} />
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5">Start Time</label>
                 <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-[#FFD700]" value={state.time} onChange={(e) => setState(prev => ({ ...prev, time: e.target.value }))}>
                   {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5">Duration</label>
                 <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-[#FFD700]" value={state.duration} onChange={(e) => setState(prev => ({ ...prev, duration: Number(e.target.value) }))}>
                   {DURATIONS.map(d => <option key={d} value={d}>{d} Hours</option>)}
                 </select>
               </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5">Guests (8-100)</label>
              <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:border-[#FFD700]" value={state.guests} onChange={(e) => setState(prev => ({ ...prev, guests: Number(e.target.value) }))}>
                {Array.from({length: 93}, (_, i) => i + 8).map(n => <option key={n} value={n}>{n} People</option>)}
              </select>
            </div>
            <div className="mt-6 p-4 bg-black rounded-lg border border-zinc-800">
               <div className="flex justify-between font-bold text-lg text-white"><span>Total</span><span>{formatCurrency(pricing.total)}</span></div>
            </div>
          </div>
          <div className="flex justify-end mt-8"><Button onClick={nextStep}>Next: Details</Button></div>
        </div>
      )}

      {state.step === 2 && (
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-white">Your Details</h2>
          <div className="space-y-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
            <Input label="Name" value={state.customer.name} onChange={e => setState(p => ({ ...p, customer: { ...p.customer, name: e.target.value }}))} />
            <Input label="Email" value={state.customer.email} onChange={e => setState(p => ({ ...p, customer: { ...p.customer, email: e.target.value }}))} />
            <Input label="Phone" value={state.customer.phone} onChange={e => setState(p => ({ ...p, customer: { ...p.customer, phone: e.target.value }}))} />
          </div>
          <div className="flex gap-4 mt-8"><Button variant="secondary" onClick={prevStep}>Back</Button><Button className="flex-1" onClick={nextStep} disabled={!state.customer.name || !state.customer.email}>Next: Payment</Button></div>
        </div>
      )}

      {state.step === 3 && (
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8"><h2 className="text-2xl font-bold text-white">Secure Checkout</h2></div>
          {isConfirming ? (
            <div className="text-center py-12"><Loader2 className="animate-spin h-12 w-12 text-[#FFD700] mx-auto mb-4"/><p className="text-zinc-400">Updating Google Cloud Firestore...</p></div>
          ) : (
            <PaymentForm amount={pricing.total} onBack={prevStep} onSuccess={handlePaymentSuccess} metadata={{ ...state.customer, roomName: 'Soho Suite', date: state.date, time: state.time, duration: state.duration, guests: state.guests }} />
          )}
        </div>
      )}
    </div>
  );
};
