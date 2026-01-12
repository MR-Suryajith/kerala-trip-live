const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function for "Retry" to handle 429/503 errors
const generateWithRetry = async (model, prompt, retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      if (error.message.includes("429") || error.message.includes("503")) {
        console.log(`⚠️ Server busy/overloaded, retrying in ${delay}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
  throw new Error("AI Quota exceeded. Please wait 10 seconds and try again.");
};

// --- CHATBOT ENDPOINT (Role Fix Applied) ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, itineraryContext } = req.body;

    // 1. Create a specialized Concierge personality
    let conciergePrompt =
      "You are KeralaLive AI, a helpful travel assistant. Be concise (1-2 sentences).";
    if (itineraryContext) {
      conciergePrompt += ` Context: The user is visiting ${
        itineraryContext.destination
      } for ${
        itineraryContext.totalDays
      } days. Current spots: ${itineraryContext.placesMentioned.join(
        ", "
      )}. Answer based on these spots.`;
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
      systemInstruction: conciergePrompt,
    });

    // 2. CLEAN HISTORY: Gemini requires: First is 'user', then alternates, last is 'model'
    let cleanHistory = (history || []).filter(
      (item) => item.parts[0].text.trim() !== ""
    );

    // Remove the very first message if it's from the bot (Namaskaram)
    if (cleanHistory.length > 0 && cleanHistory[0].role === "model") {
      cleanHistory.shift();
    }

    // Ensure the history doesn't end with a 'user' role (sendMessage adds the next 'user' role)
    if (
      cleanHistory.length > 0 &&
      cleanHistory[cleanHistory.length - 1].role === "user"
    ) {
      cleanHistory.pop();
    }

    const chat = model.startChat({ history: cleanHistory });
    const result = await chat.sendMessage(message);
    const text = result.response.text();

    res.json({ reply: text });
  } catch (error) {
    console.error("❌ Chat Error:", error.message);

    // Check for Quota/Rate Limit (429)
    if (error.message.includes("429") || error.message.includes("quota")) {
      return res.status(200).json({
        reply: "AI is a bit busy. Please wait 10 seconds and try again! 🌴",
      });
    }

    res.status(500).json({
      reply: "I'm having trouble connecting. Please try again in a moment! 🛶",
    });
  }
});
// --- ITINERARY ENDPOINT ---
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { formData } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

    console.log(
      `✈️ Planning Trip: ${formData.origin} ➔ ${formData.destination}`
    );

    const prompt = `Act as a Kerala Travel Expert. 
    Generate a ${formData.days}-day itinerary from ${formData.origin} to ${
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
      }", "to": "Gateway", "mode": "Flight/Train", "distance": "km", "duration": "hrs" },
      "arrivalLogistics": { "from": "Gateway", "to": "First Spot", "distance": "km", "duration": "mins" },
      "seasonalNote": "Weather advice for ${formData.startDate}",
      "days": [{
        "dayNumber": 1,
        "date": "Date",
        "cityLocation": "City",
        "weather": { "temp": "24°C", "condition": "Cloudy", "icon": "⛅", "advice": "Advice" },
        "dailyDose": { "recipe": "...", "movie": "...", "game": "..." },
        "places": [{ 
          "name": "...", 
          "rank": 9.5,
          "time": "10:00 AM",
          "trafficStatus": "Low",
          "distanceFromPrevious": "km",
          "travelTimeFromPrevious": "mins",
          "description": "...",
          "alternativePlace": "Name",
          "altReason": "Reason"
        }]
      }],
      "estimatedTotalCost": "₹${formData.budget} for all"
    }`;

    const text = await generateWithRetry(model, prompt);
    const startJson = text.indexOf("{");
    const endJson = text.lastIndexOf("}") + 1;
    res.json(JSON.parse(text.substring(startJson, endJson)));
    console.log("✅ Itinerary generated successfully!");
  } catch (error) {
    console.error("❌ Itinerary Error:", error.message);
    res
      .status(500)
      .json({ error: "Generation failed", message: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
