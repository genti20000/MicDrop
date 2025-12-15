import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { AlertCircle, ArrowRight } from 'lucide-react';

interface AuthFormProps {
  onSuccess: () => void;
  onSwitch: () => void;
}

export const LoginForm: React.FC<AuthFormProps> = ({ onSuccess, onSwitch }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Welcome Back</h2>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 flex items-center text-sm">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        
        <Button fullWidth disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </Button>
      </form>

      <p className="mt-6 text-center text-zinc-500 text-sm">
        Don't have an account?{' '}
        <button onClick={onSwitch} className="text-neon-cyan hover:underline">
          Sign Up
        </button>
      </p>
    </div>
  );
};

export const RegisterForm: React.FC<AuthFormProps> = ({ onSuccess, onSwitch }) => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(name, email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-white">Join the Party</h2>
      
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-6 flex items-center text-sm">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name" type="text" value={name} onChange={e => setName(e.target.value)} required />
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        
        <Button fullWidth disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </Button>
      </form>

      <p className="mt-6 text-center text-zinc-500 text-sm">
        Already have an account?{' '}
        <button onClick={onSwitch} className="text-neon-cyan hover:underline">
          Sign In
        </button>
      </p>
    </div>
  );
};