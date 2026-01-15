import React from 'react';
import { Users, Timer, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

export default function CrowdAnalyzer({ analysis }) {
  // Safety check: if backend fails to provide analysis, don't break the UI
  if (!analysis) return null;

  // Logic to determine color based on occupancy percentage
  const getIntensityColor = (level) => {
    if (level > 80) return 'from-red-500 to-orange-500';
    if (level > 50) return 'from-yellow-400 to-orange-400';
    return 'from-emerald-400 to-teal-500';
  };

  const getStatusColor = (level) => {
    if (level > 80) return 'text-red-400 bg-red-400/10 border-red-400/20';
    if (level > 50) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
  };

  return (
    <div className="mt-6 bg-white/5 border border-white/10 rounded-[2rem] p-6 backdrop-blur-md shadow-2xl relative overflow-hidden group">
      
      {/* 1. Header with Status Badge */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">
            Crowd Density Forecast
          </span>
        </div>
        <div className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(analysis.occupancy)} shadow-lg`}>
          {analysis.status}
        </div>
      </div>

      {/* 2. The Visual Heat Bar (Heatmap style) */}
      <div className="relative h-5 bg-black/40 rounded-2xl overflow-hidden mb-6 border border-white/5 p-1 shadow-inner">
        <div 
          className={`h-full rounded-xl bg-gradient-to-r ${getIntensityColor(analysis.occupancy)} transition-all duration-[2500ms] ease-out shadow-[0_0_20px_rgba(0,0,0,0.5)] relative`}
          style={{ width: `${analysis.occupancy}%` }}
        >
          {/* Animated Shimmer/Scan Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
        </div>
      </div>

      {/* 3. Detailed Metrics Grid */}
      <div className="grid grid-cols-2 gap-4">
        {/* Peak Hours Card */}
        <div className="bg-white/5 p-4 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-2 mb-2 opacity-40">
            <Timer className="w-3 h-3" />
            <span className="text-[8px] font-black uppercase tracking-widest">Peak Intensity</span>
          </div>
          <p className="text-[13px] font-black text-white italic tracking-tight">
            {analysis.peakHours}
          </p>
        </div>

        {/* Wait Time Card */}
        <div className="bg-white/5 p-4 rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-2 mb-2 opacity-40">
            {analysis.trend === 'rising' ? (
                <TrendingUp className="w-3 h-3 text-red-400" />
            ) : (
                <TrendingDown className="w-3 h-3 text-emerald-400" />
            )}
            <span className="text-[8px] font-black uppercase tracking-widest">Wait Factor</span>
          </div>
          <p className="text-[13px] font-black text-white italic tracking-tight">
            ~{analysis.waitFactor}
          </p>
        </div>
      </div>

      {/* 4. High Crowd Warning (Conditional) */}
      {analysis.occupancy > 75 && (
        <div className="mt-6 flex items-start gap-4 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl animate-in fade-in zoom-in duration-500">
          <div className="p-2 bg-red-500/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-black text-red-300 uppercase tracking-widest mb-1">Heavy Influx Warning</p>
            <p className="text-[11px] font-medium text-white/60 leading-relaxed italic">
              Expect delays. Sanchaara AI recommends arriving 30 mins prior to opening.
            </p>
          </div>
        </div>
      )}

      {/* Background Decorative Element */}
      <div className="absolute -right-4 -bottom-4 text-white/[0.03] text-6xl font-black pointer-events-none select-none italic">
        LIVE
      </div>
    </div>
  );
}