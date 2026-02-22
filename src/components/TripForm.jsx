/**
 * TripForm.jsx
 *
 * @description  Multi-step trip planning form. Collects user preferences
 *               including origin, destination, dates, budget, transport mode,
 *               and interests. Submits data to the Gemini API for itinerary
 *               generation.
 */

import { useState } from 'react';
import { generateItinerary } from '../services/gemini';
import {
  Sparkles,
  Map,
  Users,
  Wallet,
  Calendar,
  Navigation,
  Loader2,
  Compass,
  CheckCircle2
} from 'lucide-react';

const interestOptions = [
  'Beach', 'Backwater', 'Hill Station', 'Temple', 'Wildlife',
  'Ayurveda', 'Houseboat', 'Adventure', 'Photography', 'Culture',
  'Foodie', 'Trekking', 'Shopping', 'History', 'Wellness', 'Water Sports'
];

// Shared translucent input classes
const inputBase = "w-full bg-transparent border border-white/10 hover:border-white/15 focus:border-emerald-500/40 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none transition-all duration-300 text-white text-sm md:text-base font-medium placeholder:text-white/20 focus:shadow-[0_0_20px_rgba(16,185,129,0.06)] backdrop-blur-sm";

export default function TripForm({ onItinerary, onLoading }) {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    travelers: '',
    budget: 'comfort',
    customBudget: '',
    transportMode: '',
    interests: []
  });

  const [loading, setLoading] = useState(false);

  // Fix #4: Use local timezone date (e.g. IST) instead of UTC toISOString()
  // so users can't select "yesterday" if they log in at 2 AM in India.
  const today = new Date().toLocaleDateString('en-CA'); // 'en-CA' forces YYYY-MM-DD format locally

  const handleSubmit = async (e) => {
    e.preventDefault();
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (end < start) {
      alert("Error: Return date must be after the departure date.");
      return;
    }

    const submissionData = { ...formData, days: diffDays };
    setLoading(true);
    onLoading(true);

    try {
      const data = await generateItinerary(submissionData);
      if (data.error) {
        alert(data.error);
      } else {
        onItinerary(data, submissionData);
      }
    } catch (err) {
      alert(err.message || "Neural servers are busy. Please try again.");
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-2 sm:px-4">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-2xl rounded-[2rem] md:rounded-[3rem] p-5 md:p-12 text-white space-y-6 md:space-y-10 transition-all duration-500"
      >

        {/* --- ROW 1: CORE ROUTE --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] ml-1 text-emerald-400/80">
              <Navigation className="w-3 h-3" /> Departure Point
            </label>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className={inputBase}
              placeholder="e.g. Delhi"
              required
            />
          </div>
          <div className="flex flex-col gap-2.5">
            <label className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] ml-1 text-emerald-400/80">
              <Map className="w-3 h-3" /> Anywhere in India
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className={inputBase}
              placeholder="e.g. Munnar"
              required
            />
          </div>
        </div>

        {/* --- ROW 2: CALENDAR --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
          <div className="flex flex-col gap-2.5">
             <label className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] ml-1 text-blue-400/80">
                <Calendar className="w-3 h-3" /> Starting Date
             </label>
             <input
               type="date"
               min={today}
               value={formData.startDate}
               onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
               className={`${inputBase} cursor-pointer`}
               required
             />
          </div>
          <div className="flex flex-col gap-2.5">
             <label className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] ml-1 text-blue-400/80">
                <Calendar className="w-3 h-3" /> Ending Date
             </label>
             <input
               type="date"
               min={formData.startDate || today}
               value={formData.endDate}
               onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
               className={`${inputBase} cursor-pointer`}
               required
             />
          </div>
        </div>

        {/* --- ROW 3: TRAVELERS --- */}
        <div className="flex flex-col gap-2.5">
          <label className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] ml-1 text-white/50">
              <Users className="w-3 h-3" /> Number of People
          </label>
          <input
            type="number"
            value={formData.travelers}
            onChange={(e) => setFormData({ ...formData, travelers: Math.min(50, Math.max(1, parseInt(e.target.value) || 1)) })}
            placeholder="Total People"
            className={inputBase}
            min="1"
            max="50"
            required
          />
        </div>

        {/* --- ROW 4: TRAVEL STYLE --- */}
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] ml-1 text-emerald-400/80">
              <Wallet className="w-3 h-3" /> Travel Style
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3">
            {[
              { id: 'budget', icon: <Wallet className="w-4 h-4 md:w-5 md:h-5" />, label: 'Budget', desc: 'Hostels & street food', hint: '₹800–1.5K/day' },
              { id: 'comfort', icon: <Compass className="w-4 h-4 md:w-5 md:h-5" />, label: 'Comfort', desc: 'Hotels & restaurants', hint: '₹2K–4K/day' },
              { id: 'luxury', icon: <Sparkles className="w-4 h-4 md:w-5 md:h-5" />, label: 'Luxury', desc: 'Resorts & fine dining', hint: '₹6K+/day' },
              { id: 'custom', icon: <Navigation className="w-4 h-4 md:w-5 md:h-5" />, label: 'Custom', desc: 'Set your own budget', hint: 'You decide' },
            ].map(tier => (
              <button
                key={tier.id}
                type="button"
                onClick={() => setFormData({ ...formData, budget: tier.id, customBudget: tier.id === 'custom' ? formData.customBudget : '' })}
                className={`relative flex flex-col items-center gap-1.5 py-3.5 md:py-5 rounded-xl md:rounded-2xl border transition-all duration-300 active:scale-[0.97] overflow-hidden ${
                  formData.budget === tier.id
                    ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.08)]'
                    : 'bg-transparent border-white/10 hover:bg-white/[0.03] hover:border-white/20'
                }`}
              >
                <span className={`transition-colors ${formData.budget === tier.id ? 'text-emerald-400' : 'text-white/30'}`}>{tier.icon}</span>
                <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-wider transition-colors ${
                  formData.budget === tier.id ? 'text-emerald-400' : 'text-white/50'
                }`}>{tier.label}</span>
                <span className="text-[7px] md:text-[8px] text-white/20 font-medium hidden sm:block">{tier.desc}</span>
                <span className={`text-[8px] font-bold transition-colors ${
                  formData.budget === tier.id ? 'text-emerald-400/50' : 'text-white/15'
                }`}>{tier.hint}</span>
              </button>
            ))}
          </div>

          {/* Custom budget input - slides in when "Custom" is selected */}
          {formData.budget === 'custom' && (
            <div className="mt-1">
              <input
                type="number"
                value={formData.customBudget || ''}
                onChange={(e) => setFormData({ ...formData, customBudget: e.target.value })}
                placeholder="Enter total budget in ₹ (e.g. 50000)"
                className={inputBase}
                min="100"
                required
              />
            </div>
          )}
        </div>

        {/* --- ROW 3.5: TRANSPORT MODE --- */}
        <div className="flex flex-col gap-2.5 w-full">
             <label className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em] ml-1 text-indigo-400/80">
                <Navigation className="w-3 h-3" /> Global Transit Mode (Optional)
             </label>
             <select
               value={formData.transportMode}
               onChange={(e) => setFormData({ ...formData, transportMode: e.target.value })}
               className={`${inputBase} appearance-none cursor-pointer`}
               style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.3)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center' }}
             >
               <option value="" className="bg-[#0c1425] text-white">Any Mode (Optimal)</option>
               <option value="Flight" className="bg-[#0c1425] text-white">Flight</option>
               <option value="Train" className="bg-[#0c1425] text-white">Train</option>
               <option value="Bus" className="bg-[#0c1425] text-white">Bus</option>
               <option value="Car" className="bg-[#0c1425] text-white">Private Car</option>
             </select>
        </div>

        {/* --- ROW 4: INTERESTS --- */}
        <div className="space-y-4">
          <p className="text-center text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-white/30 italic">
            Tailor the Experience (Optional)
          </p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-w-3xl mx-auto">
            {interestOptions.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => handleInterestToggle(interest)}
                className={`px-3 md:px-6 py-1.5 md:py-2 rounded-full border transition-all duration-300 text-[8px] md:text-[10px] font-black uppercase tracking-widest ${
                  formData.interests.includes(interest)
                  ? 'bg-emerald-500/20 border-emerald-400/50 shadow-lg shadow-emerald-500/10 scale-105 text-emerald-400'
                  : 'bg-transparent border-white/10 text-white/30 hover:bg-white/5 hover:text-white/50 hover:border-white/20'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* --- NEURAL ODYSSEY BUTTON --- */}
        <div className="pt-6 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 rounded-[2rem] md:rounded-[3rem] blur-xl opacity-20 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] p-[2px] transition-all duration-500 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 animate-gradient-xy"></div>

            <div className="relative flex items-center justify-center gap-4 bg-slate-950/90 hover:bg-slate-900/40 transition-colors duration-500 py-5 md:py-7 rounded-[calc(1.5rem-2px)] md:rounded-[calc(2.5rem-2px)] overflow-hidden">

              <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-shine" />

              {loading ? (
                <div className="flex items-center gap-3">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                  <span className="font-black text-sm md:text-xl uppercase tracking-[0.4em] text-white">
                    Mapping Odyssey...
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Compass className="w-5 h-5 md:w-7 md:h-7 text-emerald-400 group-hover:rotate-90 transition-transform duration-700 ease-in-out" />
                  <span className="font-black text-sm md:text-xl uppercase tracking-[0.3em] text-white drop-shadow-md">
                    Initiate Smart Journey
                  </span>
                  <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-indigo-400 group-hover:scale-125 group-hover:text-white transition-all duration-500 animate-pulse" />
                </div>
              )}
            </div>
          </button>
        </div>

      </form>
    </div>
  );
}