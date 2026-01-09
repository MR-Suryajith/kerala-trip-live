import React from 'react';

export default function MapComponent({ origin, destination, isFlight = false }) {
  // 1. If we only have one location (fallback), or both locations
  const start = encodeURIComponent(origin);
  const end = encodeURIComponent(destination);
  
  // 2. Determine Zoom: 
  // Country-wide zoom (5) for flights (e.g., Delhi to Kochi)
  // City-wide zoom (12-14) for local car routes (e.g., Kochi to Munnar)
  const zoom = isFlight ? 5 : 12;

  // 3. Construct the Google Maps Directions URL (Free Embed Version)
  // saddr = source address | daddr = destination address
  const mapUrl = `https://maps.google.com/maps?saddr=${start}&daddr=${end}&output=embed&z=${zoom}`;

  return (
    <div className="w-full h-64 mt-4 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group relative">
      {/* Decorative inner glow for Glassmorphism effect */}
      <div className="absolute inset-0 pointer-events-none border-[8px] border-white/5 rounded-[2rem] z-10"></div>
      
      <iframe
        title={`${origin} to ${destination}`}
        width="100%"
        height="100%"
        src={mapUrl}
        frameBorder="0"
        scrolling="no"
        marginHeight="0"
        marginWidth="0"
        className="grayscale-[30%] contrast-[1.2] invert-[90%] hue-rotate-[180deg] group-hover:grayscale-0 group-hover:invert-0 group-hover:hue-rotate-0 transition-all duration-700 ease-in-out"
      ></iframe>

      {/* Optional Label for the map */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-4 py-1 rounded-full border border-white/10 text-[9px] font-black text-white/70 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
        {isFlight ? "✈️ Flight Route" : "🚗 Road Route"}
      </div>
    </div>
  );
}