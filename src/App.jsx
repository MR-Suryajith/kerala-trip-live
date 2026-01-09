import { useState } from 'react';
import TripForm from './components/TripForm';
import ItineraryDisplay from './components/ItineraryDisplay';
import LoadingScreen from './components/LoadingScreen';
// 1. Import the Interactive Background instead of the video
import InteractiveBg from './components/InteractiveBg'; 

function App() {
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Show Loading Screen Overlay */}
      {loading && <LoadingScreen />}

      {/* 2. REPLACED: Video tag removed for the Interactive Particles Background */}
      <InteractiveBg />
      
      {/* 3. Dark/Gradient Overlay to make the text pop against the particles */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-black/20 via-transparent to-black/60 z-[-1]"></div>

      <div className="py-12 px-4 relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-black text-white drop-shadow-2xl mb-2">
             KeralaLive <span className="text-green-400">Smart</span> Planner 
          </h1>
          <p className="text-xl text-white/90 font-medium drop-shadow-md">
            AI-Driven Itineraries with Interactive Insights
          </p>
        </div>

        <div className="transition-all duration-500">
            {!itinerary ? (
            <TripForm onItinerary={setItinerary} onLoading={setLoading} />
            ) : (
            <ItineraryDisplay itinerary={itinerary} onEdit={() => setItinerary(null)} />
            )}
        </div>
      </div>
    </div>
  );
}

export default App;