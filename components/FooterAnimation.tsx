
'use client';

import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export const FooterAnimation = () => {
  return (
    <div className="flex justify-center w-full mb-6">
      <div style={{ width: '150px', height: '150px' }}>
        <DotLottieReact
          src="https://lottie.host/2aa09ffa-93b9-4a9c-89c6-7ea0e3e33b4a/ZMxFhFqdxq.lottie"
          loop
          autoplay
        />
      </div>
    </div>
  );
};
