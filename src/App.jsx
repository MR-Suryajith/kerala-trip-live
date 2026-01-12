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
  const [lastFormData, setLastFormData] = useState(null);

  // Function to handle the initial itinerary generation from TripForm
  const handleGenerate = (data, formData) => {
    setItinerary(data);
    setLastFormData(formData);
  };

  // Phase 3: Function to switch a specific place with its alternative
  const handleSwitchPlan = async (dayNumber, placeName, alternativeName) => {
    if (!lastFormData) return;

    setLoading(true);
    try {
      // Send the original form data + a special instruction to the AI
      const updatedRequest = {
        ...lastFormData,
        specialInstruction: `In the previous itinerary for Day ${dayNumber}, please swap "${placeName}" with the alternative "${alternativeName}". Update the route and travel times to make sense with this change.`
      };

      const data = await generateItinerary(updatedRequest);
      setItinerary(data);
    } catch (err) {
      alert("The AI is busy navigating the backwaters. Please try switching again in a moment.");
      console.error("Switch Plan Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* 1. Global Loading Overlay */}
      {loading && <LoadingScreen />}

      {/* 2. Interactive Particles (Behind everything) */}
      <InteractiveBg />
      
      {/* 3. Gradient Overlay for readability */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 via-transparent to-black/60 z-[-1]"></div>

      {/* 4. DUAL-MODE CHATBOT (Prop passed to detect if trip is generated) */}
      <ChatBot itinerary={itinerary} />

      <div className="py-12 px-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black text-white drop-shadow-2xl mb-2">
             KeralaLive <span className="text-green-400">Smart</span> Planner 
          </h1>
          <p className="text-xl text-white/90 font-medium drop-shadow-md uppercase tracking-[0.2em] text-xs sm:text-sm">
              Seasonal Intelligence • Interactive Planning • AI Support
          </p>
        </div>

        {/* Main Content: Form or Itinerary */}
        <div className="transition-all duration-500">
            {!itinerary ? (
              <TripForm 
                onItinerary={handleGenerate} 
                onLoading={setLoading} 
              />
            ) : (
              <ItineraryDisplay 
                itinerary={itinerary} 
                onEdit={() => setItinerary(null)} 
                onSwitchPlan={handleSwitchPlan} 
              />
            )}
        </div>
      </div>
    </div>
  );
}

export default App;