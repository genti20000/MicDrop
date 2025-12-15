import React, { useState } from 'react';
import { Mic, List } from 'lucide-react';
import { BookingWizard } from './components/BookingWizard';
import { MyBookings } from './components/MyBookings';

const App: React.FC = () => {
  const [view, setView] = useState<'book' | 'list'>('book');

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-neon-pink selection:text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setView('book')}>
            <div className="bg-gradient-to-r from-neon-pink to-neon-purple p-2 rounded-lg">
              <Mic size={20} className="text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight">MicDrop</span>
          </div>
          
          <div className="flex space-x-1 bg-zinc-900 p-1 rounded-lg">
            <button
              onClick={() => setView('book')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'book' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              Book Room
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'list' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
            >
              My Bookings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-20">
        {view === 'book' ? <BookingWizard /> : <MyBookings />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 text-center text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} MicDrop Karaoke. Soho, London.</p>
      </footer>
    </div>
  );
};

export default App;
