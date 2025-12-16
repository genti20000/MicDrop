
import React from 'react';

export const StepIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => {
  const steps = [1, 2, 3];
  
  return (
    <div className="flex items-center justify-center space-x-2 mb-8">
      {steps.map((step) => (
        <React.Fragment key={step}>
          <div 
            className={`
              w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300
              ${currentStep >= step 
                ? 'bg-[#FFD700] text-black shadow-lg shadow-yellow-900/50' 
                : 'bg-neutral-900 text-neutral-600 border border-neutral-800'}
            `}
          >
            {step}
          </div>
          {step < 3 && (
            <div 
              className={`h-1 w-8 rounded-full transition-all duration-300 ${currentStep > step ? 'bg-neutral-700' : 'bg-neutral-900'}`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};
