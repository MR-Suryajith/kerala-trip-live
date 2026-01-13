import React from 'react';
import { Map as MapIcon, ExternalLink, Navigation2 } from 'lucide-react';

export default function MapComponent({ origin, destination, isFlight = false }) {
  const start = encodeURIComponent(origin);
  const end = encodeURIComponent(destination);
  
  // Free Google Maps Embed URL
  const zoom = isFlight ? 5 : 12;
  const mapUrl = `https://maps.google.com/maps?saddr=${start}&daddr=${end}&output=embed&z=${zoom}`;

  // Direct External Link for Mobile Navigation
  const externalMapUrl = `https://www.google.com/maps/dir/?api=1&origin=${start}&destination=${end}&travelmode=${isFlight ? 'flight' : 'driving'}`;

  return (
    <div className="w-full mt-3 group relative">
      
      {/* --- TOP MAP INFO BAR --- */}
      <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-center pointer-events-none">
        <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 shadow-xl translate-y-[-5px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
           <MapIcon className="w-3 h-3 text-emerald-400" />
           
        </div>
        
        {/* OPEN IN GOOGLE MAPS BUTTON (Interactive) */}
        <a 
          href={externalMapUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="pointer-events-auto bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-xl border border-white/20 shadow-2xl translate-y-[-5px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-75 flex items-center gap-2"
          title="Open in Google Maps"
        >
          <Navigation2 className="w-3 h-3 fill-current" />
          <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Navigate</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* --- THE MAP FRAME --- */}
      <div className="w-full h-80 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] relative bg-slate-900">
        
        {/* Glassmorphism Inner Glow */}
        <div className="absolute inset-0 pointer-events-none border-[10px] border-white/5 rounded-[2.5rem] z-10 shadow-inner"></div>
        
        <iframe
          title={`${origin} to ${destination}`}
          width="100%"
          height="100%"
          src={mapUrl}
          frameBorder="0"
          scrolling="no"
          marginHeight="0"
          marginWidth="0"
          className="grayscale-[40%] contrast-[1.2] invert-[90%] hue-rotate-[190deg] brightness-[0.8] group-hover:grayscale-0 group-hover:invert-0 group-hover:hue-rotate-0 group-hover:brightness-100 transition-all duration-1000 ease-in-out scale-[1.02]"
        ></iframe>

        {/* BOTTOM VIGNETTE (Makes text on map easier to read) */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none z-10"></div>
      </div>

  

    </div>
  );
}