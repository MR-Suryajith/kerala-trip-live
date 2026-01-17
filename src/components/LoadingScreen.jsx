import React, { useState, useEffect } from 'react';

const TRAVEL_MODES = [
  { icon: "✈️", label: "Departure Scheduled" },
  { icon: "🚂", label: "Routing Rails" },
  { icon: "🚗", label: "Mapping Routes" },
  { icon: "🏍️", label: "Exploring Terrains" },
  { icon: "🛶", label: "Navigating Backwaters" }
];

const STATUS_MESSAGES = [
  "Synchronizing with Sanchaara-AI...",   
  "Analyzing Geographical Data...",
  "Evaluating Local Weather...",
  "Curating Cultural Insights...",
  "Optimizing Group Logistics...",
  "Finalizing Itinerary JSON..."
];

export default function LoadingScreen() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % TRAVEL_MODES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);
  

  return (
    <div className="fixed inset-0 z-[2000] flex flex-col items-center justify-center bg-[#020617] overflow-hidden">
      <p className="absolute bottom-24 text-[8px] font-black text-white/20 uppercase tracking-[0.4em] animate-pulse">
   Calibrating neural pathfinders...</p>
      
      {/* --- BACKGROUND WATERMARK (MINIMALIST & ELITE) --- */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <h1 className="text-[10vw] font-black text-white/[0.05] tracking-[0.2em] whitespace-nowrap animate-pulse">
          SANCHAARA
        </h1>
      </div>

      {/* --- CENTRAL STAGE --- */}
      <div className="relative flex items-center justify-center">
        
        {/* Animated Aura */}
        <div className="absolute w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute w-60 h-60 bg-emerald-500/10 rounded-full blur-[80px] animate-pulse [animation-delay:1s]"></div>

        {/* The Orbital Path */}
        <div className="absolute w-72 h-72 border border-white/[0.05] rounded-full"></div>
        
        {/* The Scanning Ring */}
        <div className="absolute w-64 h-64 border-t-2 border-l-2 border-emerald-500/30 rounded-full animate-spin"></div>

        {/* Morphing Icon Container */}
        <div className="relative z-10 flex flex-col items-center justify-center bg-white/5 backdrop-blur-2xl border border-white/10 w-44 h-44 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <span className="text-6xl filter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] animate-bounce">
            {TRAVEL_MODES[index].icon}
          </span>
          
          {/* Subtle Brand Tag below icon */}
          <div className="absolute bottom-4 flex items-center gap-1.5">
            <div className="w-1 h-1 bg-emerald-400 rounded-full animate-ping"></div>
            <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.3em]">
              Sanchaara Core
            </span>
          </div>
        </div>
      </div>

      {/* --- TEXTUAL BRANDING & STATUS --- */}
      <div className="mt-16 text-center space-y-6 relative z-10">
        <div className="space-y-1">
          <h2 className="text-sm font-black text-emerald-400 uppercase tracking-[0.5em]">
            {TRAVEL_MODES[index].label}
          </h2>
          <div className="h-[1px] w-12 bg-emerald-500/50 mx-auto mt-2"></div>
        </div>

        <div className="h-4">
            <p className="text-white/60 text-[11px] font-medium tracking-widest uppercase transition-all duration-700">
                {STATUS_MESSAGES[index]}
            </p>
        </div>
      </div>

      {/* --- PROGRESS BAR --- */}
      <div className="mt-12 w-48 h-[2px] bg-white/5 rounded-full overflow-hidden">
        <div 
           className="h-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent transition-all duration-1000 ease-in-out shadow-[0_0_10px_#10b981]"
           style={{ 
             width: '100%',
             transform: `translateX(${(index - TRAVEL_MODES.length / 2) * 20}%)` 
           }}
        ></div>
      </div>

      {/* --- FOOTER BRANDING (STUNNING WATERMARK) --- */}
      <div className="absolute bottom-10 flex flex-col items-center gap-2">
        <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.8em] ml-[0.8em]">
          SANCHAARA AI
        </p>
        
        {/* Render "Cold Start" Warning only if needed */}
        <p className="text-white/10 text-[8px] font-medium uppercase tracking-widest max-w-[200px] text-center leading-relaxed">
            Establishing secure connection with <br/> neural travel servers...
        </p>
      </div>

    </div>
  );
}

//test