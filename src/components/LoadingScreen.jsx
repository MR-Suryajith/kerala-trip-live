import React, { useState, useEffect } from 'react';

const TRAVEL_MODES = [
  { icon: "✈️", label: "Flying to Kerala..." },
  { icon: "🚂", label: "Catching the Express..." },
  { icon: "🚗", label: "Navigating the ghats..." },
  { icon: "🏍️", label: "Exploring the countryside..." },
  { icon: "🚶", label: "Walking through tea gardens..." },
  { icon: "🛶", label: "Cruising the backwaters..." }
];

const STATUS_MESSAGES = [
  "Consulting Gemini AI...",
  "Calculating road distances...",
  "Checking weather in Munnar...",
  "Finding the best local food spots...",
  "Optimizing for your budget...",
  "Checking for local festivals..."
];

export default function LoadingScreen() {
  const [index, setIndex] = useState(0);

  // Rotate icons and status messages
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % TRAVEL_MODES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl">
      
      {/* --- CENTRAL ANIMATION STAGE --- */}
      <div className="relative flex items-center justify-center w-64 h-64">
        
        {/* Outer Pulsing Glow */}
        <div className="absolute inset-0 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>

        {/* Spinning Outer Ring */}
        <div className="absolute w-48 h-48 border-2 border-dashed border-white/20 rounded-full animate-[spin_10s_linear_infinite]"></div>

        {/* Rotating Orbital Dot */}
        <div className="absolute w-full h-full animate-[spin_3s_linear_infinite]">
            <div className="w-4 h-4 bg-green-400 rounded-full shadow-[0_0_15px_#4ade80] absolute top-0 left-1/2 -translate-x-1/2"></div>
        </div>

        {/* Morphing Icon Container */}
        <div className="relative z-10 flex flex-col items-center justify-center bg-white/5 border border-white/10 w-40 h-40 rounded-[2.5rem] shadow-2xl backdrop-blur-md transition-all duration-500 transform hover:scale-110">
          <span className="text-6xl animate-bounce transition-all duration-500">
            {TRAVEL_MODES[index].icon}
          </span>
        </div>
      </div>

      {/* --- DYNAMIC TEXT SECTION --- */}
      <div className="mt-12 text-center space-y-4 max-w-xs">
        <div className="h-8 overflow-hidden">
            <h2 className="text-2xl font-black text-white tracking-[0.2em] uppercase transition-all duration-500">
                {TRAVEL_MODES[index].label}
            </h2>
        </div>
        
        <p className="text-green-400 font-bold text-xs uppercase tracking-widest opacity-80 h-4 animate-pulse">
          {STATUS_MESSAGES[index]}
        </p>

        <p className="text-white/40 text-[10px] italic font-medium">
          "Patience is the key to a great journey."
        </p>
      </div>

      {/* --- PROGRESS TRACK --- */}
      <div className="mt-10 w-64 h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/10 relative">
        <div 
           className="h-full bg-gradient-to-r from-green-500 via-blue-500 to-green-500 transition-all duration-500 ease-linear shadow-[0_0_10px_rgba(34,197,94,0.5)]"
           style={{ width: `${((index + 1) / TRAVEL_MODES.length) * 100}%` }}
        ></div>
      </div>

      {/* --- DECORATIVE SIDE ELEMENTS --- */}
      <div className="absolute bottom-10 left-10 text-white/5 text-[100px] font-black pointer-events-none select-none">
        KERALA
      </div>
      <div className="absolute top-10 right-10 text-white/5 text-[100px] font-black pointer-events-none select-none">
        LIVE
      </div>

    </div>
  );
}