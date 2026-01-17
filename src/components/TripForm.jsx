import { useState } from 'react';
import { generateItinerary } from '../services/gemini';
import { Sparkles, Map, Users, Wallet, Calendar, Navigation, Loader2 } from 'lucide-react';

const interestOptions = [
  'Beach', 'Backwater', 'Hill Station', 'Temple', 'Wildlife', 
  'Ayurveda', 'Houseboat', 'Adventure', 'Photography', 'Culture', 
  'Foodie', 'Trekking', 'Shopping', 'History', 'Wellness', 'Water Sports'
];

export default function TripForm({ onItinerary, onLoading }) {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    startDate: '',
    endDate: '',
    travelers: '',
    budget: '',
    interests: []
  });
  
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split('T')[0];

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
        className="relative bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-[2rem] md:rounded-[3rem] p-5 md:p-12 text-white space-y-6 md:space-y-10 transition-all duration-500"
      >
        
        {/* --- ROW 1: CORE ROUTE --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-70 text-emerald-400">
              <Navigation className="w-3 h-3" /> Departure Point
            </label>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-white/20 text-sm md:text-lg"
              placeholder="e.g. Delhi"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-70 text-emerald-400">
              <Map className="w-3 h-3" /> Anywhere in India
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all placeholder:text-white/20 text-sm md:text-lg"
              placeholder="e.g. Munnar"
              required
            />
          </div>
        </div>

        {/* --- ROW 2: CALENDAR --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
          <div className="flex flex-col gap-2">
             <label className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-70 text-blue-400">
                <Calendar className="w-3 h-3" /> Journey Start
             </label>
             <input 
               type="date" 
               min={today}
               value={formData.startDate} 
               onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
               className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none text-white transition-all shadow-inner cursor-pointer text-sm" 
               required 
             />
          </div>
          <div className="flex flex-col gap-2">
             <label className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-70 text-blue-400">
                <Calendar className="w-3 h-3" /> Journey End
             </label>
             <input 
               type="date" 
               min={formData.startDate || today}
               value={formData.endDate} 
               onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
               className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none text-white transition-all shadow-inner cursor-pointer text-sm" 
               required 
             />
          </div>
        </div>

        {/* --- ROW 3: LOGISTICS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-70">
                <Users className="w-3 h-3" /> Explorers
            </label>
            <input
              type="number"
              value={formData.travelers}
              onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
              placeholder="Total People"
              className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none placeholder:text-white/20 text-sm md:text-lg"
              min="1"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] ml-2 opacity-70">
                <Wallet className="w-3 h-3" /> Budget (₹)
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="Total Limit"
              className="w-full bg-white/5 border border-white/10 rounded-xl md:rounded-2xl px-4 md:px-6 py-3 md:py-4 outline-none placeholder:text-white/20 text-sm md:text-lg font-mono"
              required
            />
          </div>
        </div>

        {/* --- ROW 4: INTERESTS --- */}
        <div className="space-y-4">
          <p className="text-center text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] opacity-40 italic">
            Tailor the Experience (Optional)
          </p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-w-3xl mx-auto">
            {interestOptions.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => handleInterestToggle(interest)}
                className={`px-3 md:px-6 py-1.5 md:py-2 rounded-full border transition-all text-[8px] md:text-[10px] font-black uppercase tracking-widest ${
                  formData.interests.includes(interest) 
                  ? 'bg-emerald-500 border-emerald-400 shadow-lg scale-105 text-white' 
                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* --- NEURAL GLOW BUTTON --- */}
        <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full overflow-hidden rounded-xl md:rounded-[2.5rem] p-[2px] transition-all duration-500 active:scale-95 disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 animate-gradient-xy"></div>
              <div className="relative flex items-center justify-center gap-3 bg-slate-900/90 py-4 md:py-6 rounded-[calc(0.75rem)] md:rounded-[calc(1.5rem-2px)]">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                      <span className="font-black text-xs md:text-xl uppercase tracking-[0.2em] text-white">Mapping Odyssey...</span>
                    </>
                  ) : (
                    <>
                      <Map className="w-4 h-4 md:w-6 md:h-6 text-emerald-400" />
                      <span className="font-black text-xs md:text-xl uppercase tracking-[0.2em] text-white">Initiate Smart Journey</span>
                      <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-indigo-400" />
                    </>
                  )}
              </div>
            </button>
        </div>

      </form>
    </div>
  );
}