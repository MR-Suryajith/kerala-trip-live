import { useState } from 'react';
import TripForm from './components/TripForm';
import ItineraryDisplay from './components/ItineraryDisplay';
import LoadingScreen from './components/LoadingScreen';
import InteractiveBg from './components/InteractiveBg'; 
import ChatBot from './components/ChatBot'; 

// Import the API service
import { generateItinerary } from './services/gemini';

function App() {
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Phase 3: Store the last form data to allow context-aware AI interactions
  // This "remembers" your search so swapping/chatbot logic knows the dates/budget
  const [lastFormData, setLastFormData] = useState(null);

  // Function to handle the initial itinerary generation from TripForm
  const handleGenerate = (data, formData) => {
    setItinerary(data);
    setLastFormData(formData); // Saves the origin, destination, dates, budget, etc.
  };

  /**
   * Phase 3: Function to switch a specific place with its alternative
   * When user clicks "Swap", we re-send the original data + a special instruction
   */
  const handleSwitchPlan = async (dayNumber, placeName, alternativeName) => {
    if (!lastFormData) return;

    setLoading(true);
    try {
      // 1. Create the updated request object
      const updatedRequest = {
        ...lastFormData,
        specialInstruction: `URGENT CHANGE: On Day ${dayNumber}, the user wants to REMOVE "${placeName}" and REPLACE it with "${alternativeName}". Please regenerate the itinerary keeping this change in mind and adjusting the route/times.`
      };

      // 2. Call the AI with the specific instruction
      const data = await generateItinerary(updatedRequest);
      
      // 3. Update the UI with the NEW itinerary
      setItinerary(data);
      
      // 4. Update lastFormData so the next "swap" builds on this current plan
      setLastFormData(updatedRequest); 

    } catch (err) {
      alert("The AI concierge is currently busy with other travelers. Please try swapping again in a few seconds.");
      console.error("Switch Plan Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-sans">
      
      {/* 🚀 1. Global Loading Overlay (Always ready to show) */}
      {loading && <LoadingScreen />}

      {/* 🎨 2. Interactive Background Layer (Z-Index -2) */}
      <InteractiveBg />
      
      {/* 🌑 3. Gradient Overlay (Z-Index -1) */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/40 via-transparent to-[#020617] z-[-1]"></div>

      {/* 💬 4. DUAL-MODE CHATBOT (Persistent on all screens) */}
      <ChatBot itinerary={itinerary} />

      <div className="py-12 px-4 relative z-10">
        
        {/* --- Branding Header --- */}
        <header className="text-center mb-12">
          <h1 className="text-6xl font-black text-white drop-shadow-2xl mb-3 tracking-tight">
             SANCHAARA <span className="text-green-400 font-light italic">AI</span> 
          </h1>
          <p className="text-sm sm:text-base text-white/70 font-medium tracking-[0.3em] uppercase">
              Seasonal Intelligence • Dynamic Logistics • AI Concierge
          </p>
          <div className="h-[1px] w-24 bg-green-500/50 mx-auto mt-6"></div>
        </header>

        {/* --- Main Dynamic Content Section --- */}
        <main className="transition-all duration-700 ease-in-out">
            {!itinerary ? (
              // Initial Form Mode
              <TripForm 
                onItinerary={handleGenerate} 
                onLoading={setLoading} 
              />
            ) : (
              // Generated Plan Mode
              <ItineraryDisplay 
                itinerary={itinerary} 
                onEdit={() => setItinerary(null)} 
                onSwitchPlan={handleSwitchPlan} 
              />
            )}
        </main>
      </div>
    </div>
  );
}

export default App;