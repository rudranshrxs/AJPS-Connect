import React, { useEffect, useState } from 'react';

export function SuccessAnimation({ message, isError = false }: { message?: string, isError?: boolean }) {
  const [phase, setPhase] = useState<'loading' | 'success' | 'shrink'>('loading');

  useEffect(() => {
    let isMounted = true;
    
    // Play audio when tick appears
    const playSuccessSound = () => {
      const audio = new Audio('/sounds/success.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    };

    const loadingTimer = setTimeout(() => {
      if (!isMounted) return;
      setPhase('success');
      if (!isError) playSuccessSound(); // maybe another sound for error? just not playing for now
    }, 800); // Loading for 0.8s

    const shrinkTimer = setTimeout(() => {
      if (!isMounted) return;
      setPhase('shrink');
    }, 2000); // Shrink at 2.0s (total 2.5s)

    return () => {
      isMounted = false;
      clearTimeout(loadingTimer);
      clearTimeout(shrinkTimer);
    };
  }, [isError]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-md">
      <div className={`flex flex-col items-center transition-all duration-500 ${phase === 'shrink' ? 'scale-50 opacity-0' : 'scale-100 opacity-100'}`}>
        
        <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
          {/* Phase 1: Loading Spinner */}
          <svg className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${phase === 'loading' ? 'opacity-100 animate-spin' : 'opacity-0'}`} viewBox="0 0 50 50">
            <circle className="stroke-[#A05C2B]" cx="25" cy="25" r="20" fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray="31.4 125.6" strokeDashoffset="0"></circle>
          </svg>

          {/* Phase 2: Solid Circle + Checkmark/Cross */}
          <svg className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${phase !== 'loading' ? 'opacity-100' : 'opacity-0'}`} viewBox="0 0 52 52">
            <circle className={`transition-all duration-500 origin-center ${phase !== 'loading' ? 'scale-100' : 'scale-0'} ${isError ? 'fill-red-500' : 'fill-green-500'}`} cx="26" cy="26" r="26" />
            {!isError ? (
              <path className="fill-none stroke-white stroke-[4] stroke-linecap-round stroke-linejoin-round"
                    strokeDasharray="48"
                    strokeDashoffset={phase !== 'loading' ? '0' : '48'}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out 0.2s' }}
                    d="M14 27 l7 7 l16 -16" />
            ) : (
              <path className="fill-none stroke-white stroke-[4] stroke-linecap-round stroke-linejoin-round"
                    strokeDasharray="48"
                    strokeDashoffset={phase !== 'loading' ? '0' : '48'}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-in-out 0.2s' }}
                    d="M16 16 l20 20 M36 16 l-20 20" />
            )}
          </svg>
        </div>
        
        {message && (
          <h2 className={`text-xl font-bold text-gray-800 transition-opacity duration-500 ${phase !== 'loading' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {message}
          </h2>
        )}
      </div>
    </div>
  );
}
