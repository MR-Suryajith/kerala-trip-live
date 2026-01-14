const express = require("express");
const cors = require("cors");
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
require("dotenv").config();

const app = express();

// --- MIDDLEWARES (Render & Local Compatible) ---
app.use(cors({ origin: "*" }));
app.use(express.json());

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Helper function for "Retry with Exponential Backoff"
 * This specifically handles 429 (Quota) and 503 (Overloaded) errors
 * ensuring the server stays stable under load.
 */
const generateWithRetry = async (model, prompt, retries = 3, delay = 2000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Safety check: If AI returns an empty string, throw error to trigger retry
      if (!responseText || responseText.trim().length === 0) {
        throw new Error("AI returned empty content");
      }
      return responseText;
    } catch (error) {
      const isRetryable =
        error.message.includes("429") ||
        error.message.includes("503") ||
        error.message.includes("overloaded");

      if (isRetryable && i < retries - 1) {
        console.log(
          `⚠️ AI Busy/Quota reached. Retrying in ${delay}ms... (Attempt ${
            i + 1
          }/${retries})`
        );
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error(
    "Sanchaara AI servers are at maximum capacity. Please wait 10-15 seconds."
  );
};

/**
 * Helper to clean and extract JSON from AI text
 * Prevents 500 errors if Gemini includes conversational filler or markdown tags.
 */
const cleanAndParseJSON = (text) => {
  try {
    // Attempt to find the first '{' and last '}' to extract valid JSON
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    if (start === -1 || end === 0)
      throw new Error("No JSON structure found in response");

    const jsonString = text.substring(start, end);
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("❌ JSON Extraction Failed. Raw Output:", text);
    throw new Error(
      "The AI provided an invalid travel data format. Please try again."
    );
  }
};

// --- ITINERARY ENDPOINT (Supports All-India & Dynamic Swapping) ---
app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { formData } = req.body;
    const destination = formData.destination ? formData.destination.trim() : "";

    // STEP 1: GEOGRAPHICAL VALIDATION (INDIA GEOFENCE)
    console.log(`🔍 Verifying destination: ${destination}`);
    const validatorModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite",
    });
    const verifyPrompt = `Is the location "${destination}" situated within the country of INDIA? 
    Reply strictly with only the word "TRUE" or "FALSE". If it's outside India, reply "FALSE".`;

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

    // STEP 2: CONFIGURE GENERATION MODEL
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite", // Using the user-confirmed working version
      generationConfig: {
        temperature: 0.4, // Lower temperature for more stable JSON output
        responseMimeType: "application/json",
      },
      // Lower safety thresholds to prevent accidental blocks on travel queries
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
    });

    console.log(`✈️ Planning Journey: ${formData.origin} ➔ ${destination}`);

    // Check if this is a Plan B swap request
    const modificationNote = formData.specialInstruction
      ? `\n⚠️ SPECIAL MODIFICATION: ${formData.specialInstruction}. You MUST adjust the itinerary to reflect this change.`
      : "";

    // STEP 3: CONSTRUCT ENHANCED PROMPT
    const prompt = `Act as an expert Indian Travel Guide, Logistics Analyst, and Financial Planner.
    Generate a ${formData.days}-day travel plan from ${
      formData.origin
    } to ${destination}, India.
    Travelers: ${formData.travelers} | Total Budget Limit: ₹${
      formData.budget
    } | Interests: ${formData.interests.join(", ")} ${modificationNote}

    STRICT OUTPUT RULES:
    1. localPulse: Identify real festivals/events in ${destination} on these dates. MUST be an array of simple strings.
    2. budgetAnalysis: Split ₹${
      formData.budget
    } logically. Total and perPerson must be simple strings (e.g., "₹50,000").
    3. weather icon: Use ONLY one real emoji (☀️, 🌧️, ☁️, 🌫️, 🌩️).
    4. Places: Include rank(1-10), time, trafficStatus(Low/Moderate/High), distance/time from previous stop, and alternativePlace.

    JSON FORMAT (MANDATORY):
    {
      "localPulse": ["..."],
      "budgetAnalysis": { "total": "₹...", "perPerson": "₹...", "breakdown": { "stay": "₹...", "food": "₹...", "transport": "₹...", "sightseeing": "₹..." } },
      "initialLogistics": { "from": "${
        formData.origin
      }", "to": "Nearest Hub", "mode": "...", "distance": "km", "duration": "..." },
      "arrivalLogistics": { "from": "Hub", "to": "First Spot", "distance": "km", "duration": "..." },
      "seasonalNote": "Advice for ${formData.startDate}",
      "days": [{
        "dayNumber": 1, "date": "...", "cityLocation": "...",
        "weather": { "temp": "...", "condition": "...", "icon": "emoji", "advice": "..." },
        "dailyDose": { "recipe": "...", "movie": "...", "game": "..." },
        "places": [{ "name": "...", "rank": 9.5, "time": "...", "trafficStatus": "...", "distanceFromPrevious": "...", "travelTimeFromPrevious": "...", "description": "...", "alternativePlace": "...", "altReason": "..." }]
      }],
      "estimatedTotalCost": "₹... total for ${formData.travelers} people"
    }`;

    const textResponse = await generateWithRetry(model, prompt);
    const finalItinerary = cleanAndParseJSON(textResponse);

    res.json(finalItinerary);
    console.log("✅ Itinerary Successfully Generated and Sent.");
  } catch (error) {
    console.error("❌ Itinerary Endpoint Error:", error.message);
    res.status(500).json({
      error:
        "Sanchaara AI is currently busy. Please wait a moment and try again.",
      details: error.message,
    });
  }
});

// --- CHATBOT ENDPOINT (Role Fix & Context Integrated) ---
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, itineraryContext } = req.body;

    let systemInstruction =
      "You are SANCHAARA AI, a concise travel concierge for INCREDIBLE INDIA. Rules: Friendly, max 2 sentences, use emojis.";
    if (itineraryContext) {
      systemInstruction += ` The user is exploring ${
        itineraryContext.destination
      }. Current spots: ${itineraryContext.placesMentioned?.join(
        ", "
      )}. Answer accordingly.`;
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-lite", // Using Flash for faster chat response
      systemInstruction: systemInstruction,
    });

    // FILTER & RESTRUCTURE HISTORY (Gemini expects: user -> model -> user)
    let cleanHistory = (history || []).filter(
      (item) => item.parts && item.parts[0] && item.parts[0].text.trim() !== ""
    );

    // Rule 1: History cannot start with 'model'
    if (cleanHistory.length > 0 && cleanHistory[0].role === "model") {
      cleanHistory.shift();
    }
    // Rule 2: History cannot end with 'user' (as sendMessage appends a 'user' message)
    if (
      cleanHistory.length > 0 &&
      cleanHistory[cleanHistory.length - 1].role === "user"
    ) {
      cleanHistory.pop();
    }

    const chat = model.startChat({ history: cleanHistory });
    const result = await chat.sendMessage(message);
    const chatResponse = await result.response;

    console.log("🤖 Chat Response Sent.");
    res.json({ reply: chatResponse.text() });
  } catch (error) {
    console.error("❌ Chatbot Error:", error.message);
    res.status(200).json({
      reply:
        "I'm experiencing high traffic from other travelers. Please ask me again in a few seconds! 🇮🇳",
    });
  }
});

// --- APP LISTENER & PORT CONFIG (Render Optimized) ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Sanchaara Server live on http://localhost:${PORT}`);
  console.log(
    `🔑 Key Status: ${process.env.GEMINI_API_KEY ? "CONFIGURED" : "MISSING"}`
  );
});
