import React, { useState } from 'react';
import { ShieldAlert, Landmark, PlusSquare, Coffee, Bath, Navigation } from 'lucide-react';
import { fetchNearbyEssentials } from '../services/overpass';

export default function SurvivalGrid({ lat, lng }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  const categories = [
    { id: 'hospital', icon: <PlusSquare className="w-5 h-5" />, label: 'Medical' },
    { id: 'atm', icon: <Landmark className="w-5 h-5" />, label: 'ATM/Cash' },
    { id: 'toilets', icon: <Bath className="w-5 h-5" />, label: 'Restroom' },
    { id: 'cafe', icon: <Coffee className="w-5 h-5" />, label: 'Food' }
  ];

  const getNearby = async (type) => {
    if (activeTab === type && data.length > 0) {
        setActiveTab(null);
        setData([]);
        return;
    }
    setLoading(true);
    setActiveTab(type);
    const results = await fetchNearbyEssentials(lat, lng, type);
    setData(results.slice(0, 3)); 
    setLoading(false);
  };

  return (
    <div className="mt-8 bg-white/5 border border-white/10 rounded-[2rem] p-5 md:p-8 backdrop-blur-xl relative overflow-hidden group transition-all hover:bg-white/[0.07]">
      
      {/* Background Watermark */}
      <ShieldAlert className="absolute -right-4 -bottom-4 w-32 h-32 text-white/[0.03] pointer-events-none group-hover:rotate-12 transition-transform duration-700" />

      <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
        <ShieldAlert className="w-3 h-3 animate-pulse" /> Safety & Utility Grid
      </h5>

      {/* Grid of buttons - 2 columns on mobile, 4 on tablet+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 relative z-10">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => getNearby(cat.id)}
            className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all active:scale-95 ${
              activeTab === cat.id 
                ? 'bg-blue-600 border-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.4)]' 
                : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <span className={activeTab === cat.id ? 'text-white' : 'text-blue-400'}>{cat.icon}</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-white/70">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Results List - Vertical Flow */}
      <div className="space-y-3 relative z-10">
        {loading && (
          <div className="text-[9px] text-center py-6 uppercase font-black tracking-[0.4em] text-blue-400/50 animate-pulse">
            Scanning Satellite Data...
          </div>
        )}
        
        {!loading && data.map((item, i) => (
          <div key={i} className="flex justify-between items-center bg-slate-900/50 backdrop-blur-md p-4 rounded-2xl border border-white/5 animate-fade-in group/item hover:border-emerald-500/30 transition-all">
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-white truncate pr-4 uppercase tracking-tighter">{item.name}</p>
                <p className="text-[8px] text-white/30 font-bold uppercase mt-1">Within 2.0 KM Radius</p>
            </div>
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lon}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white p-2.5 rounded-xl transition-all border border-emerald-500/20"
            >
              <Navigation className="w-3 h-3 fill-current" />
            </a>
          </div>
        ))}

        {!loading && activeTab && data.length === 0 && (
          <div className="text-[9px] text-center py-6 text-white/20 uppercase font-black tracking-widest bg-white/5 rounded-2xl border border-dashed border-white/10">
            No {activeTab}s found in immediate vicinity
          </div>
        )}
      </div>

      <p className="mt-6 text-[8px] text-center font-bold text-white/10 uppercase tracking-[0.3em]">
        Verified by OpenStreetMap Data ✓
      </p>
    </div>
  );
}