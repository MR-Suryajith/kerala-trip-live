const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateWithRetry = async (model, prompt, retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      if (
        error.message.includes("503") ||
        error.message.includes("overloaded")
      ) {
        console.log(`⚠️ AI Busy, retrying... (${i + 1}/${retries})`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
  throw new Error("AI servers are overloaded. Try again in a moment.");
};

app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { formData } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log(
      `✈️ Planning Trip: ${formData.origin} ➔ ${formData.destination} (${formData.startDate} to ${formData.endDate})`
    );

    // Phase 3: Enhanced Prompt with Seasonal Intelligence & Dynamic Switching
    const prompt = `Act as a Kerala Travel Expert, Historian, and Logistics Coordinator.
    
    USER REQUEST:
    - Route: From ${formData.origin} to ${formData.destination}
    - Dates: ${formData.startDate} to ${formData.endDate} (${
      formData.days
    } days)
    - Travelers: ${formData.travelers} | Budget: ₹${formData.budget}
    - Interests: ${formData.interests.join(", ")}
    ${
      formData.specialInstruction
        ? `- DYNAMIC CHANGE: ${formData.specialInstruction}`
        : ""
    }

    STRICT INSTRUCTIONS:
    1. SEASONAL INTELLIGENCE: Analyze the dates (${formData.startDate}). 
       - If Monsoon (June-Aug): Suggest waterfalls (Athirappilly, Meenmutty) and Ayurveda. Warn against trekking.
       - If Summer (March-May): Suggest hill stations (Munnar, Vagamon) and AC houseboats.
       - FESTIVALS: Check for Onam, Vishu, Thrissur Pooram, Makaravilakku, or Boat Races occurring on these dates and prioritize them.
    2. PLAN B SWITCHING: If a "DYNAMIC CHANGE" instruction is provided above, regenerate the itinerary by swapping the requested location while keeping the travel route optimized.
    3. LOGISTICS: Provide distances/times for every stop.
    4. BUDGET: Strictly ₹${formData.budget} total for ${
      formData.travelers
    } people.

    Return ONLY a JSON object:
    {
      "initialLogistics": { "from": "${
        formData.origin
      }", "to": "Gateway", "mode": "Flight/Train", "distance": "km", "duration": "hrs" },
      "arrivalLogistics": { "from": "Gateway", "to": "First Spot", "distance": "km", "duration": "mins" },
      "seasonalNote": "A brief explanation of why this plan is perfect for ${
        formData.startDate
      } (e.g., specific festival info or weather advice)",
      "days": [{
        "dayNumber": 1,
        "date": "Readable Date",
        "cityLocation": "City Name",
        "weather": { "temp": "24°C", "condition": "Cloudy", "icon": "⛅", "advice": "Travel advice" },
        "dailyDose": { "recipe": "...", "movie": "...", "game": "..." },
        "places": [{ 
          "name": "...", 
          "rank": 9.5,
          "time": "10:00 AM",
          "trafficStatus": "Low/High",
          "distanceFromPrevious": "km",
          "travelTimeFromPrevious": "mins",
          "description": "...",
          "alternativePlace": "Name of a nearby alternative spot",
          "altReason": "Short reason why this is the alternative (e.g. 'Rain-friendly' or 'Less crowded')"
        }]
      }],
      "estimatedTotalCost": "₹${formData.budget} total for ${
      formData.travelers
    } people"
    }`;

    const text = await generateWithRetry(model, prompt);
    const startJson = text.indexOf("{");
    const endJson = text.lastIndexOf("}") + 1;
    const itinerary = JSON.parse(text.substring(startJson, endJson));

    console.log("✅ Phase 3 Itinerary Ready!");
    res.json(itinerary);
  } catch (error) {
    console.error("❌ Error:", error.message);
    res
      .status(500)
      .json({ error: "Generation failed", message: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`🚀 Phase 3 Server running on http://localhost:${PORT}`)
);
