import { useState } from 'react';
import { generateItinerary } from '../services/gemini';
import { Sparkles, Map, Users, Wallet, Calendar, Compass, Navigation } from 'lucide-react';

const interestOptions = [
  'Beach', 'Backwater', 'Hill Station', 'Temple', 'Wildlife', 
  'Ayurveda', 'Houseboat', 'Adventure', 'Photography', 'Culture', 
  'Foodie', 'Trekking', 'Shopping', 'History', 'Wellness', 'Water Sports'
];

/**
 * TripForm Component: The core input interface for SANCHAARA AI.
 * Designed with a high-end Glassmorphism aesthetic and responsive layouts.
 */
export default function TripForm({ onItinerary, onLoading }) {
  // --- STATE MANAGEMENT ---
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

  // Helper to ensure users cannot select past dates
  const today = new Date().toISOString().split('T')[0];

  /**
   * handleSubmit:
   * Validates dates, calculates trip duration, and initiates the AI generation sequence.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Calculate duration logic
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Basic date validation
    if (end < start) {
      alert("Error: Return date must be after the departure date.");
      return;
    }

    const submissionData = {
        ...formData,
        days: diffDays
    };

    setLoading(true);
    onLoading(true);
    
    try {
      const data = await generateItinerary(submissionData);
      
      // Check if backend returned a geofencing error (India-only rule)
      if (data.error) {
        alert(data.error);
      } else {
        // Success: Send data and form context to App.jsx
        onItinerary(data, submissionData); 
      }
    } catch (err) {
      const errorMsg = err.message || "Neural servers are busy. Please try again in 10 seconds.";
      alert(errorMsg);
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  /**
   * handleInterestToggle:
   * Manages the selection of optional interest chips with a toggle mechanism.
   */
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
      {/* --- Main Glassmorphism Form Container --- */}
      <form 
        onSubmit={handleSubmit} 
        className="relative overflow-hidden bg-white/10 backdrop-blur-2xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.3)] rounded-[2rem] md:rounded-[3rem] p-6 md:p-12 text-white space-y-10 transition-all duration-500 hover:border-white/30"
      >
        
        

        {/* --- ROW 1: CORE ROUTE (Responsive Grid) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="flex flex-col gap-3 group">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] ml-2 opacity-60 text-emerald-400 group-focus-within:opacity-100 transition-opacity">
              <Navigation className="w-3 h-3" /> Departure Point
            </label>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 outline-none transition-all placeholder:text-white/20 text-base md:text-lg font-medium"
              placeholder="e.g. Jaipur, Rajasthan"
              required
            />
          </div>
          <div className="flex flex-col gap-3 group">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] ml-2 opacity-60 text-emerald-400 group-focus-within:opacity-100 transition-opacity">
              <Map className="w-3 h-3" /> Anywhere in India
            </label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-emerald-500/50 focus:bg-white/10 outline-none transition-all placeholder:text-white/20 text-base md:text-lg font-medium"
              placeholder="e.g. Munnar, Kerala"
              required
            />
          </div>
        </div>

        {/* --- ROW 2: CALENDAR SCHEDULING (Responsive Grid) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="flex flex-col gap-3 group">
             <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] ml-2 opacity-60 text-blue-400 group-focus-within:opacity-100 transition-opacity">
                <Calendar className="w-3 h-3" /> Journey Start
             </label>
             <input 
               type="date" 
               min={today}
               value={formData.startDate} 
               onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
               className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none text-white transition-all shadow-inner cursor-pointer hover:bg-white/10" 
               required 
             />
          </div>
          <div className="flex flex-col gap-3 group">
             <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] ml-2 opacity-60 text-blue-400 group-focus-within:opacity-100 transition-opacity">
                <Calendar className="w-3 h-3" /> Journey End
             </label>
             <input 
               type="date" 
               min={formData.startDate || today}
               value={formData.endDate} 
               onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
               className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none text-white transition-all shadow-inner cursor-pointer hover:bg-white/10" 
               required 
             />
          </div>
        </div>

        {/* --- ROW 3: LOGISTICS (Travelers & Budget) --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="flex flex-col gap-3 group">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] ml-2 opacity-60 group-focus-within:opacity-100 transition-opacity">
                <Users className="w-3 h-3" /> Number of Explorers
            </label>
            <input
              type="number"
              value={formData.travelers}
              onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
              placeholder="Total People"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none placeholder:text-white/20 text-base md:text-lg"
              min="1"
              required
            />
          </div>
          <div className="flex flex-col gap-3 group">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] ml-2 opacity-60 group-focus-within:opacity-100 transition-opacity">
                <Wallet className="w-3 h-3" /> Custom Budget (₹)
            </label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="Total for group"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none placeholder:text-white/20 text-base md:text-lg font-mono"
              required
            />
          </div>
        </div>

        {/* --- ROW 4: PERSONALIZATION (Optional Interests) --- */}
        <div className="space-y-6">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.5em] opacity-30 italic">
            Tailor the Neural Experience (Optional)
          </p>
          <div className="flex flex-wrap justify-center gap-2 md:gap-3 max-w-3xl mx-auto">
            {interestOptions.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => handleInterestToggle(interest)}
                className={`px-4 md:px-6 py-2 rounded-full border transition-all text-[8px] md:text-[10px] font-black uppercase tracking-widest ${
                  formData.interests.includes(interest) 
                  ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.3)] scale-105 text-white' 
                  : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10 hover:text-white'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

        {/* --- NEURAL GLOW SUBMIT BUTTON --- */}
        <div className="pt-4">
            <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] p-[2px] transition-all duration-500 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
            >
            {/* Moving Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 animate-gradient-xy"></div>
            
            {/* Glass Button Core */}
            <div className="relative flex items-center justify-center gap-4 bg-slate-900/90 group-hover:bg-transparent transition-colors duration-500 py-6 rounded-[calc(1.5rem-2px)] md:rounded-[calc(2.5rem-2px)]">
                {loading ? (
                <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-black text-lg md:text-xl uppercase tracking-[0.3em] text-white">
                        Mapping Indian Odyssey...
                    </span>
                </>
                ) : (
                <>
                    <Map className="w-6 h-6 text-emerald-400 group-hover:text-white transition-colors duration-500" />
                    <span className="font-black text-lg md:text-xl uppercase tracking-[0.3em] text-white">
                        Initiate Smart Journey
                    </span>
                    <Sparkles className="w-6 h-6 text-indigo-400 group-hover:animate-pulse group-hover:text-white transition-colors duration-500" />
                </>
                )}
            </div>
            
            {/* Glowing Aura Effect */}
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none"></div>
            </button>
        </div>

      </form>
    </div>
  );
}