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

// --- ITINERARY ENDPOINT (WHOLE INDIA VERSION) ---
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { formData } = req.body;
    const dest = formData.destination.trim();

    // STEP 1: AI VERIFICATION (Check if the location is in INDIA)
    console.log(`🔍 Verifying if ${dest} is in India...`);
    const validatorModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });
    const verifyPrompt = `Is the place "${dest}" located within the country of INDIA? 
    Answer ONLY with "TRUE" or "FALSE". If it is a famous international city or outside India, return "FALSE".`;

    const checkResult = await validatorModel.generateContent(verifyPrompt);
    const isIndia = checkResult.response
      .text()
      .trim()
      .toUpperCase()
      .includes("TRUE");

    if (!isIndia) {
      return res.status(400).json({
        error:
          "Sanchaara AI is currently optimized for Incredible India. Please enter a destination within India (e.g., Manali, Goa, Munnar, or Jaipur).",
      });
    }

    // STEP 2: GENERATE ALL-INDIA ITINERARY
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite", // or gemini-1.5-flash
      generationConfig: { responseMimeType: "application/json" },
    });

    console.log(
      `✈️ Planning India Journey: ${formData.origin} ➔ ${formData.destination}`
    );

    const prompt = `Act as an expert Indian Travel Guide and Financial Planner. 
    Generate a ${formData.days}-day trip itinerary from ${formData.origin} to ${
      formData.destination
    }, India.
    Dates: ${formData.startDate} to ${formData.endDate}. Travelers: ${
      formData.travelers
    }. Budget: ₹${formData.budget}.
    Interests: ${formData.interests.join(", ")}.

    STRICT JSON REQUIREMENTS:
    1. localPulse: Identify specific Indian festivals (like Diwali, Holi, Onam, Hornbill Festival, etc.) or regional events happening near ${
      formData.destination
    } on these dates.
    2. budgetAnalysis: Breakdown the total ₹${
      formData.budget
    } into logical estimates for: Stay, Food, Transport, and Sightseeing.
    3. dailyDose: 
       - recipe: Suggest a famous regional dish specific to the state being visited (e.g., Vada Pav for Maharashtra, Litti Chokha for Bihar, Sadya for Kerala).
       - movie: Suggest a movie set in or related to that region.
    4. initialLogistics: Calculate the best transit from ${
      formData.origin
    } to the nearest major Indian hub/airport for ${formData.destination}.

    Return ONLY a JSON object:
    {
      "localPulse": ["Regional event/festival info"],
      "budgetAnalysis": {
        "total": "₹${formData.budget}",
        "perPerson": "₹...",
        "breakdown": { "stay": "₹...", "food": "₹...", "transport": "₹...", "sightseeing": "₹..." }
      },
      "initialLogistics": { "from": "${
        formData.origin
      }", "to": "Nearest Hub", "mode": "...", "distance": "km", "duration": "..." },
      "arrivalLogistics": { "from": "Hub", "to": "First Spot", "distance": "km", "duration": "..." },
      "seasonalNote": "Personalized advice for this region of India during ${
        formData.startDate
      }",
      "days": [{
        "dayNumber": 1,
        "date": "...",
        "cityLocation": "...",
        "weather": { "temp": "...", "condition": "...", "icon": "☀️", "advice": "..." },
        "dailyDose": { "recipe": "...", "movie": "...", "game": "..." },
        "places": [{ 
          "name": "...", 
          "rank": 9.5,
          "time": "...",
          "trafficStatus": "Low/Moderate/High",
          "distanceFromPrevious": "...",
          "travelTimeFromPrevious": "...",
          "description": "...",
          "alternativePlace": "...",
          "altReason": "..."
        }]
      }],
      "estimatedTotalCost": "₹${formData.budget} total for ${
      formData.travelers
    } people"
    }`;

    const text = await generateWithRetry(model, prompt);
    res.json(JSON.parse(text));
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({
      error:
        "Sanchaara AI is currently busy mapping your Indian Odyssey. Please try again.",
    });
  }
});

// --- CHATBOT ENDPOINT (UPDATED FOR INDIA) ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, itineraryContext } = req.body;
    let conciergePrompt =
      "You are SANCHAARA AI, a travel concierge for INCREDIBLE INDIA. Provide deep insights into Indian culture, regional cuisines, safety, and hidden gems across all Indian states. Be concise. Use emojis.";

    if (itineraryContext) {
      conciergePrompt += ` The user is exploring ${
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
    res.json({ reply: (await result.response).text() });
  } catch (error) {
    res.status(200).json({
      reply: "I'm refreshing my knowledge of Indian terrains. Try again!",
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Sanchaara Server running on port ${PORT}`);
});
