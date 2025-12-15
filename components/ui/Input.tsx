import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, className, ...props }) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-zinc-400 mb-1.5">
        {label}
      </label>
      <input 
        className={`w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all ${className}`}
        {...props}
      />
    </div>
  );
};
