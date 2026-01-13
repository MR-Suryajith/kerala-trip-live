import React, { useState } from 'react';
import MapComponent from './MapComponent';
import jsPDF from 'jspdf';
import { Download, RefreshCw, Zap, Wind, Utensils, Film, Gamepad2, MapPin, Navigation } from 'lucide-react';

export default function ItineraryDisplay({ itinerary, onEdit, onSwitchPlan }) {
  const [isGenerating, setIsGenerating] = useState(false);

  if (!itinerary || !itinerary.days || !itinerary.initialLogistics) return null;

  // --- 1. TRAFFIC UI LOGIC ---
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

  // --- 2. VECTOR PDF GENERATION LOGIC (Searchable & Sharp) ---
  const exportPDF = () => {
    setIsGenerating(true);
    const doc = new jsPDF();
    let yPos = 20;

    // Header
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('SANCHAARA AI: KERALA TRIP PLAN', 20, 25);
    doc.setFontSize(10);
    doc.text(`Estimated Budget: ${renderBudget(itinerary.estimatedTotalCost)}`, 20, 32);

    yPos = 55;

    // Logistics
    doc.setTextColor(34, 197, 94);
    doc.setFontSize(12);
    doc.text('TRAVEL HUB LOGISTICS', 20, yPos);
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(10);
    doc.text(`From: ${itinerary.initialLogistics.from} | To: ${itinerary.initialLogistics.to} | ${itinerary.initialLogistics.mode}`, 20, yPos + 7);
    yPos += 20;

    // Days Loop
    itinerary.days.forEach((day, dIdx) => {
      if (yPos > 240) { doc.addPage(); yPos = 20; }
      
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos, 170, 10, 'F');
      doc.setTextColor(37, 99, 235);
      doc.text(`DAY ${dIdx + 1}: ${day.cityLocation} (${day.date || ''})`, 25, yPos + 7);
      yPos += 15;

      day.places.forEach((place) => {
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`• ${place.name} (${place.time})`, 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        const splitDesc = doc.splitTextToSize(place.description, 160);
        doc.text(splitDesc, 25, yPos + 5);
        yPos += (splitDesc.length * 5) + 10;
      });
      yPos += 10;
    });

    doc.save(`Itenary-by-Sanchaara.pdf`);
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen w-full p-4 md:p-8 animate-fade-in relative z-10 text-white">
      
      {/* 🧭 GLASS NAVIGATION */}
      <nav className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-12 gap-6 bg-white/5 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
        <div>
          <h2 className="text-4xl font-black tracking-tighter">SANCHAARA <span className="text-blue-400">AI</span></h2>
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/40">Intelligent Concierge</p>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={onEdit} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group" title="New Search">
            <RefreshCw className="w-5 h-5 text-white/60 group-hover:rotate-180 transition-transform duration-500" />
          </button>
          <button 
            onClick={exportPDF}
            disabled={isGenerating}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-900/20 transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isGenerating ? 'Processing...' : 'Export PDF'}
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto space-y-16">
        
        {/* ✈️ DEPARTURE SECTION (Glass style) */}
        <section className="bg-white/5 backdrop-blur-xl rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-3">
          <div className="p-10 lg:col-span-1 flex flex-col justify-center border-r border-white/5">
            <div className="flex items-center gap-2 mb-4">
                <Navigation className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-black text-[10px] tracking-widest uppercase">Transit Log</span>
            </div>
            <h3 className="text-4xl font-black mb-8 leading-tight">
              {itinerary.initialLogistics.from} <br/>
              <span className="text-white/20 text-2xl font-light">➔</span> {itinerary.initialLogistics.to}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-white/30 text-[9px] font-bold uppercase mb-1">Method</p>
                <p className="font-black text-sm uppercase">{itinerary.initialLogistics.mode}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <p className="text-white/30 text-[9px] font-bold uppercase mb-1">Dist.</p>
                <p className="font-black text-sm text-green-400">{itinerary.initialLogistics.distance}</p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-2 h-[350px] opacity-80 hover:opacity-100 transition-opacity">
            <MapComponent origin={itinerary.initialLogistics.from} destination={itinerary.initialLogistics.to} isFlight={true} />
          </div>
        </section>

        {/* 📅 DAILY CARDS */}
        <div className="space-y-24">
          {itinerary.days.map((day, dayIdx) => (
            <div key={dayIdx} className="bg-white/5 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden">
              
              {/* Day Header with Weather */}
              <div className="bg-gradient-to-r from-blue-600/20 to-emerald-500/10 p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-3xl flex flex-col items-center justify-center shadow-lg shadow-blue-900/40">
                    <span className="text-[10px] font-black uppercase opacity-60">Day</span>
                    <span className="text-3xl font-black leading-none">{dayIdx + 1}</span>
                  </div>
                  <div>
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em]">{day.date || 'The Journey'}</p>
                    <h4 className="text-4xl font-black tracking-tighter">{day.cityLocation}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-5 bg-white/5 px-6 py-4 rounded-3xl border border-white/10">
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
                    return (
                      <div key={pIdx} className="group relative">
                        <div className="flex flex-col md:flex-row gap-10">
                          <div className="md:w-32 shrink-0">
                             <div className="flex items-center gap-2 text-white/30 mb-2">
                                <Zap className="w-3 h-3" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Arrival</span>
                             </div>
                             <p className="text-2xl font-black text-white">{place.time}</p>
                             <div className={`inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-xl text-[9px] font-black ${traffic.bg} ${traffic.color} border border-white/5`}>
                               <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                               {traffic.label}
                             </div>
                          </div>
                          <div className="flex-1">
                            <h5 className="text-3xl font-black text-white mb-6 group-hover:text-blue-400 transition-colors tracking-tight">
                              {place.name}
                            </h5>
                            <p className="text-white/60 mb-8 leading-relaxed italic text-lg border-l-2 border-white/10 pl-6 py-2">
                              {place.description}
                            </p>
                            <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl h-72">
                              <MapComponent origin={day.cityLocation} destination={place.name} />
                            </div>
                            
                            {place.alternativePlace && (
                              <div className="mt-8 bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-white/10 transition-all">
                                <div>
                                  <p className="text-[9px] font-black text-yellow-500 uppercase tracking-widest mb-1">Recommended Alternative</p>
                                  <p className="text-lg font-bold text-white/90">{place.alternativePlace}</p>
                                </div>
                                <button 
                                  onClick={() => onSwitchPlan(day.dayNumber, place.name, place.alternativePlace)}
                                  className="bg-white text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-green-400 transition-all active:scale-95"
                                >
                                  Swap Spot
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <aside className="flex-1 bg-white/5 p-12 flex flex-col justify-between">
                  <div>
                    <h6 className="text-xs font-black text-white/40 uppercase tracking-[0.4em] mb-12 flex items-center gap-3">
                        <Wind className="w-5 h-5 text-blue-400" /> Daily Dose
                    </h6>
                    
                    <div className="space-y-12">
                        {[
                        { type: 'recipe', icon: <Utensils />, color: 'bg-orange-500/20 text-orange-400' },
                        { type: 'movie', icon: <Film />, color: 'bg-blue-500/20 text-blue-400' },
                        { type: 'game', icon: <Gamepad2 />, color: 'bg-emerald-500/20 text-emerald-400' }
                        ].map((item) => (
                        <div key={item.type} className="group/dose">
                            <div className="flex items-center gap-4 mb-3">
                                <div className={`p-3 rounded-2xl ${item.color} border border-white/5`}>
                                    {item.icon}
                                </div>
                                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
                                    {item.type}
                                </span>
                            </div>
                            <p className="text-white/80 font-bold text-base pl-1 group-hover/dose:translate-x-2 transition-transform duration-300">
                            {day.dailyDose?.[item.type] || "..."}
                            </p>
                        </div>
                        ))}
                    </div>
                  </div>

                  <div className="mt-20 p-8 bg-black/40 rounded-3xl border border-white/5 shadow-inner">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">
                      💡 Concierge Tip
                    </p>
                    <p className="text-sm text-white/50 leading-relaxed font-medium italic">
                      "{day.weather?.advice || 'Stay hydrated and carry local currency for small entries.'}"
                    </p>
                  </div>
                </aside>
              </div>
            </div>
          ))}
        </div>

        {/* 💰 BUDGET SUMMARY */}
<footer className="text-center py-32 relative">
  {/* The background glow is now larger and multi-colored */}
  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-emerald-500/10 to-blue-600/10 blur-[140px] rounded-full"></div>
  
  <div className="relative inline-block group">
    {/* Animated Border Gradient for extra attraction */}
    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-[3rem] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
    
    <div className="relative bg-slate-900/40 backdrop-blur-3xl border border-white/10 px-16 py-10 rounded-[3rem] shadow-2xl">
      {/* Label: Ultra-premium thin, wide text */}
      <p className="text-white/40 text-[11px] font-medium uppercase tracking-[0.7em] mb-4">
        Total Estimated Investment
      </p>
      
      {/* Budget: Large, Gradient Text */}
      <p className="text-2xl md:text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50 drop-shadow-2xl">
        {renderBudget(itinerary.estimatedTotalCost)}
      </p>
      
      {/* A tiny subtle checkmark or verified tag */}
      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-emerald-400/60 tracking-widest uppercase">
        <span className="w-8 h-[1px] bg-emerald-500/20"></span>
        AI Verified Precision
        <span className="w-8 h-[1px] bg-emerald-500/20"></span>
      </div>
    </div>
  </div>
</footer>
      </main>
    </div>
  );
}