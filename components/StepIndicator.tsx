import React from 'react';

export const StepIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = [1, 2, 3, 4];
  
  return (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {steps.map((step) => (
        <React.Fragment key={step}>
          <div 
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
              ${currentStep >= step 
                ? 'bg-gradient-to-br from-neon-purple to-neon-pink text-white shadow-lg shadow-purple-900/50' 
                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'}
            `}
          >
            {step}
          </div>
          {step < 4 && (
            <div 
              className={`h-1 w-8 rounded-full transition-all duration-300 ${currentStep > step ? 'bg-zinc-600' : 'bg-zinc-800'}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
