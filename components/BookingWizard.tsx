import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { format } from 'date-fns';
import { CheckCircle, Calendar, Clock, User, ArrowLeft } from 'lucide-react';

import { STRIPE_PUBLISHABLE_KEY, ROOMS, DURATIONS, TIMES } from '../constants';
import { RoomCard } from './RoomCard';
import { StepIndicator } from './StepIndicator';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { PaymentForm } from './PaymentForm';
import { calculatePrice, formatCurrency } from '../services/pricing';
import { saveBooking } from '../services/storage';
import { BookingState, Room } from '../types';

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

const INITIAL_STATE: BookingState = {
  step: 1,
  selectedRoomId: null,
  date: new Date().toISOString().split('T')[0],
  time: '20:00',
  duration: 2,
  guests: 8, // Minimum 8 people
  customer: {
    name: '',
    email: '',
    phone: '',
    notes: ''
  }
};

export const BookingWizard: React.FC = () => {
  const [state, setState] = useState<BookingState>(INITIAL_STATE);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);

  const selectedRoom = ROOMS.find(r => r.id === state.selectedRoomId);
  
  // Calculate price based on duration and guests
  const pricing = calculatePrice(state.duration, state.guests);

  const nextStep = () => setState(prev => ({ ...prev, step: prev.step + 1 }));
  const prevStep = () => setState(prev => ({ ...prev, step: prev.step - 1 }));

  const handlePaymentSuccess = (paymentIntentId: string) => {
    if (!selectedRoom || !pricing) return;

    const bookingId = Math.random().toString(36).substr(2, 9);
    
    saveBooking({
      id: bookingId,
      roomName: selectedRoom.name,
      date: state.date,
      time: state.time,
      duration: state.duration,
      totalPrice: pricing.total,
      customer: state.customer,
      paymentIntentId,
      status: 'confirmed',
      timestamp: Date.now()
    });

    setConfirmedId(bookingId);
    nextStep();
  };

  // --- Step Renders ---

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
             <div className="flex justify-between border-t border-zinc-800 pt-2 mt-2"><span className="text-zinc-500">Total</span> <span className="text-neon-cyan font-bold">{formatCurrency(pricing.total)}</span></div>
           </div>
        </div>
        <Button onClick={() => window.location.reload()}>Book Another</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <StepIndicator currentStep={state.step} />

      {/* --- Step 1: Room Selection --- */}
      {state.step === 1 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neon-purple to-neon-cyan">Choose Your Stage</h2>
            <p className="text-zinc-400 mt-2">£19 per person. Minimum 8 people.</p>
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

      {/* --- Step 2: Schedule --- */}
      {state.step === 2 && (
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Calendar className="text-neon-pink" /> Set the Date
          </h2>
          
          <div className="space-y-6 bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
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
                   className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-purple"
                   value={state.time}
                   onChange={(e) => setState(prev => ({ ...prev, time: e.target.value }))}
                 >
                   {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-zinc-400 mb-1.5">Duration</label>
                 <select 
                   className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-neon-purple"
                   value={state.duration}
                   onChange={(e) => setState(prev => ({ ...prev, duration: Number(e.target.value) }))}
                 >
                   {DURATIONS.map(d => <option key={d} value={d}>{d} Hours</option>)}
                 </select>
               </div>
            </div>

            <Input 
              label={`Number of Guests (Min 8, Max ${selectedRoom?.capacity})`} 
              type="number"
              min={8}
              max={selectedRoom?.capacity || 20}
              value={state.guests}
              onChange={(e) => {
                const val = Number(e.target.value);
                setState(prev => ({ ...prev, guests: val }));
              }}
            />
            {state.guests < 8 && (
               <p className="text-red-500 text-sm">Minimum 8 guests required.</p>
            )}

            {/* Price Preview */}
            <div className="mt-6 p-4 bg-black rounded-lg border border-zinc-800">
              <div className="flex justify-between text-sm text-zinc-400 mb-1">
                <span>Rate ({state.guests} guests × £19)</span>
                <span>{formatCurrency(pricing.perPersonTotal)}</span>
              </div>
              {pricing.extraTimeTotal > 0 && (
                <div className="flex justify-between text-sm text-neon-pink mb-1">
                  <span>Extra Time (+{state.duration - 1} hrs × £90)</span>
                  <span>+{formatCurrency(pricing.extraTimeTotal)}</span>
                </div>
              )}
              <div className="border-t border-zinc-800 my-2 pt-2 flex justify-between font-bold text-lg text-white">
                <span>Total</span>
                <span>{formatCurrency(pricing.total)}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <Button variant="secondary" onClick={prevStep}>Back</Button>
            <Button className="flex-1" onClick={nextStep} disabled={state.guests < 8}>Next: Details</Button>
          </div>
        </div>
      )}

      {/* --- Step 3: Details --- */}
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

      {/* --- Step 4: Payment --- */}
      {state.step === 4 && (
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-8">
             <h2 className="text-2xl font-bold mb-2">Secure Checkout</h2>
             <p className="text-zinc-400">Complete your booking for <span className="text-white font-bold">{selectedRoom?.name}</span></p>
          </div>

          <Elements stripe={stripePromise}>
            <PaymentForm 
              amount={pricing.total} 
              onBack={prevStep}
              onSuccess={handlePaymentSuccess}
            />
          </Elements>
        </div>
      )}
    </div>
  );
};