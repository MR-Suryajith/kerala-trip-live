const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();

// Render-friendly Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function for "Retry" to handle 429/503 errors
const generateWithRetry = async (model, prompt, retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      if (
        error.message.includes("429") ||
        error.message.includes("503") ||
        error.message.includes("overloaded")
      ) {
        console.log(`⚠️ AI Busy, retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
  throw new Error(
    "AI Quota exceeded. Please wait a few seconds and try again."
  );
};

// --- CHATBOT ENDPOINT ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, itineraryContext } = req.body;
    let conciergePrompt =
      "You are SANCHAARA AI, a specialized travel concierge for Kerala. Be concise (max 2 sentences). Use emojis.";
    if (itineraryContext) {
      conciergePrompt += ` Context: User is viewing a trip to ${
        itineraryContext.destination
      }. Current spots: ${itineraryContext.placesMentioned?.join(", ")}.`;
    }
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: conciergePrompt,
    });
    let cleanHistory = (history || []).filter(
      (item) => item.parts[0].text.trim() !== ""
    );
    if (cleanHistory.length > 0 && cleanHistory[0].role === "model")
      cleanHistory.shift();
    if (
      cleanHistory.length > 0 &&
      cleanHistory[cleanHistory.length - 1].role === "user"
    )
      cleanHistory.pop();
    const chat = model.startChat({ history: cleanHistory });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    res.json({ reply: response.text() });
  } catch (error) {
    console.error("❌ Chat Error:", error.message);
    res.status(200).json({ reply: "Refreshing... try again in 5 seconds! 🛶" });
  }
});

// --- ITINERARY ENDPOINT (Supports Phases 9 & 10) ---
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { formData } = req.body;
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });

    console.log(`✈️ Planning: ${formData.origin} ➔ ${formData.destination}`);

    // 🔥 UPGRADED PROMPT for Phases 9 (Local Pulse) and 10 (Financials)
    const prompt = `Act as a Kerala Travel Expert, Cultural Historian, and Financial Planner. 
    Generate a ${formData.days}-day trip from ${formData.origin} to ${
      formData.destination
    }.
    Dates: ${formData.startDate} to ${formData.endDate}. Travelers: ${
      formData.travelers
    }. Budget: ₹${formData.budget}.
    
    ${
      formData.specialInstruction
        ? `URGENT CHANGE: ${formData.specialInstruction}`
        : ""
    }

    STRICT JSON REQUIREMENTS:
    1. localPulse: Array of strings. Identify specific festivals, temple fairs, or events happening in Kerala during these EXACT dates (e.g. Thrissur Pooram, Onam, Vishu, Boat Races).
    2. budgetAnalysis: Breakdown the total ₹${
      formData.budget
    } into logical estimates for: Stay, Food, Transport, and Sightseeing. Also calculate perPerson cost for ${
      formData.travelers
    } people.
    3. weather icon: Use ONLY real emojis (☀️, 🌧️, ☁️). NEVER use technical codes like "01d".
    4. estimatedTotalCost: MUST be a simple string.

    Return ONLY a JSON object:
    {
      "localPulse": ["Event 1 happening near you", "Event 2 info"],
      "budgetAnalysis": {
        "total": "₹${formData.budget}",
        "perPerson": "₹...",
        "breakdown": { "stay": "₹...", "food": "₹...", "transport": "₹...", "sightseeing": "₹..." }
      },
      "initialLogistics": { "from": "${
        formData.origin
      }", "to": "Gateway", "mode": "...", "distance": "km", "duration": "..." },
      "arrivalLogistics": { "from": "Gateway", "to": "First Spot", "distance": "km", "duration": "..." },
      "seasonalNote": "Personalized seasonal advice for ${formData.startDate}",
      "days": [{
        "dayNumber": 1,
        "cityLocation": "...",
        "weather": { "temp": "...", "condition": "...", "icon": "emoji", "advice": "..." },
        "dailyDose": { "recipe": "...", "movie": "...", "game": "..." },
        "places": [{ 
          "name": "...", 
          "rank": 9.5,
          "time": "...",
          "trafficStatus": "...",
          "distanceFromPrevious": "...",
          "travelTimeFromPrevious": "...",
          "description": "...",
          "alternativePlace": "...",
          "altReason": "..."
        }]
      }],
      "estimatedTotalCost": "₹${formData.budget} for ${
      formData.travelers
    } people"
    }`;

    const text = await generateWithRetry(model, prompt);
    res.json(JSON.parse(text));
    console.log("✅ Itinerary with Financials & Local Pulse generated!");
  } catch (error) {
    console.error("❌ Itinerary Error:", error.message);
    res.status(500).json({ error: "Failed to process plan. AI is busy." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
