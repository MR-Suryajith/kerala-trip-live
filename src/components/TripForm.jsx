import { useState } from 'react';
import { generateItinerary } from '../services/gemini';

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

  // Get today's date in YYYY-MM-DD format for date picker constraints
  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Calculate days based on selected dates
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days

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
      // Pass both data and the form context back to App.jsx
      onItinerary(data, submissionData); 
    } catch (err) {
      alert("AI is busy or connection failed. Please try again.");
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
            <label className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-60">Departure From</label>
            <input
              type="text"
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-green-400 outline-none transition-all placeholder:text-white/30 text-lg"
              placeholder="e.g. Delhi"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-60">Traveling To</label>
            <input
              type="text"
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-green-400 outline-none transition-all placeholder:text-white/30 text-lg"
              placeholder="e.g. Munnar, Kerala"
              required
            />
          </div>
        </div>

        {/* Row 2: Phase 3 Calendar Integration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
             <label className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-60">Travel Date</label>
             <input 
               type="date" 
               min={today}
               value={formData.startDate} 
               onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} 
               className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 outline-none text-white appearance-none cursor-pointer hover:bg-white/20 transition-all" 
               required 
             />
          </div>
          <div className="flex flex-col gap-2">
             <label className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-60">Return Date</label>
             <input 
               type="date" 
               min={formData.startDate || today}
               value={formData.endDate} 
               onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} 
               className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 outline-none text-white appearance-none cursor-pointer hover:bg-white/20 transition-all" 
               required 
             />
          </div>
        </div>

        {/* Row 3: Travelers & Budget */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-60">Number of People</label>
            <input
              type="number"
              value={formData.travelers}
              onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
              placeholder="e.g. 2"
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none placeholder:text-white/30 text-lg"
              min="1"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest ml-4 opacity-60">Total Budget (₹)</label>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              placeholder="e.g. 50000"
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none placeholder:text-white/30 text-lg"
              required
            />
          </div>
        </div>

        {/* Row 4: Interests */}
        <div className="space-y-4">
          <p className="text-center text-[10px] font-black uppercase tracking-widest opacity-60">Personalize Your Vibe</p>
          <div className="flex flex-wrap justify-center gap-3">
            {interestOptions.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => handleInterestToggle(interest)}
                className={`px-5 py-2 rounded-full border transition-all text-[10px] font-black uppercase tracking-widest ${
                  formData.interests.includes(interest) 
                  ? 'bg-green-500 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] scale-105' 
                  : 'bg-white/5 border-white/10 hover:bg-white/20'
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
          className="w-full bg-gradient-to-r from-green-400 to-blue-500 py-5 rounded-2xl font-black text-xl uppercase tracking-[0.2em] hover:brightness-110 active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
        >
          {loading ? 'Consulting Gemini...' : 'Generate Smart Journey'}
        </button>
      </form>
    </div>
  );
}