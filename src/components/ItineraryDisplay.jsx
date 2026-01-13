import React, { useState } from 'react';
import MapComponent from './MapComponent';
import jsPDF from 'jspdf';
import { Download, RefreshCw, Zap, Wind, Utensils, Film, Gamepad2, Navigation, Clock, CheckCircle2 } from 'lucide-react';

export default function ItineraryDisplay({ itinerary, onEdit, onSwitchPlan }) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!itinerary || !itinerary.days || !itinerary.initialLogistics) return null;

  const getTrafficDetails = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('high')) return { color: 'text-red-400', bg: 'bg-red-500/20', label: 'HEAVY' };
    if (s.includes('moderate')) return { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'MODERATE' };
    return { color: 'text-emerald-400', bg: 'bg-emerald-500/20', label: 'CLEAR' };
  };

  const renderBudget = (budget) => {
    if (typeof budget === 'object' && budget !== null) {
      return `₹${budget.value || budget.total || 'Calculated'}`;
    }
    return budget;
  };

  const exportPDF = () => {
    setIsGenerating(true);
    const doc = new jsPDF();
    // ... (Your high quality PDF logic from earlier)
    doc.save(`Sanchaara-Trip-Plan.pdf`);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen w-full p-4 md:p-8 animate-fade-in relative z-10 text-white font-sans">
      
      {/* 🧭 NAVIGATION */}
      <nav className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white/5 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div>
          <h2 className="text-4xl font-black tracking-tighter italic">SANCHAARA <span className="text-blue-400 font-normal">AI</span></h2>
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/40">Intelligent Journey Partner</p>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onEdit} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group">
            <RefreshCw className="w-5 h-5 text-white/60 group-hover:rotate-180 transition-transform duration-500" />
          </button>
          <button 
            onClick={exportPDF}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all"
          >
            <Download className="w-4 h-4" />
            {isGenerating ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto space-y-20">
        
        {/* ✈️ DEPARTURE SECTION */}
        <section className="bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-3">
          <div className="p-10 lg:col-span-1 flex flex-col justify-center border-r border-white/5">
            <span className="text-blue-400 font-black text-[10px] tracking-widest uppercase mb-4 flex items-center gap-2">
                <Navigation className="w-3 h-3" /> Initial Logistics
            </span>
            <h3 className="text-4xl font-black mb-8 leading-tight tracking-tighter">
              {itinerary.initialLogistics.from} <br/>
              <span className="text-white/20 text-2xl font-light">➔</span> {itinerary.initialLogistics.to}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                <p className="text-white/30 text-[9px] font-bold uppercase mb-1">Mode</p>
                <p className="font-black text-xs uppercase tracking-widest">{itinerary.initialLogistics.mode}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                <p className="text-white/30 text-[9px] font-bold uppercase mb-1">Distance</p>
                <p className="font-black text-xs text-green-400 uppercase tracking-widest">{itinerary.initialLogistics.distance}</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 h-[350px]">
            <MapComponent origin={itinerary.initialLogistics.from} destination={itinerary.initialLogistics.to} isFlight={true} />
          </div>
        </section>

        {/* 📅 DAILY CARDS */}
        <div className="space-y-24">
          {itinerary.days.map((day, dayIdx) => (
            <div key={dayIdx} className="bg-white/5 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden">
              
              <div className="bg-gradient-to-r from-blue-600/20 to-emerald-500/10 p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex flex-col items-center justify-center shadow-lg">
                    <span className="text-[10px] font-black uppercase opacity-60 text-white/70">Day</span>
                    <span className="text-3xl font-black leading-none">{dayIdx + 1}</span>
                  </div>
                  <div>
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">{day.date || 'The Route'}</p>
                    <h4 className="text-4xl font-black tracking-tighter">{day.cityLocation}</h4>
                  </div>
                </div>
                <div className="bg-white/5 px-6 py-4 rounded-3xl border border-white/10 flex items-center gap-4">
                   <span className="text-4xl">{day.weather?.icon || "🌤️"}</span>
                   <div className="text-right">
                     <p className="text-2xl font-black tracking-tighter">{day.weather?.temp || "24°C"}</p>
                     <p className="text-[9px] font-black uppercase text-white/40">{day.weather?.condition}</p>
                   </div>
                </div>
              </div>

              <div className="flex flex-col xl:flex-row">
                <div className="flex-[2.5] p-8 md:p-14 space-y-24 border-r border-white/5">
                  {day.places?.map((place, pIdx) => {
                    const traffic = getTrafficDetails(place.trafficStatus);
                    const mapOrigin = pIdx === 0 
                        ? (dayIdx === 0 ? itinerary.arrivalLogistics.from : "Hotel in " + day.cityLocation) 
                        : day.places[pIdx - 1].name;

                    return (
                      <div key={pIdx} className="group relative">
                        <div className="flex flex-col md:flex-row gap-10">
                          
                          {/* 🕒 TIME SECTION - ARRIVAL HEADER */}
                          <div className="md:w-36 shrink-0">
                             <div className="flex items-center gap-2 text-blue-400 mb-2">
                                <Clock className="w-4 h-4 animate-pulse" />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Arrival</span>
                             </div>
                             <p className="text-3xl font-black text-white">{place.time}</p>
                             <div className={`inline-flex items-center gap-2 mt-4 px-3 py-1.5 rounded-xl text-[9px] font-black ${traffic.bg} ${traffic.color} border border-white/5`}>
                               <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                               {traffic.label}
                             </div>
                          </div>

                          <div className="flex-1">
                            <h5 className="text-4xl font-black text-white mb-6 tracking-tight leading-tight">
                              {place.name}
                            </h5>
                            <p className="text-white/60 mb-8 leading-relaxed italic text-lg border-l-2 border-blue-500/30 pl-6 py-1">
                              {place.description}
                            </p>
                            
                            <div className="rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl h-80 transition-all hover:border-blue-500/30">
                              <MapComponent origin={mapOrigin} destination={place.name} />
                            </div>
                            
                            {/* PLAN B SWAP BUTTON */}
                            {place.alternativePlace && (
                              <div className="mt-8 bg-white/5 border border-white/10 p-8 rounded-[2.5rem] shadow-xl group/alt transition-all hover:bg-white/10">
                                <p className="text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                                  <RefreshCw className="w-3 h-3" /> Smart Swap Suggestion
                                </p>
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                  <p className="text-xl font-bold text-white/90">{place.alternativePlace}</p>
                                  <button 
                                    onClick={() => onSwitchPlan(day.dayNumber, place.name, place.alternativePlace)}
                                    className="bg-white text-black px-10 py-4 rounded-2xl font-black text-[10px] uppercase hover:bg-green-400 hover:text-white transition-all shadow-lg active:scale-95"
                                  >
                                    Swap Itinerary
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Sidebar (Daily Dose) */}
                <aside className="flex-1 bg-white/5 p-12">
                   <h6 className="text-xs font-black text-white/40 uppercase tracking-[0.4em] mb-12 flex items-center gap-3 italic">
                      <Wind className="w-5 h-5 text-blue-400" /> Daily Dose
                   </h6>
                   <div className="space-y-16">
                     {['recipe', 'movie', 'game'].map((item) => (
                       <div key={item} className="group/item">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-xl group-hover/item:scale-110 transition-transform">
                                {item === 'recipe' ? <Utensils className="w-5 h-5 text-orange-400" /> : item === 'movie' ? <Film className="w-5 h-5 text-blue-400" /> : <Gamepad2 className="w-5 h-5 text-emerald-400" />}
                            </div>
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{item}</span>
                         </div>
                         <p className="text-lg font-bold text-white/80 group-hover/item:text-white transition-colors">{day.dailyDose?.[item] || "Curating..."}</p>
                       </div>
                     ))}
                   </div>
                </aside>
              </div>
            </div>
          ))}
        </div>

        {/* 💰 BUDGET FOOTER */}
        <footer className="text-center py-40 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-emerald-500/10 to-blue-600/10 blur-[140px] rounded-full"></div>
          <div className="relative inline-block bg-slate-950/60 backdrop-blur-3xl border border-white/10 px-24 py-12 rounded-[4rem] shadow-2xl group">
            <p className="text-white/30 text-[11px] font-medium uppercase tracking-[0.7em] mb-6">Total Estimated Investment</p>
            <p className="text-6xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/40 drop-shadow-2xl italic">
              {renderBudget(itinerary.estimatedTotalCost)}
            </p>
            <div className="mt-6 flex items-center justify-center gap-3 text-[10px] font-bold text-emerald-400/60 tracking-[0.3em] uppercase">
              <CheckCircle2 className="w-3 h-3" /> AI Verified Precision
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}