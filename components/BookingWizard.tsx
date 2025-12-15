import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { format } from 'date-fns';
import { CheckCircle, Calendar, User, AlertCircle } from 'lucide-react';

import { STRIPE_PUBLISHABLE_KEY, ROOMS, DURATIONS, TIMES } from '../constants';
import { RoomCard } from './RoomCard';
import { StepIndicator } from './StepIndicator';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PaymentForm } from './PaymentForm';
import { calculatePrice, formatCurrency } from '../services/pricing';
import { saveBooking, fetchAvailability, BusySlot } from '../services/storage';
import { BookingState } from '../types';
import { useAuth } from '../contexts/AuthContext';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const INITIAL_STATE: BookingState = {
  step: 1,
  selectedRoomId: null,
  date: new Date().toISOString().split('T')[0],
  time: '20:00',
  duration: 2,
  guests: 4,
  customer: {
    name: '',
    email: '',
    phone: '',
    notes: ''
  }
};

export const BookingWizard: React.FC = () => {
  const { user } = useAuth();
  const [state, setState] = useState<BookingState>(INITIAL_STATE);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [busySlots, setBusySlots] = useState<BusySlot[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);

  // Pre-fill user data when wizard mounts or user logs in
  useEffect(() => {
    if (user) {
      setState(prev => ({
        ...prev,
        customer: {
          ...prev.customer,
          name: user.name,
          email: user.email
        }
      }));
    }
  }, [user]);

  const selectedRoom = ROOMS.find(r => r.id === state.selectedRoomId);
  const pricing = selectedRoom 
    ? calculatePrice(selectedRoom, state.duration, state.date) 
    : null;

  const nextStep = () => setState(prev => ({ ...prev, step: prev.step + 1 }));
  const prevStep = () => setState(prev => ({ ...prev, step: prev.step - 1 }));

  useEffect(() => {
    if (state.selectedRoomId && state.step === 2) {
      setCheckingAvailability(true);
      fetchAvailability(state.selectedRoomId, state.date)
        .then(setBusySlots)
        .catch(err => console.error(err))
        .finally(() => setCheckingAvailability(false));
    }
  }, [state.selectedRoomId, state.date, state.step]);

  const isSlotAvailable = (checkTime: string, checkDuration: number) => {
    const startHour = parseInt(checkTime.split(':')[0]);
    const endHour = startHour + checkDuration;

    return !busySlots.some(slot => {
      const busyStart = parseInt(slot.time.split(':')[0]);
      const busyEnd = busyStart + slot.duration;
      return startHour < busyEnd && endHour > busyStart;
    });
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    if (!selectedRoom || !pricing || !state.selectedRoomId) return;

    setIsSaving(true);
    const bookingId = Math.random().toString(36).substr(2, 9);
    
    const newBooking = {
      id: bookingId,
      roomId: state.selectedRoomId,
      roomName: selectedRoom.name,
      date: state.date,
      time: state.time,
      duration: state.duration,
      totalPrice: pricing.total,
      customer: state.customer,
      paymentIntentId,
      status: 'confirmed' as const,
      timestamp: Date.now()
    };

    try {
      await saveBooking(newBooking);
      setConfirmedId(bookingId);
      nextStep();
    } catch (error: any) {
      console.error("Failed to save booking", error);
      alert(`Booking Failed: ${error.message || "Please contact support."}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (state.step === 5 && confirmedId) {
    return (
      <div className="text-center py-12 px-6">
        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Booking Confirmed!</h2>
        <p className="text-zinc-400 mb-8">Get ready to sing your heart out.</p>
        <div className="bg-zinc-900 p-6 rounded-xl max-w-sm mx-auto mb-8 border border-zinc-800 text-left">
           <div className="space-y-3 text-sm">
             <div className="flex justify-between"><span className="text-zinc-500">Booking ID</span> <span className="font-mono text-white">{confirmedId}</span></div>
             <div className="flex justify-between"><span className="text-zinc-500">Room</span> <span className="text-white">{selectedRoom?.name}</span></div>
             <div className="flex justify-between"><span className="text-zinc-500">Date</span> <span className="text-white">{format(new Date(state.date), 'EEE, d MMM yyyy')}</span></div>
             <div className="flex justify-between"><span className="text-zinc-500">Time</span> <span className="text-white">{state.time} ({state.duration} hrs)</span></div>
           </div>
        </div>
        <Button onClick={() => window.location.reload()}>Book Another</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <StepIndicator currentStep={state.step} />

      {state.step === 1 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-purple to-neon-cyan">Choose Your Stage</h2>
            <p className="text-zinc-400 mt-2">Select a room that fits your crew.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ROOMS.map(room => (
              <RoomCard 
                key={room.id} 
                room={room} 
                selected={state.selectedRoomId === room.id}
                onSelect={(id) => setState(prev => ({ ...prev, selectedRoomId: id }))}
              />
            ))}
          </div>
          <div className="flex justify-end pt-6">
            <Button onClick={nextStep} disabled={!state.selectedRoomId} className="w-full md:w-auto">
              Next Step
            </Button>
          </div>
        </div>
      )}

      {state.step === 2 && (
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="text-neon-pink" /> Set the Date
          </h2>
          
          <div className="space-y-6 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800 relative">
            {checkingAvailability && (
              <div className="absolute inset-0 bg-zinc-900/80 z-10 flex items-center justify-center rounded-2xl">
                 <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neon-cyan"></div>
              </div>
            )}

            <Input 
              label="Date" 
              type="date" 
              min={new Date().toISOString().split('T')[0]}
              value={state.date}
              onChange={(e) => setState(prev => ({ ...prev, date: e.target.value }))}
            />

            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-zinc-400 mb-1.5">Start Time</label>
                 <select 
                   className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-purple disabled:opacity-50"
                   value={state.time}
                   onChange={(e) => setState(prev => ({ ...prev, time: e.target.value }))}
                 >
                   {TIMES.map(t => {
                     const isAvailable = isSlotAvailable(t, state.duration);
                     return (
                       <option key={t} value={t} disabled={!isAvailable} className={!isAvailable ? 'text-zinc-600' : ''}>
                         {t} {!isAvailable && '(Booked)'}
                       </option>
                     );
                   })}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-zinc-400 mb-1.5">Duration</label>
                 <select 
                   className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-purple"
                   value={state.duration}
                   onChange={(e) => setState(prev => ({ ...prev, duration: Number(e.target.value) }))}
                 >
                   {DURATIONS.map(d => {
                     const isAvailable = isSlotAvailable(state.time, d);
                     return (
                      <option key={d} value={d} disabled={!isAvailable} className={!isAvailable ? 'text-zinc-600' : ''}>
                        {d} Hours {!isAvailable && '(Unavailable)'}
                      </option>
                     );
                   })}
                 </select>
               </div>
            </div>
            
            {!isSlotAvailable(state.time, state.duration) && (
               <div className="flex items-center text-red-400 text-sm mt-2 bg-red-900/10 p-2 rounded">
                  <AlertCircle size={16} className="mr-2" />
                  This time slot is currently unavailable. Please change your time or duration.
               </div>
            )}

            <Input 
              label="Number of Guests" 
              type="number"
              min={1}
              max={selectedRoom?.capacity || 20}
              value={state.guests}
              onChange={(e) => setState(prev => ({ ...prev, guests: Number(e.target.value) }))}
            />

            {pricing && (
              <div className="mt-6 p-4 bg-black rounded-lg border border-zinc-800">
                <div className="flex justify-between text-sm text-zinc-400 mb-1">
                  <span>Base Price</span>
                  <span>{formatCurrency(pricing.basePrice)}</span>
                </div>
                {pricing.isWeekend && (
                  <div className="flex justify-between text-sm text-neon-pink mb-1">
                    <span>Weekend Surcharge (+20%)</span>
                    <span>+{formatCurrency(pricing.surcharge)}</span>
                  </div>
                )}
                <div className="border-t border-zinc-800 my-2 pt-2 flex justify-between font-bold text-lg text-white">
                  <span>Total</span>
                  <span>{formatCurrency(pricing.total)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-8">
            <Button variant="secondary" onClick={prevStep}>Back</Button>
            <Button 
              className="flex-1" 
              onClick={nextStep} 
              disabled={!isSlotAvailable(state.time, state.duration)}
            >
              Next: Details
            </Button>
          </div>
        </div>
      )}

      {state.step === 3 && (
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <User className="text-neon-cyan" /> Your Details
          </h2>
          
          <div className="space-y-4 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
            <Input 
              label="Full Name" 
              placeholder="Ziggy Stardust"
              value={state.customer.name}
              onChange={(e) => setState(prev => ({ ...prev, customer: { ...prev.customer, name: e.target.value } }))}
            />
            <Input 
              label="Email Address" 
              type="email"
              placeholder="ziggy@mars.com"
              value={state.customer.email}
              onChange={(e) => setState(prev => ({ ...prev, customer: { ...prev.customer, email: e.target.value } }))}
            />
            <Input 
              label="Phone Number" 
              type="tel"
              placeholder="+44 7700 900000"
              value={state.customer.phone}
              onChange={(e) => setState(prev => ({ ...prev, customer: { ...prev.customer, phone: e.target.value } }))}
            />
             <Input 
              label="Special Requests (Optional)" 
              placeholder="Birthday, Specific songs, etc."
              value={state.customer.notes}
              onChange={(e) => setState(prev => ({ ...prev, customer: { ...prev.customer, notes: e.target.value } }))}
            />
          </div>

          <div className="flex gap-4 mt-8">
            <Button variant="secondary" onClick={prevStep}>Back</Button>
            <Button 
              className="flex-1" 
              onClick={nextStep}
              disabled={!state.customer.name || !state.customer.email || !state.customer.phone}
            >
              Next: Payment
            </Button>
          </div>
        </div>
      )}

      {state.step === 4 && pricing && (
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
             <h2 className="text-2xl font-bold mb-2">Secure Checkout</h2>
             <p className="text-zinc-400">Complete your booking for <span className="text-white font-bold">{selectedRoom?.name}</span></p>
          </div>

          <Elements stripe={stripePromise}>
            {isSaving ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-neon-purple mx-auto mb-4"></div>
                <p className="text-zinc-400">Finalizing your booking...</p>
              </div>
            ) : (
              <PaymentForm 
                amount={pricing.total} 
                onBack={prevStep}
                onSuccess={handlePaymentSuccess}
              />
            )}
          </Elements>
        </div>
      )}
    </div>
  );
};