import React from 'react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
      {/* Animated Icon Container */}
      <div className="relative flex items-center justify-center">
        {/* Outer Spinning Ring */}
        <div className="w-24 h-24 border-4 border-t-green-400 border-r-transparent border-b-blue-400 border-l-transparent rounded-full animate-spin"></div>
        
        {/* Inner Bouncing Airplane */}
        <div className="absolute text-4xl animate-bounce">
          ✈️
        </div>
      </div>

      {/* Loading Text */}
      <div className="mt-8 text-center">
        <h2 className="text-2xl font-black text-white tracking-widest uppercase animate-pulse">
          Consulting Gemini AI
        </h2>
        <p className="text-white/70 font-medium mt-2 italic">
          Crafting your perfect Kerala adventure...
        </p>
      </div>

      {/* Progress Sub-text */}
      <div className="mt-4 flex gap-2">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span>
        <span className="w-2 h-2 bg-blue-400 rounded-full animate-ping [animation-delay:0.2s]"></span>
        <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping [animation-delay:0.4s]"></span>
      </div>
    </div>
  );
}