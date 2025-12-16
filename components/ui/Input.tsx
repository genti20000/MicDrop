
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, className, ...props }) => {
  return (
    <div className="w-full">
      <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
        {label}
      </label>
      <input 
        className={`w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:border-[#FFD700] focus:ring-1 focus:ring-[#FFD700] transition-all font-medium ${className}`}
        {...props}
      />
    </div>
  );
};
