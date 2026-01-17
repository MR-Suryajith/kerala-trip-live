import React, { useState, useRef, useEffect } from 'react';
import { SendHorizontal, MessageCircle, X, Sparkles, Loader2 } from 'lucide-react';

const GENERAL_SUGGESTIONS = [
  "🥘 Must-try local food?",
  "🛡️ Is India safe for solo travelers?",
  "🚌 How to get public bus?",
  "💎 Hidden gems in India?",
  "☔ Best places during Monsoon?",
  "🐅 Where are the best tiger safari spots?",
  "🎉 Upcoming festivals in India?",
  "🏖️ Goa or Kerala for a beach holiday?"
];

const ITINERARY_SUGGESTIONS = [
  "⏰ Best time to start Day 1?",
  "☕ Good cafes near these spots?",
  "👗 What should I wear today?",
  "🚗 Average taxi rates here?",
  "🛍️ Best places for shopping?",
  "🍽️ Top restaurants nearby?",
  "🌅 Good spots for sunset photos?",
];

export default function ChatBot({ itinerary }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", text: "Namaskar! 🙏 I'm your travel expert. How can I help you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api/chat' 
    : 'https://sanchaara-ai.onrender.com/api/chat';

  const currentSuggestions = itinerary ? ITINERARY_SUGGESTIONS : GENERAL_SUGGESTIONS;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading]);

  const handleSend = async (suggestedText) => {
    const messageToSend = suggestedText || input;
    if (!messageToSend.trim() || loading) return;

    const chatHistory = messages.slice(1).map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));

    setMessages(prev => [...prev, { role: "user", text: messageToSend }]);
    setInput("");
    setLoading(true);

    try {
      const itineraryContext = itinerary ? {
        destination: itinerary.days[0]?.cityLocation,
        totalDays: itinerary.days.length,
        placesMentioned: itinerary.days.flatMap(d => d.places.map(p => p.name))
      } : null;

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageToSend,
          history: chatHistory, 
          itineraryContext 
        }),
      });

      const data = await response.json();
      setMessages(prev => [...prev, { role: "bot", text: data.reply || "I'm refreshing my data. Try again! 🌴" }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: "bot", text: "Connection lost. Please check your internet! 🛶" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[5000] font-sans">
      {/* --- DYNAMIC TOGGLE BUTTON --- */}
      <div className="relative group">
        <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-40 group-hover:opacity-70 animate-pulse transition-opacity"></div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl active:scale-90 border border-white/20 ${
            isOpen ? 'bg-slate-900 rotate-90' : 'bg-gradient-to-tr from-emerald-600 to-teal-400'
          }`}
        >
          {isOpen ? <X className="text-white w-7 h-7" /> : <MessageCircle className="text-white w-8 h-8" />}
          {!isOpen && <Sparkles className="absolute top-3 right-3 w-3 h-3 text-yellow-300 animate-pulse" />}
        </button>
      </div>

      {/* --- CHAT WINDOW --- */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 w-[85vw] md:w-96 h-[520px] bg-slate-950/95 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-blue-600 p-6 text-white border-b border-white/5">
            <h4 className="font-black text-sm uppercase tracking-[0.3em] flex items-center gap-2">
               <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
               {itinerary ? "Trip Concierge" : "India Explorer"}
            </h4>
            <p className="text-[10px] opacity-60 mt-1 font-medium tracking-widest">Powered by Sanchaara Neural Core</p>
          </div>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-[13px] leading-relaxed shadow-xl border ${
                  m.role === 'user' 
                  ? 'bg-blue-600 border-blue-400/50 text-white rounded-br-none' 
                  : 'bg-white/5 border-white/10 text-white/90 rounded-tl-none backdrop-blur-md'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-emerald-400/50 text-[10px] font-black uppercase tracking-widest ml-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Neural Link Active...
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/5 bg-black/20">
            {currentSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap bg-white/5 hover:bg-emerald-500/20 border border-white/10 px-4 py-2 rounded-full text-[10px] font-bold text-white/70 transition-all hover:text-emerald-400 active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-slate-900/80 border-t border-white/10 flex gap-3 items-center">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask Sanchaara..."
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white text-xs outline-none focus:border-emerald-500/50 transition-all placeholder:text-white/20"
            />
            <button 
              onClick={() => handleSend()}
              disabled={loading}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 border border-white/10 ${
                loading ? 'bg-slate-800' : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
              ) : (
                <SendHorizontal className="text-white w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}