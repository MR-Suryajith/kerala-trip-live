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
    days: '',
    travelers: '',
    budget: '',
    interests: []
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onLoading(true);
    try {
      const data = await generateItinerary(formData);
      onItinerary(data);
    } catch (err) {
      alert("Error generating plan. Please check if the backend is running.");
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
          <input
            type="text"
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-green-400 outline-none transition-all placeholder:text-white/50 text-lg"
            placeholder="Starting Point (e.g. Haryana)"
            required
          />
          <input
            type="text"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-green-400 outline-none transition-all placeholder:text-white/50 text-lg"
            placeholder="Destination (e.g. Munnar, Kerala)"
            required
          />
        </div>

        {/* Row 2: Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <input
            type="number"
            value={formData.days}
            onChange={(e) => setFormData({ ...formData, days: e.target.value })}
            placeholder="Duration (Days)"
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none placeholder:text-white/50 text-lg"
            min="1"
            required
          />
          <input
            type="number"
            value={formData.travelers}
            onChange={(e) => setFormData({ ...formData, travelers: e.target.value })}
            placeholder="Total Travelers"
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none placeholder:text-white/50 text-lg"
            min="1"
            required
          />
          <input
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            placeholder="Total Budget (₹)"
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-6 py-4 outline-none placeholder:text-white/50 text-lg"
            required
          />
        </div>

        {/* Row 3: Interests */}
        <div className="space-y-4">
          <p className="text-center text-sm font-bold uppercase tracking-widest opacity-60">Select Your Interests</p>
          <div className="flex flex-wrap justify-center gap-3">
            {interestOptions.map(interest => (
              <button
                key={interest}
                type="button"
                onClick={() => handleInterestToggle(interest)}
                className={`px-5 py-2 rounded-full border transition-all text-xs font-bold uppercase tracking-tighter ${
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
          className="w-full bg-gradient-to-r from-green-400 to-blue-500 py-5 rounded-2xl font-black text-xl uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-xl disabled:opacity-50"
        >
          {loading ? '🔄 Analysis in progress...' : ' Generate Smart Itinerary'}
        </button>
      </form>
    </div>
  );
}