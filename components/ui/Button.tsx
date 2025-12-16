
import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className, 
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg px-6 py-3 font-bold uppercase tracking-wider transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-[#FFD700] hover:bg-yellow-400 text-black shadow-lg shadow-yellow-900/20 focus:ring-yellow-500",
    secondary: "bg-neutral-800 text-white hover:bg-neutral-700 focus:ring-neutral-500",
    outline: "border-2 border-neutral-700 text-neutral-300 hover:border-[#FFD700] hover:text-[#FFD700] bg-transparent",
    ghost: "bg-transparent text-neutral-400 hover:text-white"
  };

  return (
    <button 
      className={twMerge(
        baseStyles, 
        variants[variant], 
        fullWidth ? "w-full" : "", 
        className
      )}
      disabled={disabled}
      {...props}
    >
      {disabled && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
