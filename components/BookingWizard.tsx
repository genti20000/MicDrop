import React, { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { DURATIONS, TIMES, API_URL } from '../constants';
import { StepIndicator } from './StepIndicator';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PaymentForm } from './PaymentForm';
import { calculatePrice, formatCurrency } from '../services/pricing';
import { BookingState } from '../types';

const INITIAL_STATE: BookingState = {
  step: 1,
  selectedRoomId: 'soho',
  date: new Date().toISOString().split('T')[0],
  time: '20:00',
  duration: 2,
  guests: 8,
  customer: { name: '', email: '', phone: '' }
};

export const BookingWizard: React.FC = () => {
  const [state, setState] = useState<BookingState>(INITIAL_STATE);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmedRef, setConfirmedRef] = useState<string | null>(null);

  const pricing = calculatePrice(state.guests, state.duration);

  const handlePaymentSuccess = async (transactionId: string, bookingRef: string) => {
    setIsConfirming(true);
    try {
      const response = await fetch(`${API_URL}?action=confirm_booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingRef, checkoutId: transactionId })
      });
      if (response.ok) {
        setConfirmedRef(bookingRef);
        setState(p => ({ ...p, step: 4 }));
      }
    } catch (e) {
      alert("Verification failed. Please contact support.");
    } finally {
      setIsConfirming(false);
    }
  };

  if (state.step === 4) {
    return (
      <div className="text-center py-20 animate-in zoom-in-95">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500">
          <CheckCircle size={40} />
        </div>
        <h2 className="text-4xl font-black uppercase mb-2 text-white">Confirmed!</h2>
        <p className="text-zinc-500 mb-8">Ref: <span className="text-[#FFD700] font-mono">{confirmedRef}</span></p>
        <Button onClick={() => window.location.hash = ''}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <StepIndicator currentStep={state.step} />
      
      {state.step === 1 && (
        <div className="space-y-6 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
          <Input label="Date" type="date" value={state.date} onChange={e => setState(p => ({ ...p, date: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Time</label>
              <select className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white" value={state.time} onChange={e => setState(p => ({ ...p, time: e.target.value }))}>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-zinc-500">Duration</label>
              <select className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white" value={state.duration} onChange={e => setState(p => ({ ...p, duration: Number(e.target.value) }))}>
                {DURATIONS.map(d => <option key={d} value={d}>{d} Hours</option>)}
              </select>
            </div>
          </div>
          <Input label="Guests" type="number" min={8} value={state.guests} onChange={e => setState(p => ({ ...p, guests: Number(e.target.value) }))} />
          <div className="pt-4 flex justify-between items-center border-t border-zinc-800">
            <span className="text-zinc-400">Total</span>
            <span className="text-2xl font-black text-[#FFD700]">{formatCurrency(pricing.total)}</span>
          </div>
          <Button fullWidth onClick={() => setState(p => ({ ...p, step: 2 }))}>Continue</Button>
        </div>
      )}

      {state.step === 2 && (
        <div className="space-y-4 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
          <Input label="Name" value={state.customer.name} onChange={e => setState(p => ({ ...p, customer: { ...p.customer, name: e.target.value }}))} />
          <Input label="Email" type="email" value={state.customer.email} onChange={e => setState(p => ({ ...p, customer: { ...p.customer, email: e.target.value }}))} />
          <Input label="Phone" value={state.customer.phone} onChange={e => setState(p => ({ ...p, customer: { ...p.customer, phone: e.target.value }}))} />
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setState(p => ({ ...p, step: 1 }))}>Back</Button>
            <Button className="flex-1" onClick={() => setState(p => ({ ...p, step: 3 }))} disabled={!state.customer.name || !state.customer.email}>Next</Button>
          </div>
        </div>
      )}

      {state.step === 3 && (
        <div className="bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
          {isConfirming ? (
            <div className="text-center py-10"><Loader2 className="animate-spin mx-auto mb-4 text-[#FFD700]" /><p className="text-white">Verifying payment with gateway...</p></div>
          ) : (
            <PaymentForm 
              amount={pricing.total} 
              onBack={() => setState(p => ({ ...p, step: 2 }))} 
              onSuccess={handlePaymentSuccess} 
              metadata={{ ...state.customer, date: state.date, time: state.time, duration: state.duration, guests: state.guests }} 
            />
          )}
        </div>
      )}
    </div>
  );
};