import { useState, useEffect } from 'react';
import TripForm from './components/TripForm';
import ItineraryDisplay from './components/ItineraryDisplay';
import LoadingScreen from './components/LoadingScreen';
import InteractiveBg from './components/InteractiveBg'; 
import ChatBot from './components/ChatBot'; 

// Import the API service for AI communication
import { generateItinerary } from './services/gemini';

/**
 * Main Application Component: SANCHAARA AI
 * Handles global state for itineraries, loading status, and dynamic plan modifications.
 */
function App() {
  // --- STATE MANAGEMENT ---
  
  // Stores the generated itinerary JSON from the backend
  const [itinerary, setItinerary] = useState(null);
  
  // Controls the visibility of the high-end loading screen
  const [loading, setLoading] = useState(false);
  
  // Phase 3: Remembers the last search context (origin, dates, budget, etc.)
  // This is required to allow the AI to "swap" spots while keeping other data the same.
  const [lastFormData, setLastFormData] = useState(null);

  /**
   * handleGenerate:
   * Triggered when the initial TripForm is submitted successfully.
   * @param {Object} data - The JSON itinerary from Gemini
   * @param {Object} formData - The user's search preferences
   */
  const handleGenerate = (data, formData) => {
    setItinerary(data);
    setLastFormData(formData);
  };

  /**
   * handleSwitchPlan (Phase 3 Innovation):
   * Triggered when a user clicks the "Swap Spot" button in ItineraryDisplay.
   * Sends a specific instruction to the AI to replace one location with another.
   */
  const handleSwitchPlan = async (dayNumber, placeName, alternativeName) => {
    // Safety check: ensure we have the context of the original search
    if (!lastFormData) {
        return;
    }

    setLoading(true);
    
    try {
      // Construct the updated request with a high-priority special instruction
      const updatedRequest = {
        ...lastFormData,
        specialInstruction: `URGENT CHANGE: On Day ${dayNumber}, the traveler wants to REPLACE the original spot "${placeName}" with the suggested alternative "${alternativeName}". Please regenerate the itinerary reflecting this change and updating logistics.`
      };

      // Call the Gemini service with the new parameters
      const data = await generateItinerary(updatedRequest);
      
      // Update UI with the new plan and save the new context
      setItinerary(data);
      setLastFormData(updatedRequest); 

    } catch (err) {
      console.error("Critical Switch Plan Error:", err);
      alert("The AI concierge is currently recalculating other routes. Please try swapping again in a few seconds.");
    } finally {
      setLoading(false);
    }
  };

return (
  <div className="relative min-h-screen w-full overflow-x-hidden font-sans selection:bg-emerald-500/30">
    {loading && <LoadingScreen />}
    <InteractiveBg />
    
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/40 via-transparent to-[#020617] z-[-1]"></div>

    <ChatBot itinerary={itinerary} />

    {/* Reduce padding-x for mobile (px-4) */}
    <div className="py-8 md:py-12 px-4 md:px-8 relative z-10">
      
      <header className="text-center mb-8 md:mb-12">
        {/* Title: 3xl for mobile, 6xl for desktop */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white drop-shadow-2xl mb-3 tracking-tight">
           SANCHAARA <span className="text-green-400 font-light italic">AI</span> 
        </h1>
        
        {/* Subtitle: Smaller text and tighter tracking for mobile */}
        <p className="text-[9px] md:text-sm text-white/70 font-medium tracking-[0.1em] md:tracking-[0.3em] uppercase px-2 max-w-2xl mx-auto leading-relaxed">
            Seasonal Intelligence • Dynamic Logistics • AI Concierge
        </p>
        
        <div className="h-[1px] w-16 md:w-24 bg-gradient-to-r from-transparent via-green-500 to-transparent mx-auto mt-6"></div>
      </header>

      <main className="transition-all duration-700 ease-in-out">
          {!itinerary ? (
            <TripForm onItinerary={handleGenerate} onLoading={setLoading} />
          ) : (
            <ItineraryDisplay itinerary={itinerary} onEdit={() => setItinerary(null)} onSwitchPlan={handleSwitchPlan} />
          )}
      </main>
        

        {/* Optional: Footer Watermark */}
        <footer className="mt-20 pb-10 text-center pointer-events-none opacity-20">
            <p className="text-[10px] font-black text-white uppercase tracking-[0.8em]">
                Sanchaara AI
            </p>
        </footer>

      </div>
    </div>
  );
}

export default App;