import React, { useState } from 'react';
import { ShieldAlert, Landmark, PlusSquare, Coffee, Bath } from 'lucide-react';
import { fetchNearbyEssentials } from '../services/overpass';

export default function SurvivalGrid({ lat, lng }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  const categories = [
    { id: 'hospital', icon: <PlusSquare />, label: 'Medical' },
    { id: 'atm', icon: <Landmark />, label: 'Cash' },
    { id: 'toilets', icon: <Bath />, label: 'Restroom' },
    { id: 'cafe', icon: <Coffee />, label: 'Food' }
  ];

  const getNearby = async (type) => {
    setLoading(true);
    setActiveTab(type);
    const results = await fetchNearbyEssentials(lat, lng, type);
    setData(results.slice(0, 3)); // Show top 3
    setLoading(false);
  };

  return (
    <div className="mt-8 bg-black/30 border border-white/10 rounded-[2rem] p-6 backdrop-blur-xl">
      <h5 className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
        <ShieldAlert className="w-3 h-3" /> Safety & Utility Grid
      </h5>

      {/* Category Icons */}
      <div className="flex justify-between gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => getNearby(cat.id)}
            className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-2xl border transition-all ${
              activeTab === cat.id ? 'bg-blue-600 border-blue-400 shadow-lg' : 'bg-white/5 border-white/5 hover:bg-white/10'
            }`}
          >
            <span className="text-white/70">{cat.icon}</span>
            <span className="text-[8px] font-black uppercase tracking-widest">{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Results List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-[9px] text-center animate-pulse py-4 uppercase font-bold tracking-widest text-white/30">Scanning OSM Database...</div>
        ) : (
          data.map((item, i) => (
            <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 animate-fade-in">
              <span className="text-[11px] font-bold text-white/80 truncate pr-4">{item.name}</span>
              <a 
                href={`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`}
                target="_blank"
                className="text-[9px] font-black text-emerald-400 uppercase hover:underline shrink-0"
              >
                Find Route →
              </a>
            </div>
          ))
        )}
        {!loading && activeTab && data.length === 0 && (
          <div className="text-[9px] text-center py-4 text-white/20 uppercase font-bold">No {activeTab}s found .</div>
        )}
      </div>
    </div>
  );
}