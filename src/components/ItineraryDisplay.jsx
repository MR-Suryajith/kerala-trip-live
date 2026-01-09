import React from 'react';
import MapComponent from './MapComponent';

export default function ItineraryDisplay({ itinerary, onEdit }) {
  // Safety check: Ensure itinerary and logistics exist
  if (!itinerary || !itinerary.days || !itinerary.initialLogistics) return null;

  // Helper function to safely render the budget if it comes as an object
  const renderBudget = (budget) => {
    if (typeof budget === 'object' && budget !== null) {
      // If it's an object, try to find a value/total property or stringify it
      return `₹${budget.value || budget.total || budget.amount || 'Calculated'}`;
    }
    return budget;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 animate-fade-in pb-20 text-white">
      
      {/* ✈️ TRAVEL HUB: THE JOURNEY TO KERALA */}
      <div className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] p-8 mb-12 border border-white/20 shadow-2xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-500 p-4 rounded-3xl text-3xl shadow-lg animate-pulse">✈️</div>
            <div>
              <h2 className="text-4xl font-black italic">Travel Hub</h2>
              <p className="text-blue-300 font-bold uppercase text-[10px] tracking-[0.3em]">From Home to the Heart of Kerala</p>
            </div>
          </div>
          <button 
            onClick={onEdit} 
            className="bg-white/10 hover:bg-white/20 border border-white/30 px-8 py-3 rounded-full font-black transition-all text-sm"
          >
            🔄 CHANGE TRIP
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
               <span className="absolute -top-2 -right-2 text-[60px] opacity-5 font-black text-white group-hover:opacity-10 transition-opacity">01</span>
               <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Phase 1: Transit</p>
               <h4 className="text-2xl font-black">{itinerary.initialLogistics.from} ➔ {itinerary.initialLogistics.to}</h4>
               <p className="text-sm text-indigo-300 font-bold mt-1">Mode: {itinerary.initialLogistics.mode}</p>
               <div className="flex gap-4 mt-4">
                 <div className="bg-green-500/20 px-4 py-2 rounded-2xl text-green-300 text-xs font-black border border-green-500/20">📏 {itinerary.initialLogistics.distance}</div>
                 <div className="bg-blue-500/20 px-4 py-2 rounded-2xl text-blue-300 text-xs font-black border border-blue-500/20">🕒 {itinerary.initialLogistics.duration}</div>
               </div>
            </div>

            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
               <span className="absolute -top-2 -right-2 text-[60px] opacity-5 font-black text-white group-hover:opacity-10 transition-opacity">02</span>
               <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Phase 2: Arrival Transfer</p>
               <h4 className="text-2xl font-black">{itinerary.arrivalLogistics.from} ➔ {itinerary.arrivalLogistics.to}</h4>
               <p className="text-sm text-blue-300 font-bold mt-1">Cab Service</p>
               <div className="flex gap-4 mt-4">
                 <div className="bg-green-500/20 px-4 py-2 rounded-2xl text-green-300 text-xs font-black border border-green-500/20">📏 {itinerary.arrivalLogistics.distance}</div>
                 <div className="bg-blue-500/20 px-4 py-2 rounded-2xl text-blue-300 text-xs font-black border border-blue-500/20">🕒 {itinerary.arrivalLogistics.duration}</div>
               </div>
            </div>
          </div>

          <MapComponent 
            origin={itinerary.initialLogistics.from} 
            destination={itinerary.initialLogistics.to} 
            isFlight={true} 
          />
        </div>
      </div>

      {/* 🌴 DAILY ITINERARY SECTION */}
      <div className="space-y-16">
        <div className="text-center">
            <h3 className="text-2xl font-black text-green-400 uppercase tracking-[0.2em] drop-shadow-lg">Daily Sightseeing</h3>
        </div>

        {itinerary.days.map((day) => (
          <div key={day.dayNumber} className="bg-white/10 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-white/20">
            
            <div className="flex-1 border-r border-white/5">
              <div className="bg-gradient-to-r from-green-500/60 to-blue-600/60 p-8 text-white backdrop-blur-md">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="bg-black/30 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">DAY {day.dayNumber}</span>
                    <h3 className="text-4xl font-black mt-3">{day.cityLocation}</h3>
                  </div>
                  <div className="bg-white/10 backdrop-blur-xl p-4 rounded-3xl flex items-center gap-4 border border-white/20">
                    <span className="text-5xl">{day.weather.icon}</span> 
                    <div className="text-right">
                      <p className="text-3xl font-black tracking-tighter">{day.weather.temp}</p>
                      <p className="text-[10px] uppercase font-bold opacity-70">{day.weather.condition}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 bg-black/20 p-4 rounded-2xl border-l-4 border-yellow-400 text-sm italic font-medium">
                  "{day.weather.advice}"
                </div>
              </div>

              <div className="p-8 space-y-20">
                {day.places.map((place, idx) => {
                  const mapOrigin = (idx === 0 && day.dayNumber === 1) 
                    ? itinerary.arrivalLogistics.from 
                    : (idx === 0 ? "Hotel in " + day.cityLocation : day.places[idx - 1].name);

                  const trafficIsHigh = place.trafficStatus?.toLowerCase().includes('high');

                  return (
                    <div key={idx} className="relative pl-10 border-l-2 border-dashed border-white/10 last:border-0 pb-2">
                      
                      {/* 🚗 INDIVIDUAL ROUTE BADGE (Every Place) */}
                      <div className="absolute -left-[10px] -top-12 z-20">
                        <div className="bg-green-500/40 backdrop-blur-md border border-green-400/50 px-3 py-1 rounded-full text-[10px] font-black text-white shadow-2xl whitespace-nowrap">
                          🚗 {idx === 0 && day.dayNumber === 1 
                              ? `${itinerary.arrivalLogistics.distance} (${itinerary.arrivalLogistics.duration})` 
                              : `${place.distanceFromPrevious || '0 km'} (${place.travelTimeFromPrevious || 'N/A'})`}
                        </div>
                      </div>

                      <div className="absolute -left-[18px] top-0 bg-yellow-400 text-black w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shadow-lg z-10">
                        {place.rank}
                      </div>

                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-2xl font-black">{place.name}</h4>
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border shadow-sm ${
                          trafficIsHigh ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-green-500/20 text-green-300 border-green-500/30'
                        }`}>
                          🚦 {place.trafficStatus?.toUpperCase() || 'MODERATE'} TRAFFIC
                        </span>
                      </div>

                      <p className="text-blue-300 font-bold text-xs mb-4">⏰ {place.time}</p>
                      <p className="text-white/70 leading-relaxed mb-6 text-sm">{place.description}</p>

                      <MapComponent 
                        origin={mapOrigin} 
                        destination={place.name + ", " + day.cityLocation} 
                        isFlight={false} 
                      />

                      {/* ✅ PLAN B SECTION (Alternative Places) */}
                      {place.alternativePlace && (
                        <div className="mt-8 pt-4 border-t border-white/5">
                          <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-2">
                            🔄 Plan B (Alternative)
                          </p>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
                            <p className="text-blue-200 text-sm font-medium italic leading-relaxed">
                              {place.alternativePlace}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sidebar: Daily Dose */}
            <div className="w-full lg:w-80 bg-white/5 p-10 backdrop-blur-lg border-t lg:border-t-0 lg:border-l border-white/10">
               <h4 className="text-xl font-black mb-8 pb-4 border-b border-white/10 flex items-center gap-2">Daily Dose 🪄</h4>
               <div className="space-y-12">
                 {['recipe', 'movie', 'game'].map((item) => (
                   <div key={item} className="group">
                     <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">{item}</p>
                     <div className="flex items-start gap-4">
                       <span className="text-3xl bg-white/10 p-3 rounded-2xl border border-white/10 shadow-lg group-hover:scale-110 transition-transform">
                        {item === 'recipe' ? '🍲' : item === 'movie' ? '🎬' : '🎮'}
                       </span>
                       <p className="text-sm font-bold text-white/80 group-hover:text-green-400 transition-colors">{day.dailyDose[item]}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Summary - FIXED BUDGET DISPLAY */}
      <div className="mt-16 mb-24 text-center">
        <div className="inline-block bg-white/10 backdrop-blur-2xl px-12 py-6 rounded-[3rem] border border-white/20 shadow-2xl">
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em]">Total Estimated Budget</p>
          <p className="text-4xl font-black mt-2 tracking-tighter text-white drop-shadow-lg">
            {renderBudget(itinerary.estimatedTotalCost)}
          </p>
        </div>
      </div>
    </div>
  );
}