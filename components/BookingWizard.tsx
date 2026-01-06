
import React, { useState } from 'react';
import { CheckCircle, Loader2, Calendar as CalendarIcon, Users, Clock, ArrowRight, ChevronDown } from 'lucide-react';
import { DURATIONS, TIMES, API_URL } from '../constants';
import { StepIndicator } from './StepIndicator';
import { Button } from './ui/Button';
import { PaymentForm } from './PaymentForm';
import { calculatePrice, formatCurrency } from '../services/pricing';
import { BookingState, ConfirmedBooking } from '../types';
import { saveBookingLocally } from '../services/storage';

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

  const pricing = calculatePrice(state.guests, state.duration, state.date);

  const handlePaymentSuccess = async (transactionId: string, bookingRef: string) => {
    setIsConfirming(true);
    try {
      await fetch(`${API_URL}?action=confirm_booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingRef, checkoutId: transactionId })
      });

      const newBooking: ConfirmedBooking = {
        id: bookingRef,
        roomId: state.selectedRoomId || 'soho',
        roomName: 'Soho Suite',
        date: state.date,
        time: state.time,
        duration: state.duration,
        totalPrice: pricing.total,
        customer: state.customer,
        paymentIntentId: transactionId,
        status: 'confirmed',
        timestamp: Date.now()
      };
      
      await saveBookingLocally(newBooking);
      setConfirmedRef(bookingRef);
      setState(p => ({ ...p, step: 4 }));
    } catch (e) {
      console.error(e);
      alert("Verification failed. However, your session was saved locally.");
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
        <h2 className="text-4xl font-black uppercase mb-2 text-white tracking-tighter">Confirmed!</h2>
        <p className="text-zinc-500 mb-8 font-medium">Get ready to take the stage.</p>
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 max-w-sm mx-auto mb-8">
            <p className="text-xs text-zinc-500 uppercase font-black tracking-widest mb-1">Booking Ref</p>
            <p className="text-[#FFD700] font-mono text-xl font-bold">{confirmedRef}</p>
        </div>
        <Button onClick={() => window.location.hash = ''}>Return Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <StepIndicator currentStep={state.step} />
      
      {state.step === 1 && (
        <div className="space-y-6 bg-zinc-900/40 backdrop-blur-sm p-8 rounded-3xl border border-zinc-800 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Select Your Session</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Soho Suite • London</p>
          </div>

          <div className="space-y-6">
            {/* Date Picker */}
            <div className="relative group">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#FFD700] mb-2 ml-1">Session Date</label>
              <div className="relative">
                <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#FFD700] transition-colors pointer-events-none z-10" size={18} />
                <input 
                  type="date" 
                  min={new Date().toISOString().split('T')[0]}
                  value={state.date} 
                  onChange={e => setState(p => ({ ...p, date: e.target.value }))}
                  className="w-full bg-black border border-zinc-800 group-hover:border-zinc-700 focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] rounded-xl py-4 pl-12 pr-4 text-white outline-none transition-all font-bold text-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Time and Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#FFD700] mb-2 ml-1">Start Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#FFD700] transition-colors pointer-events-none z-10" size={18} />
                  <select 
                    className="w-full bg-black border border-zinc-800 focus:border-[#FFD700] rounded-xl py-4 pl-12 pr-10 text-white outline-none appearance-none font-bold text-lg cursor-pointer" 
                    value={state.time} 
                    onChange={e => setState(p => ({ ...p, time: e.target.value }))}
                  >
                    {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 pointer-events-none" size={16} />
                </div>
              </div>
              <div className="relative group">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#FFD700] mb-2 ml-1">Duration</label>
                <div className="relative">
                  <select 
                    className="w-full bg-black border border-zinc-800 focus:border-[#FFD700] rounded-xl py-4 px-4 text-white outline-none appearance-none font-bold text-lg cursor-pointer" 
                    value={state.duration} 
                    onChange={e => setState(p => ({ ...p, duration: Number(e.target.value) }))}
                  >
                    {DURATIONS.map(d => <option key={d} value={d}>{d} Hours</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 pointer-events-none" size={16} />
                </div>
              </div>
            </div>

            {/* Guest Dropdown */}
            <div className="relative group">
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#FFD700] mb-2 ml-1">Group Size</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-[#FFD700] transition-colors pointer-events-none z-10" size={18} />
                <select 
                  className="w-full bg-black border border-zinc-800 focus:border-[#FFD700] rounded-xl py-4 pl-12 pr-10 text-white outline-none appearance-none font-bold text-lg cursor-pointer" 
                  value={state.guests} 
                  onChange={e => setState(p => ({ ...p, guests: Number(e.target.value) }))}
                >
                  {Array.from({ length: 93 }, (_, i) => i + 8).map(num => (
                    <option key={num} value={num}>{num} People</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 pointer-events-none" size={16} />
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="pt-6 mt-6 border-t border-zinc-800 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold uppercase text-zinc-500 tracking-wider">
              <span>Base Tier (2hrs)</span>
              <span className="text-zinc-300">{formatCurrency(pricing.basePrice)}</span>
            </div>
            {pricing.discountAmount > 0 && (
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                <span className="text-green-500">Midweek Discount (25% off)</span>
                <span className="text-green-500">-{formatCurrency(pricing.discountAmount)}</span>
              </div>
            )}
            {pricing.extensionPrice > 0 && (
              <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                <span className="text-[#FFD700]">Time Extension</span>
                <span className="text-[#FFD700]">+{formatCurrency(pricing.extensionPrice)}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-3 mt-1 border-t border-zinc-800/50">
              <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Total Amount</span>
              <span className="text-3xl font-black text-[#FFD700] drop-shadow-[0_0_15px_rgba(255,215,0,0.3)]">{formatCurrency(pricing.total)}</span>
            </div>
          </div>

          <Button fullWidth onClick={() => setState(p => ({ ...p, step: 2 }))} className="mt-4 py-5 text-lg group">
            Continue to Details <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <p className="text-center text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
            "If you're not able to find space available online, please contact us via WhatsApp."
          </p>
        </div>
      )}

      {state.step === 2 && (
        <div className="space-y-6 bg-zinc-900/40 backdrop-blur-sm p-8 rounded-3xl border border-zinc-800 shadow-2xl animate-in fade-in slide-in-from-right-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Your Details</h2>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">Authorized Contact Information</p>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
              <input 
                className="w-full bg-black border border-zinc-800 focus:border-[#FFD700] rounded-xl px-5 py-4 text-white outline-none transition-all font-medium"
                value={state.customer.name} 
                onChange={e => setState(p => ({ ...p, customer: { ...p.customer, name: e.target.value }}))} 
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Email Address</label>
              <input 
                type="email"
                className="w-full bg-black border border-zinc-800 focus:border-[#FFD700] rounded-xl px-5 py-4 text-white outline-none transition-all font-medium"
                value={state.customer.email} 
                onChange={e => setState(p => ({ ...p, customer: { ...p.customer, email: e.target.value }}))} 
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Phone Number</label>
              <input 
                className="w-full bg-black border border-zinc-800 focus:border-[#FFD700] rounded-xl px-5 py-4 text-white outline-none transition-all font-medium"
                value={state.customer.phone} 
                onChange={e => setState(p => ({ ...p, customer: { ...p.customer, phone: e.target.value }}))} 
                placeholder="+44 000 000 0000"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button variant="outline" className="flex-1 border-zinc-800 text-zinc-400" onClick={() => setState(p => ({ ...p, step: 1 }))}>Back</Button>
            <Button className="flex-[2] py-4" onClick={() => setState(p => ({ ...p, step: 3 }))} disabled={!state.customer.name || !state.customer.email}>
              Review & Pay
            </Button>
          </div>
        </div>
      )}

      {state.step === 3 && (
        <div className="bg-zinc-900/40 backdrop-blur-sm p-8 rounded-3xl border border-zinc-800 shadow-2xl animate-in fade-in slide-in-from-right-4">
          {isConfirming ? (
            <div className="text-center py-20">
                <Loader2 className="animate-spin mx-auto mb-6 text-[#FFD700]" size={40} />
                <h3 className="text-xl font-black uppercase text-white tracking-tighter">Confirming...</h3>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2">Finalizing your private session</p>
            </div>
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
