import { useState } from 'react';
import { generateItinerary } from '../services/gemini';
import { Sparkles, Map } from 'lucide-react';

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
      alert("Return date cannot be before departure date!");
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
      
      if (data.error) {
        // This will now catch the "India-only" geofence error from the backend
        alert(data.error);
      } else {
        onItinerary(data, submissionData); 
      }
    } catch (err) {
      const errorMsg = err.message || "Sanchaara AI is navigating a heavy route. Please try again in 10 seconds.";
      alert(errorMsg);
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
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-2xl border border-white/20 shadow-2xl rounded-[2.5rem] p-10 text-white space-y-8">
        
        {/* Row 1: Route */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-60 text-emerald-400">Departure From</label>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-emerald-400 outline-none transition-all placeholder:text-white/20 text-lg"
              placeholder="e.g. Jaipur, Mumbai, Kochi"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-60 text-emerald-400">Anywhere in India</label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-emerald-400 outline-none transition-all placeholder:text-white/20 text-lg"
              placeholder="e.g. Manali, Goa, Munnar, Leh"
              required
            />
          </div>
        </div>

        {/* Row 2: Calendar Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
             <label className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-60 text-blue-400">Starting-Date</label>
             <input 
               type="date" 
               min={today}
               value={formData.startDate} 
               onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
               className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none text-white cursor-pointer hover:bg-white/20 transition-all shadow-inner" 
               required 
             />
          </div>
          <div className="flex flex-col gap-2">
             <label className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-60 text-blue-400">Ending-Date</label>
             <input 
               type="date" 
               min={formData.startDate || today}
               value={formData.endDate} 
               onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
               className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none text-white cursor-pointer hover:bg-white/20 transition-all shadow-inner" 
               required 
             />
          </div>
        </div>

        {/* Row 3: Travelers & Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-60">Number of Explorers</label>
            <input
              type="number"
              value={formData.travelers}
              onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
              placeholder="Total People"
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none placeholder:text-white/20 text-lg"
              min="1"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-60">Custom Budget (₹)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="Total for group"
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none placeholder:text-white/20 text-lg font-mono"
              required
            />
          </div>
        </div>

        {/* Row 4: Interests */}
        <div className="space-y-4">
          <p className="text-center text-[10px] font-black uppercase tracking-[0.4em] opacity-40">Optional: Tailor the Experience</p>
          <div className="flex flex-wrap justify-center gap-3">
            {interestOptions.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => handleInterestToggle(interest)}
                className={`px-5 py-2 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest ${
                  formData.interests.includes(interest) 
                  ? 'bg-emerald-500 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)] scale-105' 
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                {interest}
              </button>
            ))}
          </div>
        </div>

<button
  type="submit"
  disabled={loading}
  className="group relative w-full overflow-hidden rounded-3xl p-[2px] transition-all duration-300 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-70"
>
  {/* The Animated Gradient Border/Background */}
  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-blue-500 to-indigo-600 animate-gradient-xy"></div>
  
  {/* The Button Content */}
  <div className="relative flex items-center justify-center gap-3 bg-slate-900/90 hover:bg-transparent transition-colors duration-300 py-5 rounded-[calc(1.5rem-2px)]">
    {loading ? (
      <>
        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
        <span className="font-black text-lg uppercase tracking-[0.2em] text-white">
          Mapping Odyssey...
        </span>
      </>
    ) : (
      <>
        <Map className="w-5 h-5 text-emerald-400 group-hover:text-white transition-colors" />
        <span className="font-black text-lg uppercase tracking-[0.2em] text-white">
          Initiate Smart Journey
        </span>
        <Sparkles className="w-5 h-5 text-indigo-400 group-hover:animate-pulse group-hover:text-white transition-colors" />
      </>
    )}
  </div>
  
  {/* The Glowing Aura behind the button */}
  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-50 transition-opacity duration-500"></div>
</button>
      </form>
    </div>
  );
}