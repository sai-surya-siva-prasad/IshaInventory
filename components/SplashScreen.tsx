import React, { useState, useEffect } from 'react';
import { CubeLogo } from './ui/Logo';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isSplitting, setIsSplitting] = useState(false);

  useEffect(() => {
    // Show logo for 1.2 seconds, then split
    const splitTimer = setTimeout(() => {
      setIsSplitting(true);
    }, 1200);

    // Complete after split animation (0.6s)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1800);

    return () => {
      clearTimeout(splitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Left Panel */}
      <div 
        className={`absolute top-0 left-0 w-1/2 h-full bg-[#F2F2F7] transition-transform duration-500 ease-in-out ${
          isSplitting ? '-translate-x-full' : 'translate-x-0'
        }`}
      />

      {/* Right Panel */}
      <div 
        className={`absolute top-0 right-0 w-1/2 h-full bg-[#F2F2F7] transition-transform duration-500 ease-in-out ${
          isSplitting ? 'translate-x-full' : 'translate-x-0'
        }`}
      />

      {/* Center Content - Logo and Title */}
      <div 
        className={`absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#F2F2F7] transition-opacity duration-300 ${
          isSplitting ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <div className="bg-white p-4 rounded-[22%] shadow-xl shadow-iosBlue/10 border border-iosDivider/20 rotate-[-5deg]">
          <CubeLogo size={52} color="#007AFF" />
        </div>
        
        <div className="mt-6 text-center">
          <h1 className="text-[28px] font-extrabold tracking-tight text-black">
            WhoHasWhat
          </h1>
          <p className="text-iosGray text-[15px] mt-1">
            Registry Management System
          </p>
        </div>
      </div>
    </div>
  );
};
