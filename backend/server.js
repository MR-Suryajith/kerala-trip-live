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

// --- MULTI-KEY ROTATION SETUP ---
// We support up to 3 specific keys, and fallback to the original GEMINI_API_KEY if specific ones aren't set
const apiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY
].filter(Boolean); // Filter out any undefined/null keys

if (apiKeys.length === 0) {
  console.warn("⚠️ WARNING: No Gemini API keys found in the environment variables!");
}

let currentKeyIndex = 0;

/**
 * Creates a fresh Gemini GenAI instance using the currently active key.
 */
const getActiveModel = (modelName, config = {}) => {
  const genAI = new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
  return genAI.getGenerativeModel({ model: modelName, ...config });
};

/**
 * Helper function for "Retry with Exponential Backoff" & "Multi-Key Rotation"
 * This specifically handles 429 (Quota) and 503 (Overloaded) errors.
 * On 429 errors, it instantly swaps to the next available API key.
 */
const generateWithRetry = async (modelName, config, prompt, retries = 3, delay = 2000) => {
  let attempt = 0;
  // Increase total possible attempts if we have multiple keys to ensure we can try all of them
  const maxAttempts = retries + apiKeys.length;

  while (attempt < maxAttempts) {
    try {
      const model = getActiveModel(modelName, config);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Safety check: If AI returns an empty string, throw error to trigger retry
      if (!responseText || responseText.trim().length === 0) {
        throw new Error("AI returned empty content");
      }
      return responseText;
    } catch (error) {
      attempt++;

      const isQuotaError = error.message.includes("429") || error.message.includes("quota");
      const isOverloaded = error.message.includes("503") || error.message.includes("overloaded");

      if (isQuotaError) {
        // ROTATE TO THE NEXT API KEY
        if (apiKeys.length > 1) {
          const prevIndex = currentKeyIndex;
          currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
          console.log(`⚠️ Quota Reached on Key ${prevIndex + 1}/${apiKeys.length}. Rotating to Key ${currentKeyIndex + 1}/${apiKeys.length}...`);
          // Note: On quota errors we instantly retry with the new key without a massive delay
          delay = 1000;
        } else {
           console.log(`⚠️ Quota Reached, but only 1 API key is configured. Retrying in ${delay}ms... (Attempt ${attempt}/${maxAttempts})`);
           await new Promise((res) => setTimeout(res, delay));
           delay *= 2;
        }
      } else if (isOverloaded && attempt < maxAttempts) {
        console.log(`⚠️ AI Server Overloaded. Retrying in ${delay}ms... (Attempt ${attempt}/${maxAttempts})`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2; // Exponential backoff for typical network/server load issues
      } else {
        throw error; // If it's a different error (like 400 Bad Request), or we ran out of retries, fail
      }
    }
  }
  throw new Error("Sanchaara AI servers are at maximum capacity or all API keys have exhausted their quotas. Please wait a moment.");
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
    const parsedData = JSON.parse(jsonString);

    // --- HARD FORMAT MAPPING ---
    // Gemini abuses 'seasonalNote', so we forced it to output 'weatherAndFestivalAdvice'
    // Now we map it back so the frontend ItineraryDisplay.jsx doesn't break
    if (parsedData.weatherAndFestivalAdvice) {
        parsedData.seasonalNote = parsedData.weatherAndFestivalAdvice;
        delete parsedData.weatherAndFestivalAdvice;
    } else if (!parsedData.seasonalNote) {
        parsedData.seasonalNote = "Pleasant weather expected. Pack comfortable clothing suitable for exploring.";
    }

    // --- AI HALLUCINATION GUARD: Format Isolation ---
    // Gemini often ignores negative constraints and leaks financial info into seasonalNote.
    if (parsedData.seasonalNote) {
       const note = parsedData.seasonalNote.toLowerCase();
       const hasFinancialTerm = note.includes("₹") || note.includes("rs") || note.includes("budget") || note.includes("cost") || note.includes("price") || note.includes("expensive");

       if (hasFinancialTerm) {
           console.log("🛡️ Intercepted AI Leak: Relocating budget text from seasonalNote.");
           // Push the leaked text into the budgetAnalysis.breakdown as an AI Alert
           if (!parsedData.budgetAnalysis) parsedData.budgetAnalysis = { breakdown: {} };
           if (!parsedData.budgetAnalysis.breakdown) parsedData.budgetAnalysis.breakdown = {};

           parsedData.budgetAnalysis.breakdown["Financial Advisor Note"] = parsedData.seasonalNote;

           // Cleanse the seasonalNote
           parsedData.seasonalNote = "Pleasant weather expected. Pack comfortable clothing suitable for exploring.";
       }
    }

    return parsedData;
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
    const transportMode = formData.transportMode ? formData.transportMode.trim() : "Optimal";

    // STEP 1: GEOGRAPHICAL VALIDATION (INDIA GEOFENCE)
    console.log(`🔍 Verifying destination: ${destination}`);
    const validatorModel = getActiveModel("gemini-2.5-flash-lite");
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
    const modelName = "gemini-2.5-flash-lite"; // Using the user-confirmed working version
    const config = {
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
    };

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
    } | Preferred Global Transport Mode: ${transportMode} | Interests: ${formData.interests.join(", ")} ${modificationNote}

    STRICT OUTPUT RULES:
    1. INITIAL TRANSIT (${formData.origin} to nearest hub for ${destination}): YOU MUST use the preferred mode "${transportMode}" if possible.
       - The 'duration' MUST be realistic for this specific mode (e.g. Flight is ~2-4 hrs, Train might be 20-40+ hrs depending on distance).
       - If the user's budget (₹${formData.budget}) is too low for this mode, STILL GENERATE the plan using this mode.
    2. BUDGET WARNINGS: If the trip is hilariously underbudgeted (e.g., ₹100 for a Flight to Goa), you MUST put your funny warning inside \`budgetAnalysis.breakdown.FinancialWarning\`. You are FORBIDDEN from putting budget warnings in \`weatherAndFestivalAdvice\`.
    3. LOCAL TRANSIT (between daily places): Do NOT show flight times. Show ONLY ground travel (distance + driving/walking time).
    4. localPulse: Identify real festivals/events in ${destination} on these dates. MUST be an array of simple strings.
    5. budgetAnalysis: Split ₹${formData.budget} logically. Total and perPerson must be simple strings (e.g., "₹50,000").
    6. weather icon: Use ONLY one real emoji (☀️, 🌧️, ☁️, 🌫️, 🌩️).
    7. DATA PRECISION: Ensure 'coordinates' are as accurate as possible for the specific landmark.

    JSON FORMAT (MANDATORY):
    {
      "localPulse": ["..."],
      "budgetAnalysis": { "total": "₹...", "perPerson": "₹...", "breakdown": { "stay": "₹...", "food": "₹...", "transport": "₹...", "FinancialWarning": "Put your funny low-budget explanation here if needed!" } },
      "initialLogistics": { "from": "${
        formData.origin
      }", "to": "Nearest Hub", "mode": "...", "distance": "km", "duration": "..." },
      "arrivalLogistics": { "from": "Hub", "to": "First Spot", "distance": "km", "duration": "..." },
      "weatherAndFestivalAdvice": "Describe ONLY the weather, temperature, and clothing to pack for ${formData.startDate}. ABSOLUTELY NO FINANCIAL OR BUDGET TALK.",
      "days": [{
        "dayNumber": 1, "date": "...", "cityLocation": "...",
        "weather": { "temp": "...", "condition": "...", "icon": "emoji", "advice": "..." },
        "dailyDose": { "recipe": "...", "movie": "...", "game": "..." },
        "places": [{
            "name": "...",
            "coordinates": { "lat": 0.0, "lng": 0.0 },
            "crowdAnalysis": { "peakHours": "...", "occupancy": 80, "status": "Busy", "waitFactor": "20 mins", "trend": "rising" },
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
      "estimatedTotalCost": "₹... total for ${formData.travelers} people"
    }`;

    const textResponse = await generateWithRetry(modelName, config, prompt);
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

    // Retry with key rotation for chat endpoint
    let lastError;
    for (let attempt = 0; attempt < apiKeys.length; attempt++) {
      try {
        const model = getActiveModel("gemini-2.5-flash-lite", {
          systemInstruction: systemInstruction,
        });
        const chat = model.startChat({ history: cleanHistory });
        const result = await chat.sendMessage(message);
        const chatResponse = await result.response;

        console.log("🤖 Chat Response Sent.");
        return res.json({ reply: chatResponse.text() });
      } catch (err) {
        lastError = err;
        const isQuotaError = err.message.includes("429") || err.message.includes("quota");
        if (isQuotaError && apiKeys.length > 1) {
          const prevIndex = currentKeyIndex;
          currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
          console.log(`⚠️ Chat: Quota on Key ${prevIndex + 1}. Rotating to Key ${currentKeyIndex + 1}...`);
        } else {
          throw err;
        }
      }
    }
    throw lastError;
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
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Sanchaara Server live on http://localhost:${PORT}`);
  console.log(
    `🔑 Key Status: ${apiKeys.length > 0 ? "CONFIGURED (" + apiKeys.length + " keys active)" : "MISSING"}`
  );
  console.log(`💡 Server PID: ${process.pid} — Press Ctrl+C to stop.`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use! Kill the other process first.`);
  } else {
    console.error(`❌ Server error:`, err);
  }
  process.exit(1);
});

// Catch silent crashes
process.on('uncaughtException', (err) => {
  console.error('💥 Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('💥 Unhandled Rejection:', reason);
});
