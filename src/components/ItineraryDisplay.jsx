import React, { useState } from 'react';
import MapComponent from './MapComponent';
import jsPDF from 'jspdf';
import { 
  Download, RefreshCw, Zap, Wind, Utensils, 
  Film, Gamepad2, Navigation, Clock, CheckCircle2,
  Share2, Wallet, Users, TrendingUp, Info
} from 'lucide-react';

export default function ItineraryDisplay({ itinerary, onEdit, onSwitchPlan }) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!itinerary || !itinerary.days || !itinerary.initialLogistics) return null;

  // --- PHASE 10: WHATSAPP FORMATTING ---
  const shareToWhatsApp = () => {
    let text = `*🌴 SANCHAARA AI: MY KERALA TRIP* 🌊\n\n`;
    text += `*Route:* ${itinerary.initialLogistics.from} ➔ ${itinerary.days[0].cityLocation}\n`;
    text += `*Budget Total:* ${renderBudget(itinerary.estimatedTotalCost)}\n\n`;
    itinerary.days.forEach(day => {
      text += `*📅 ${day.date}*\n`;
      day.places.forEach(p => text += `• ${p.name} (${p.time})\n`);
      text += `\n`;
    });
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

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
    doc.save(`Sanchaara-Trip-Plan.pdf`);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen w-full p-4 md:p-8 animate-fade-in relative z-10 text-white font-sans selection:bg-emerald-500/30">
      
      {/* 🧭 NAVIGATION */}
      <nav className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-6 bg-white/5 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div>
          <h2 className="text-4xl font-black tracking-tighter italic">SANCHAARA <span className="text-blue-400 font-normal">AI</span></h2>
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/40">Intelligent Journey Partner</p>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={shareToWhatsApp} className="flex items-center gap-2 bg-[#25D366] hover:bg-[#128C7E] text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg">
            <Share2 className="w-4 h-4" /> Share
          </button>
          <button onClick={onEdit} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group">
            <RefreshCw className="w-5 h-5 text-white/60 group-hover:rotate-180 transition-transform duration-500" />
          </button>
          <button onClick={exportPDF} className="bg-white text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all">
            PDF
          </button>
        </div>
      </nav>

      {/* 🚀 PHASE 9: SEASONAL INSIGHT & TICKER */}
      <div className="max-w-7xl mx-auto space-y-6 mb-16">
        {itinerary.seasonalNote && (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 backdrop-blur-xl border border-amber-500/30 p-8 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center gap-8 group">
            <div className="bg-amber-400 text-black w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-xl font-bold animate-pulse">💡</div>
            <div>
              <span className="bg-amber-400/20 text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] px-3 py-1 rounded-full border border-amber-400/20">Seasonal Intelligence</span>
              <h3 className="text-2xl font-black text-white tracking-tight mt-2">Traveler Insight for your Dates</h3>
              <p className="text-amber-50/80 text-lg font-medium italic mt-2 leading-relaxed">"{itinerary.seasonalNote}"</p>
            </div>
          </div>
        )}

        {itinerary.localPulse && (
          <div className="overflow-hidden bg-blue-500/10 border-y border-white/5 backdrop-blur-md py-4 rounded-2xl relative">
            <div className="flex animate-marquee whitespace-nowrap gap-20">
              {itinerary.localPulse.map((event, i) => (
                <span key={i} className="flex items-center gap-4 text-blue-300 font-black text-[11px] uppercase tracking-[0.3em]">
                  <TrendingUp className="w-5 h-5 text-green-400" /> {event}
                </span>
              ))}
              {/* Loop Duplicate */}
              {itinerary.localPulse.map((event, i) => (
                <span key={i + 'copy'} className="flex items-center gap-4 text-blue-300 font-black text-[11px] uppercase tracking-[0.3em]">
                  <TrendingUp className="w-5 h-5 text-green-400" /> {event}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <main className="max-w-7xl mx-auto space-y-20">
        
        {/* ✈️ DEPARTURE CARD */}
        <section className="bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-3">
          <div className="p-10 lg:col-span-1 flex flex-col justify-center border-r border-white/5">
            <span className="text-blue-400 font-black text-[10px] tracking-widest uppercase mb-4 flex items-center gap-2">
                <Navigation className="w-3 h-3" /> Initial Transit
            </span>
            <h3 className="text-4xl font-black mb-8 leading-tight tracking-tighter">
              {itinerary.initialLogistics.from} <br/>
              <span className="text-white/20 text-2xl font-light">➔</span> {itinerary.initialLogistics.to}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-white/30 text-[9px] font-bold uppercase mb-1">Method</p>
                <p className="font-black text-xs uppercase text-blue-400">{itinerary.initialLogistics.mode}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-white/30 text-[9px] font-bold uppercase mb-1">Dist.</p>
                <p className="font-black text-xs text-green-400 uppercase">{itinerary.initialLogistics.distance}</p>
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
                  <div className="w-16 h-16 bg-blue-600 rounded-3xl flex flex-col items-center justify-center shadow-lg shadow-blue-900/40">
                    <span className="text-[10px] font-black uppercase opacity-60">Day</span>
                    <span className="text-3xl font-black leading-none">{dayIdx + 1}</span>
                  </div>
                  <div>
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">{day.date}</p>
                    <h4 className="text-4xl font-black tracking-tighter">{day.cityLocation}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-5 bg-white/5 px-6 py-4 rounded-3xl border border-white/10 shadow-inner">
                   <span className="text-4xl">{day.weather?.icon || "🌤️"}</span>
                   <div className="text-right">
                     <p className="text-2xl font-black tracking-tighter">{day.weather?.temp}</p>
                     <p className="text-[9px] font-black uppercase text-white/40 tracking-widest">{day.weather?.condition}</p>
                   </div>
                </div>
              </div>

              <div className="flex flex-col xl:flex-row">
                <div className="flex-[2.5] p-8 md:p-14 space-y-32 border-r border-white/5">
                  {day.places?.map((place, pIdx) => {
                    const traffic = getTrafficDetails(place.trafficStatus);
                    const mapOrigin = pIdx === 0 
                        ? (dayIdx === 0 ? itinerary.arrivalLogistics.from : "Hotel in " + day.cityLocation) 
                        : day.places[pIdx - 1].name;

                    return (
                      <div key={pIdx} className="group relative">
                        <div className="flex flex-col md:flex-row gap-12">
                          
                          {/* 🕒 TIME SECTION - FIXED WIDTH TO PREVENT OVERLAP */}
                          <div className="md:w-60 shrink-0 flex flex-col">
                             <div className="flex items-center gap-2 text-blue-400 mb-2">
                                <Clock className="w-4 h-4 animate-pulse" />
                                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Arrival</span>
                             </div>
                             {/* text-wrap-normal and leading-tight handles long time descriptions */}
                             <p className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                                {place.time}
                             </p>
                             
                             <div className={`inline-flex items-center self-start gap-2 mt-4 px-3 py-1.5 rounded-xl text-[9px] font-black ${traffic.bg} ${traffic.color} border border-white/5 shadow-lg`}>
                               <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                               {traffic.label} TRAFFIC
                             </div>
                             
                             {/* Individual Distance Badge */}
                             <div className="mt-4 bg-white/5 border border-white/10 rounded-xl px-4 py-2 self-start">
                                <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest mb-1">Route</p>
                                <p className="text-[10px] font-black text-green-400 whitespace-nowrap">
                                  🚗 {pIdx === 0 && dayIdx === 0 ? itinerary.arrivalLogistics.distance : (place.distanceFromPrevious || 'Local')}
                                </p>
                             </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h5 className="text-4xl font-black text-white mb-6 tracking-tight leading-tight group-hover:text-blue-300 transition-all break-words">
                              {place.name}
                            </h5>
                            <p className="text-white/60 mb-8 leading-relaxed italic text-lg border-l-2 border-blue-500/30 pl-6 py-1">
                              {place.description}
                            </p>
                            
                            <div className="rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl h-80 transition-all hover:border-blue-500/30">
                              <MapComponent origin={mapOrigin} destination={place.name} />
                            </div>
                            
                            {place.alternativePlace && (
                              <div className="mt-12 bg-white/5 border border-white/10 p-8 rounded-[2.5rem] shadow-xl group/alt transition-all hover:bg-slate-900/50">
                                <p className="text-yellow-500 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <RefreshCw className="w-3 h-3" /> Smart Swap Destination
                                </p>
                                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                                  <p className="text-xl font-bold text-white/90 italic">"{place.alternativePlace}"</p>
                                  <button onClick={() => onSwitchPlan(day.dayNumber, place.name, place.alternativePlace)} className="bg-white text-black px-10 py-5 rounded-[1.5rem] font-black text-[10px] uppercase shadow-lg hover:bg-green-400 active:scale-95 transition-all">Swap Plan</button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <aside className="flex-1 bg-white/5 p-12">
                   <h6 className="text-xs font-black text-white/40 uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
                      <Wind className="w-5 h-5 text-blue-400" /> Daily Dose
                   </h6>
                   <div className="space-y-12">
                     {['recipe', 'movie', 'game'].map((item) => (
                       <div key={item} className="group/dose cursor-default">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 shadow-xl group-hover/dose:scale-110 transition-transform">
                                {item === 'recipe' ? <Utensils className="w-5 h-5 text-orange-400" /> : item === 'movie' ? <Film className="w-5 h-5 text-blue-400" /> : <Gamepad2 className="w-5 h-5 text-emerald-400" />}
                            </div>
                            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">{item}</span>
                         </div>
                         <p className="text-lg font-bold text-white/90 group-hover:text-white transition-colors">{day.dailyDose?.[item] || '...'}</p>
                       </div>
                     ))}
                   </div>
                </aside>
              </div>
            </div>
          ))}
        </div>

        {/* --- PHASE 10: FINANCIAL BREAKDOWN --- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white/5 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 p-12 shadow-2xl">
            <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-6">
               <Wallet className="text-emerald-400 w-8 h-8" />
               <h3 className="text-3xl font-black tracking-tight italic">Financial Logic</h3>
            </div>
            <div className="space-y-4">
              {itinerary.budgetAnalysis?.breakdown && Object.entries(itinerary.budgetAnalysis.breakdown).map(([key, val]) => (
                <div key={key} className="flex justify-between items-center bg-white/5 p-5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                   <span className="capitalize font-black text-white/40 text-[10px] tracking-widest">{key}</span>
                   <span className="font-bold text-lg">{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-600/20 to-blue-600/20 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 p-12 shadow-2xl flex flex-col justify-center text-center items-center">
             <div className="bg-white/10 p-6 rounded-full mb-8 shadow-inner"><Users className="w-12 h-12 text-blue-400" /></div>
             <p className="text-blue-300 font-black text-[11px] uppercase tracking-[0.4em] mb-4">Investment Per Head</p>
             <h4 className="text-6xl md:text-7xl font-black tracking-tighter mb-4">{itinerary.budgetAnalysis?.perPerson}</h4>
             <p className="text-white/30 text-sm max-w-[280px] leading-relaxed italic">
               Estimated allocation based on a party size of {itinerary.travelers || '...'} travelers.
             </p>
          </div>
        </section>

        {/* 💰 FINAL BUDGET FOOTER */}
        <footer className="text-center py-40 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-emerald-500/10 to-blue-600/10 blur-[140px] rounded-full animate-pulse"></div>
          <div className="relative inline-block bg-slate-950/60 backdrop-blur-3xl border border-white/10 px-24 py-12 rounded-[4rem] shadow-2xl group">
            <p className="text-white/30 text-[11px] font-medium uppercase tracking-[0.7em] mb-6">Total Trip Valuation</p>
            <p className="text-3xl md:text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white/80 to-white/20 drop-shadow-2xl italic uppercase">
              {renderBudget(itinerary.estimatedTotalCost)}
            </p>
            <div className="mt-8 flex items-center justify-center gap-3 text-[10px] font-bold text-emerald-400/60 tracking-[0.3em] uppercase">
              <CheckCircle2 className="w-3 h-3 animate-pulse" /> AI Verified Sanchaara Accuracy
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}