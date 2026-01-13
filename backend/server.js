const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();

// 1. Render-friendly Middlewares
app.use(cors());
app.use(express.json());
app.use(cors({ origin: "*" }));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function for "Retry" to handle 429/503 errors during high traffic
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
        console.log(
          `⚠️ AI Busy, retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`
        );
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

// --- CHATBOT ENDPOINT (Optimized for Render/Stability) ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, itineraryContext } = req.body;

    let conciergePrompt =
      "You are SANCHAARA AI, a specialized travel concierge for Kerala. Be concise (max 2 sentences). Use emojis.";
    if (itineraryContext) {
      conciergePrompt += ` Context: User is viewing a trip to ${
        itineraryContext.destination
      } for ${
        itineraryContext.totalDays
      } days. Spots include: ${itineraryContext.placesMentioned?.join(", ")}.`;
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite", // Use 2.5-flash for faster chat
      systemInstruction: conciergePrompt,
    });

    // Gemini History Requirements: Must alternate [user, model, user, model]
    let cleanHistory = (history || []).filter(
      (item) => item.parts[0].text.trim() !== ""
    );

    // Ensure history starts with 'user'
    if (cleanHistory.length > 0 && cleanHistory[0].role === "model") {
      cleanHistory.shift();
    }
    // Ensure history ends with 'model' (because sendMessage adds the next 'user')
    if (
      cleanHistory.length > 0 &&
      cleanHistory[cleanHistory.length - 1].role === "user"
    ) {
      cleanHistory.pop();
    }

    const chat = model.startChat({ history: cleanHistory });
    const result = await chat.sendMessage(message);
    const response = await result.response;

    res.json({ reply: response.text() });
  } catch (error) {
    console.error("❌ Chat Error:", error.message);
    res.status(200).json({
      reply: "I'm experiencing high traffic. Please try again in 5 seconds! 🛶",
    });
  }
});

// --- ITINERARY ENDPOINT (Pure JSON Generation) ---
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { formData } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" }, // Forces pure JSON output
    });

    console.log(`✈️ Planning: ${formData.origin} ➔ ${formData.destination}`);

    const prompt = `Act as a Kerala Travel Expert. Generate a ${
      formData.days
    }-day trip itinerary from ${formData.origin} to ${formData.destination}.
    Travelers: ${formData.travelers}. Budget: ₹${formData.budget}. Dates: ${
      formData.startDate
    }.
    Interests: ${formData.interests.join(", ")}.

    INSTRUCTIONS:
    - Provide 'initialLogistics' (Flight/Train distance and time).
    - Provide 'arrivalLogistics' (Gateway to first stop).
    - For EVERY place, calculate road distance/time from previous stop and a 'Plan B' alternativePlace.

    Return ONLY a JSON object:
    {
      "initialLogistics": { "from": "${
        formData.origin
      }", "to": "Gateway", "mode": "...", "distance": "km", "duration": "..." },
      "arrivalLogistics": { "from": "Gateway", "to": "First Spot", "distance": "km", "duration": "..." },
      "seasonalNote": "Personalized travel advice for ${formData.startDate}",
      "days": [{
        "dayNumber": 1,
        "date": "...",
        "cityLocation": "...",
        "weather": { "temp": "...", "condition": "...", "icon": "...", "advice": "..." },
        "dailyDose": { "recipe": "...", "movie": "...", "game": "..." },
        "places": [{ 
          "name": "...", 
          "rank": 9.5,
          "time": "...",
          "trafficStatus": "...",
          "distanceFromPrevious": "km",
          "travelTimeFromPrevious": "mins",
          "description": "...",
          "alternativePlace": "...",
          "altReason": "..."
        }]
      }],
      "estimatedTotalCost": "Total for all travelers as a string"
    }`;

    const text = await generateWithRetry(model, prompt);
    res.json(JSON.parse(text));
    console.log("✅ Itinerary generated successfully!");
  } catch (error) {
    console.error("❌ Itinerary Error:", error.message);
    res
      .status(500)
      .json({ error: "Failed to generate plan. AI is currently busy." });
  }
});

// --- RENDER DEPLOYMENT PORT CONFIG ---
// Use process.env.PORT to allow Render to bind its port
const PORT = process.env.PORT || 5000;

// Listen on 0.0.0.0 (required for Render to see the service)
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
