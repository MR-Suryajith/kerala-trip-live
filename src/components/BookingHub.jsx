/**
 * BookingHub.jsx
 *
 * @description  Live booking information modal displaying real-time flight
 *               prices, train schedules, and hotel listings. Purely
 *               informational — links to external platforms for bookings.
 */

import React, { useState, useEffect } from 'react';
import { Plane, TrainFront, Hotel, ExternalLink, Loader2, Clock, X } from 'lucide-react';
import { searchFlights, searchHotels, searchTrains } from '../services/bookingApi';

export default function BookingHub({ logistics, destination, startDate, travelers, onClose }) {
  const [activeTab, setActiveTab] = useState(null);
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [trains, setTrains] = useState([]);
  const [loading, setLoading] = useState(false);

  const mode = logistics?.mode?.toLowerCase() || "";
  const isFlight = mode.includes("flight");
  const isTrain = mode.includes("train");

  // Auto-select the first relevant tab
  useEffect(() => {
    if (isFlight) setActiveTab("flights");
    else if (isTrain) setActiveTab("trains");
    else setActiveTab("hotels");
  }, [isFlight, isTrain]);

  // Fetch data on tab change — with race condition guard
  useEffect(() => {
    if (!activeTab || !destination) return;
    let aborted = false; // Prevents stale updates when user switches tabs quickly

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fix #1: Flights and Trains must search the transit hub (logistics.to)
        // because local towns (e.g., Munnar) don't have airports/stations.
        // Hotels correctly search the local town (destination).
        const travelHub = logistics?.to || destination;

        if (activeTab === "flights" && flights.length === 0) {
          const result = await searchFlights(logistics?.from, travelHub, startDate, travelers);
          if (!aborted) setFlights(result);
        } else if (activeTab === "hotels" && hotels.length === 0) {
          const result = await searchHotels(destination);
          if (!aborted) setHotels(result);
        } else if (activeTab === "trains" && trains.length === 0) {
          const result = await searchTrains(logistics?.from, travelHub, startDate);
          if (!aborted) setTrains(result);
        }
      } catch (err) { /* Silently fail — empty state handles it */ }
      finally { if (!aborted) setLoading(false); }
    };
    fetchData();

    return () => { aborted = true; }; // Cleanup: mark previous fetch as stale
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const tabs = [
    ...(isFlight ? [{ id: "flights", label: "Flights", icon: Plane, count: flights.length }] : []),
    ...(isTrain ? [{ id: "trains", label: "Trains", icon: TrainFront, count: trains.length }] : []),
    { id: "hotels", label: "Stays", icon: Hotel, count: hotels.length },
  ];

  const currentData = activeTab === "flights" ? flights : activeTab === "trains" ? trains : hotels;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      {/* FULL-SCREEN DARK OVERLAY */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md pointer-events-none"></div>

      {/* MODAL CONTAINER */}
      <div
        className="relative z-10 w-[95vw] max-w-2xl max-h-[80vh] flex flex-col bg-slate-950 border border-slate-800 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── HEADER ─── */}
        <div className="flex items-center justify-between px-8 pt-8 pb-5 border-b border-slate-800/60">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Live Travel Intel</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.25em] mt-1">Powered by Amadeus & Indian Railways</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live</span>
            </span>
            <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* ─── TABS ─── */}
        <div className="flex gap-2 px-8 py-4 border-b border-slate-800/40">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-white text-slate-950 shadow-lg shadow-white/10'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black ${isActive ? 'bg-slate-950 text-white' : 'bg-slate-700 text-slate-300'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ─── CONTENT ─── */}
        <div className="flex-1 overflow-y-auto px-8 py-5 space-y-3">

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-7 h-7 text-slate-500 animate-spin" />
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em]">Fetching live data...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && currentData.length === 0 && (
            <div className="text-center py-20">
              <p className="text-slate-600 text-xs font-bold">No results available for this route.</p>
              <p className="text-slate-700 text-[10px] mt-1">Try a different route or check API configuration.</p>
            </div>
          )}

          {/* ─── FLIGHT CARDS ─── */}
          {!loading && activeTab === "flights" && flights.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-900 hover:bg-slate-800/80 p-5 rounded-2xl border border-slate-800 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                  <Plane className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">{f.airline} <span className="text-slate-500 font-medium">• {f.flightNumber}</span></p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="font-bold text-white/80">{f.departure}</span>
                    <span className="text-slate-600">→</span>
                    <span className="font-bold text-white/80">{f.arrival}</span>
                    <span className="text-slate-700">|</span>
                    <span className="flex items-center gap-1 text-slate-500"><Clock className="w-3 h-3" />{f.duration}</span>
                    {f.stops > 0 && <span className="text-amber-500 font-bold">{f.stops} stop</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-black text-emerald-400">{f.price}</span>
                <a href={f.bookingLink} target="_blank" rel="noreferrer" className="w-9 h-9 bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 rounded-xl flex items-center justify-center transition-all">
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                </a>
              </div>
            </div>
          ))}

          {/* ─── TRAIN CARDS ─── */}
          {!loading && activeTab === "trains" && trains.map((t, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-900 hover:bg-slate-800/80 p-5 rounded-2xl border border-slate-800 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                  <TrainFront className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">{t.name} <span className="text-amber-500/60 font-medium text-xs">#{t.number}</span></p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span className="font-bold text-white/80">{t.departure}</span>
                    <span className="text-slate-600">→</span>
                    <span className="font-bold text-white/80">{t.arrival}</span>
                    <span className="text-slate-700">|</span>
                    <span className="flex items-center gap-1 text-slate-500"><Clock className="w-3 h-3" />{t.duration}</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-slate-500">{Array.isArray(t.classes) ? t.classes.join(", ") : t.classes}</span>
                  </div>
                </div>
              </div>
              <a href={t.bookingLink} target="_blank" rel="noreferrer" className="w-9 h-9 bg-slate-800 hover:bg-amber-600 border border-slate-700 hover:border-amber-500 rounded-xl flex items-center justify-center transition-all flex-shrink-0">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          ))}

          {/* ─── HOTEL CARDS ─── */}
          {!loading && activeTab === "hotels" && hotels.map((h, i) => (
            <div key={i} className="flex items-center justify-between bg-slate-900 hover:bg-slate-800/80 p-5 rounded-2xl border border-slate-800 transition-all group">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
                  <Hotel className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">{h.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{h.distance !== "N/A" ? `${h.distance} from center` : "Near city center"}</p>
                </div>
              </div>
              <a href={h.bookingLink} target="_blank" rel="noreferrer" className="w-9 h-9 bg-slate-800 hover:bg-purple-600 border border-slate-700 hover:border-purple-500 rounded-xl flex items-center justify-center transition-all flex-shrink-0">
                <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              </a>
            </div>
          ))}
        </div>

        {/* ─── FOOTER ─── */}
        <div className="px-8 py-4 border-t border-slate-800/40">
          <p className="text-[9px] text-slate-700 font-bold uppercase tracking-[0.2em] text-center">
            Prices are indicative • Click ↗ to view on official platforms
          </p>
        </div>
      </div>
    </div>
  );
}
