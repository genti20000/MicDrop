import React, { useState } from 'react';
import { Mic, User, LogOut } from 'lucide-react';
import { BookingWizard } from './components/BookingWizard';
import { MyBookings } from './components/MyBookings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm, RegisterForm } from './components/Auth';

const MainApp: React.FC = () => {
  const { user, logout } = useAuth();
  const [view, setView] = useState<'book' | 'list' | 'login'>('book');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const handleLoginSuccess = () => {
    setView('list'); // Redirect to bookings after login
  };

  const handleMyBookingsClick = () => {
    if (user) {
      setView('list');
    } else {
      setView('login');
      setAuthMode('login');
    }
  };

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
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:flex space-x-1 bg-zinc-900 p-1 rounded-lg">
              <button
                onClick={() => setView('book')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'book' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
              >
                Book Room
              </button>
              <button
                onClick={handleMyBookingsClick}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'list' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-400 hover:text-white'}`}
              >
                My Bookings
              </button>
            </div>

            {user ? (
               <div className="flex items-center gap-3">
                 <span className="text-sm font-medium text-neon-cyan hidden sm:inline">{user.name}</span>
                 <button onClick={logout} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors" title="Logout">
                   <LogOut size={18} />
                 </button>
               </div>
            ) : (
               <button 
                 onClick={() => { setView('login'); setAuthMode('login'); }}
                 className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
               >
                 <User size={18} />
                 <span className="hidden sm:inline">Sign In</span>
               </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-20 pt-8">
        {view === 'book' && <BookingWizard />}
        
        {view === 'list' && (
          <MyBookings onLoginRequest={() => { setView('login'); setAuthMode('login'); }} />
        )}
        
        {view === 'login' && (
          <div className="px-4">
            {authMode === 'login' ? (
              <LoginForm onSuccess={handleLoginSuccess} onSwitch={() => setAuthMode('register')} />
            ) : (
              <RegisterForm onSuccess={handleLoginSuccess} onSwitch={() => setAuthMode('login')} />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 text-center text-zinc-600 text-sm">
        <p>&copy; {new Date().getFullYear()} MicDrop Karaoke. Soho, London.</p>
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
};

export default App;