const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function for "Retry with Exponential Backoff"
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
        console.log(
          `⚠️ Model busy, retrying in ${delay}ms... (Attempt ${
            i + 1
          }/${retries})`
        );
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
  throw new Error("Google's AI servers are still overloaded after 3 attempts.");
};

app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { formData } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log(`✈️ Planning: ${formData.origin} ➔ ${formData.destination}`);

    const prompt = `Act as a Kerala Travel Expert and Logistics Coordinator. 
    Generate a ${formData.days}-day trip itinerary from ${formData.origin} to ${
      formData.destination
    }.
    Travelers: ${formData.travelers}. Total Budget Cap: ₹${formData.budget}. 
    Interests: ${formData.interests.join(", ")}.

    STRICT INSTRUCTIONS:
    1. INITIAL LOGISTICS: Identify the best transit (Flight/Train) from ${
      formData.origin
    } to a Kerala Gateway (Airport/Station).
    2. ARRIVAL LOGISTICS: Provide the transfer details from that Gateway to the very first sightseeing spot.
    3. INDIVIDUAL LOGISTICS: For EVERY sightseeing place, calculate the exact road distance and time from the place immediately preceding it.
    4. PLAN B & TRAFFIC: Provide a 'Plan B' alternative and a 'Traffic Status' for every single location.
    5. BUDGET: Ensure all suggested activities and stay fit within the total cap of ₹${
      formData.budget
    }.

    Return ONLY a JSON object. 
    CRITICAL: The "estimatedTotalCost" MUST be a simple STRING, not an object.

    Format:
    {
      "initialLogistics": { "from": "${
        formData.origin
      }", "to": "...", "mode": "...", "distance": "...", "duration": "..." },
      "arrivalLogistics": { "from": "...", "to": "...", "distance": "...", "duration": "..." },
      "days": [{
        "dayNumber": 1,
        "cityLocation": "...",
        "weather": { "temp": "...", "condition": "...", "icon": "...", "advice": "..." },
        "dailyDose": { "recipe": "...", "movie": "...", "game": "..." },
        "places": [{ 
          "name": "...", 
          "rank": 9,
          "time": "...",
          "trafficStatus": "Low/Moderate/High",
          "distanceFromPrevious": "e.g., 8 km",
          "travelTimeFromPrevious": "e.g., 20 mins",
          "description": "...",
          "alternativePlace": "Detailed Plan B suggestion"
        }]
      }],
      "estimatedTotalCost": "e.g., ₹${formData.budget} total for ${
      formData.travelers
    } people"
    }`;

    const text = await generateWithRetry(model, prompt);
    const startJson = text.indexOf("{");
    const endJson = text.lastIndexOf("}") + 1;
    const jsonString = text.substring(startJson, endJson);

    const itinerary = JSON.parse(jsonString);
    console.log("✅ Success!");
    res.json(itinerary);
  } catch (error) {
    console.error("❌ Backend Error:", error.message);
    res
      .status(500)
      .json({ error: "Generation failed", message: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
