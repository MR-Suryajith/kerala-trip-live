import React, { useState, useRef, useEffect } from 'react';

const GENERAL_SUGGESTIONS = [
  "🥘 Must-try local food?",
  "🛡️ Is Kerala safe for solo travelers?",
  "🚌 How to use KSRTC buses?",
  "💎 Hidden gems in Kerala?",
  "☔ Best places during Monsoon?"
];

const ITINERARY_SUGGESTIONS = [
  "⏰ Best time to start my Day 1?",
  "☕ Good cafes near these spots?",
  "👗 What should I wear today?",
  "🚗 Average taxi rates here?",
  "🛍️ Best place for shopping nearby?"
];

export default function ChatBot({ itinerary }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", text: "Namaskaram! 🙏 I'm your Kerala travel expert. How can I help you today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const currentSuggestions = itinerary ? ITINERARY_SUGGESTIONS : GENERAL_SUGGESTIONS;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (suggestedText) => {
    const messageToSend = suggestedText || input;
    if (!messageToSend.trim() || loading) return;

    // 1. Prepare history BEFORE adding the new message to state.
    // We filter out the first message (Namaskaram) because Gemini history MUST start with 'user'.
    const chatHistory = messages
      .slice(1) // Skip the initial bot greeting
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

    // 2. Add user message to local UI
    const newUserMsg = { role: "user", text: messageToSend };
    setMessages(prev => [...prev, newUserMsg]);
    setInput("");
    setLoading(true);

    try {
      // 3. Extract context for the AI
      const itineraryContext = itinerary ? {
        destination: itinerary.days[0]?.cityLocation,
        totalDays: itinerary.days.length,
        placesMentioned: itinerary.days.flatMap(d => d.places.map(p => p.name))
      } : null;

      const response = await fetch("http://localhost:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageToSend,
          history: chatHistory, 
          itineraryContext: itineraryContext 
        }),
      });

      const data = await response.json();

      if (data.reply) {
        setMessages(prev => [...prev, { role: "bot", text: data.reply }]);
      } else {
        // Handle empty or error responses from backend gracefully
        const errorText = data.error || "I'm a bit lost in the backwaters. Try again! 🛶";
        setMessages(prev => [...prev, { role: "bot", text: errorText }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: "bot", text: "Connection lost. Please check your internet! 🛶" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000] font-sans">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all active:scale-90 border-2 border-white/20"
      >
        {isOpen ? "✕" : "💬"}
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 md:w-96 h-[480px] bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          
          <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 text-white">
            <h4 className="font-black text-sm uppercase tracking-widest text-white">
              {itinerary ? "Trip Concierge" : "Kerala Explorer"}
            </h4>
            <p className="text-[9px] opacity-70 italic text-white/80">
              {itinerary ? "Personalized support for your trip" : "General Kerala guide"}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-black/10">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.text && (
                  <div className={`max-w-[85%] p-3 rounded-2xl text-[12px] leading-relaxed shadow-sm ${
                    m.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white/10 text-white border border-white/10 rounded-tl-none'
                  }`}>
                    {m.text}
                  </div>
                )}
              </div>
            ))}
            {loading && <div className="text-white/30 text-[10px] animate-pulse ml-2 font-bold uppercase">Thinking...</div>}
            <div ref={scrollRef} />
          </div>

          <div className="px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-white/5 bg-white/5">
            {currentSuggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap bg-white/10 hover:bg-white/20 border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold text-white/90 transition-all active:scale-95"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="p-3 bg-slate-900 border-t border-white/10 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={itinerary ? "Ask about your trip..." : "Ask a general question..."}
              className="flex-1 bg-white/5 border border-white/20 rounded-xl px-4 py-2 text-white text-xs outline-none focus:border-green-500 transition-all placeholder:text-white/20"
            />
            <button 
              onClick={() => handleSend()}
              disabled={loading}
              className="bg-green-600 text-white px-3 py-2 rounded-xl text-sm hover:bg-green-50 active:scale-90 transition-all disabled:opacity-50"
            >
              🚀
            </button>
          </div>
        </div>
      )}
    </div>
  );
}