import { useState } from 'react';
import TripForm from './components/TripForm';
import ItineraryDisplay from './components/ItineraryDisplay';
import LoadingScreen from './components/LoadingScreen';
import InteractiveBg from './components/InteractiveBg'; 

// Import the API service (Make sure this exists in your gemini.js)
import { generateItinerary } from './services/gemini';

function App() {
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Phase 3: Store the last form data to allow dynamic "Plan B" switching
  const [lastFormData, setLastFormData] = useState(null);

  // Function to handle the initial itinerary generation
  const handleGenerate = (data, formData) => {
    setItinerary(data);
    setLastFormData(formData);
  };

  // Phase 3: Function to switch a specific place with its alternative
  const handleSwitchPlan = async (dayNumber, placeName, alternativeName) => {
    setLoading(true);
    try {
      // We send the original form data + a special instruction to the AI
      const updatedRequest = {
        ...lastFormData,
        specialInstruction: `In the previous itinerary for Day ${dayNumber}, the user wants to swap "${placeName}" with the alternative "${alternativeName}". Please update only this part and adjust travel times/distances accordingly.`
      };

      const data = await generateItinerary(updatedRequest);
      setItinerary(data);
    } catch (err) {
      alert("AI is busy. Could not switch to Plan B. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Show Loading Screen Overlay */}
      {loading && <LoadingScreen />}

      {/* Interactive Particles Background */}
      <InteractiveBg />
      
      {/* Dark/Gradient Overlay */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 via-transparent to-black/60 z-[-1]"></div>

      <div className="py-12 px-4 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black text-white drop-shadow-2xl mb-2">
             KeralaLive <span className="text-green-400">Smart</span> Planner 
          </h1>
          <p className="text-xl text-white/90 font-medium drop-shadow-md">
              Seasonal Intelligence & Dynamic Planning
          </p>
        </div>

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
                onSwitchPlan={handleSwitchPlan} // New prop for Phase 3
              />
            )}
        </div>
      </div>
    </div>
  );
}

export default App;