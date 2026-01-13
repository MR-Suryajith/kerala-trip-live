const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();

// Render-friendly Middlewares
app.use(cors({ origin: "*" }));
app.use(express.json());

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
    res.status(200).json({
      reply: "I'm refreshing my knowledge. Ask me again in 5 seconds! 🛶",
    });
  }
});

// --- ITINERARY ENDPOINT (Supports Swapping Spots) ---
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { formData } = req.body;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      generationConfig: { responseMimeType: "application/json" },
    });

    console.log(`✈️ Planning: ${formData.origin} ➔ ${formData.destination}`);
    if (formData.specialInstruction)
      console.log(`🔄 Modification: ${formData.specialInstruction}`);

    // 🔥 DYNAMIC PROMPT: Includes the Special Instruction if the user clicked "Swap"
    const prompt = `Act as a Kerala Travel Expert. 
    ${
      formData.specialInstruction
        ? `⚠️ URGENT CHANGE REQUEST: ${formData.specialInstruction}. YOU MUST DELETE the old place and replace it with the new alternative provided. Recalculate all distances/times for that day to match the new location.`
        : ""
    }

    Generate a ${formData.days}-day trip itinerary from ${formData.origin} to ${
      formData.destination
    }.
    Travelers: ${formData.travelers}. Budget: ₹${formData.budget}. Dates: ${
      formData.startDate
    }.
    Interests: ${formData.interests.join(", ")}.

    Return ONLY a JSON object:
    {
      "initialLogistics": { "from": "${
        formData.origin
      }", "to": "Gateway", "mode": "...", "distance": "km", "duration": "..." },
      "arrivalLogistics": { "from": "Gateway", "to": "First Spot", "distance": "km", "duration": "..." },
      "seasonalNote": "Personalized advice for ${formData.startDate}",
      "days": [{
        "dayNumber": 1,
        "date": "...",
        "cityLocation": "...",
        "weather": { "temp": "...", "condition": "...", "icon": "Use ONLY a real emoji like ☀️ or 🌧️, NEVER a code like 01d",: "...", "advice": "..." },
        "dailyDose": { "recipe": "...", "movie": "...", "game": "..." },
        "places": [{ 
          "name": "...", 
          "rank": 9.5,
          "time": "...",
          "trafficStatus": "High/Moderate/Low",
          "distanceFromPrevious": "km",
          "travelTimeFromPrevious": "mins",
          "description": "...",
          "alternativePlace": "...",
          "altReason": "..."
        }]
      }],
      "estimatedTotalCost": "₹..."
    }`;

    const text = await generateWithRetry(model, prompt);
    res.json(JSON.parse(text));
    console.log("✅ Operation Successful!");
  } catch (error) {
    console.error("❌ Itinerary Error:", error.message);
    res.status(500).json({ error: "Failed to process plan. AI is busy." });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
