/**
 * ============================================================================
 * SANCHAARA AI — Backend Server
 * ============================================================================
 *
 * @description  Express.js server powering the Sanchaara AI travel planning
 *               platform. Handles itinerary generation and chatbot features
 *               using the Google Gemini Generative AI API.
 *
 * @features     - Multi-key API rotation with automatic failover on quota limits
 *               - India geofence validation for destination queries
 *               - Intelligent retry with exponential backoff (429 / 503 errors)
 *               - JSON response sanitization (hallucination guard)
 *
 * @tech         Node.js, Express.js, Google Generative AI SDK
 * @model        gemini-2.5-flash-lite
 * @port         5000 (default) or process.env.PORT
 *
 * @author       Suryajith
 * ============================================================================
 */

const express = require("express");
const cors = require("cors");
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
require("dotenv").config();

const app = express();


// =============================================================================
// MIDDLEWARE CONFIGURATION
// =============================================================================

app.use(cors({ origin: "*" }));
app.use(express.json());


// =============================================================================
// MULTI-KEY ROTATION SETUP
// =============================================================================
// Supports up to 3 named keys + a fallback generic key.
// Keys from SEPARATE Google accounts provide true quota expansion.

const apiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY,
].filter(Boolean);

if (apiKeys.length === 0) {
  console.warn("⚠️ WARNING: No Gemini API keys found in the environment variables!");
}

/** @type {number} Index of the currently active API key in the rotation pool. */
let currentKeyIndex = 0;


// =============================================================================
// CORE HELPER FUNCTIONS
// =============================================================================

/**
 * Creates a fresh Gemini GenAI model instance using the currently active key.
 *
 * @param   {string} modelName  - The Gemini model identifier (e.g., "gemini-2.5-flash-lite").
 * @param   {object} config     - Optional generation/safety configuration overrides.
 * @returns {GenerativeModel}     A configured Gemini model instance.
 */
const getActiveModel = (modelName, config = {}) => {
  const genAI = new GoogleGenerativeAI(apiKeys[currentKeyIndex]);
  return genAI.getGenerativeModel({ model: modelName, ...config });
};

/**
 * Generates AI content with automatic retry logic and multi-key rotation.
 *
 * - On 429 (Quota) errors:  Instantly rotates to the next API key.
 * - On 503 (Overloaded):    Retries with exponential backoff.
 * - On other errors:        Throws immediately.
 *
 * @param   {string} modelName  - The Gemini model identifier.
 * @param   {object} config     - Generation/safety configuration.
 * @param   {string} prompt     - The prompt string to send.
 * @param   {number} retries    - Base number of retry attempts (default: 3).
 * @param   {number} delay      - Initial delay in ms between retries (default: 2000).
 * @returns {string}              The raw text response from the AI.
 * @throws  {Error}               If all retries and key rotations are exhausted.
 */
const generateWithRetry = async (modelName, config, prompt, retries = 3, delay = 2000) => {
  let attempt = 0;
  const maxAttempts = retries + apiKeys.length;

  while (attempt < maxAttempts) {
    try {
      const model = getActiveModel(modelName, config);
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      if (!responseText || responseText.trim().length === 0) {
        throw new Error("AI returned empty content");
      }
      return responseText;
    } catch (error) {
      attempt++;

      const isQuotaError = error.message.includes("429") || error.message.includes("quota") || error.message.includes("RESOURCE_EXHAUSTED") || error.message.includes("rate limit") || error.message.includes("exhausted");
      const isOverloaded = error.message.includes("503") || error.message.includes("overloaded");

      if (isQuotaError) {
        if (apiKeys.length > 1) {
          const prevIndex = currentKeyIndex;
          currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
          console.log(`⚠️ Quota on Key ${prevIndex + 1}/${apiKeys.length}. Rotating to Key ${currentKeyIndex + 1}...`);
          // Small delay to let the new key's connection initialize
          await new Promise((res) => setTimeout(res, 500));
        } else {
          console.log(`⚠️ Quota reached (single key). Retrying in ${delay}ms... (${attempt}/${maxAttempts})`);
          await new Promise((res) => setTimeout(res, delay));
          delay *= 2;
        }
      } else if (isOverloaded && attempt < maxAttempts) {
        console.log(`⚠️ Server overloaded. Retrying in ${delay}ms... (${attempt}/${maxAttempts})`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
  throw new Error("All API keys exhausted or servers at capacity. Please wait a moment.");
};

/**
 * Extracts valid JSON from AI text output and applies post-processing.
 *
 * Post-processing includes:
 *  1. Remapping `weatherAndFestivalAdvice` → `seasonalNote` (schema trick).
 *  2. Intercepting leaked financial text from `seasonalNote` (hallucination guard).
 *
 * @param   {string} text  - Raw text response from the Gemini API.
 * @returns {object}         Parsed and sanitized JSON itinerary object.
 * @throws  {Error}          If no valid JSON structure is found.
 */
const cleanAndParseJSON = (text) => {
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}") + 1;
    if (start === -1 || end === 0) {
      throw new Error("No JSON structure found in response");
    }

    const jsonString = text.substring(start, end);
    const parsedData = JSON.parse(jsonString);

    // --- Schema Remapping ---
    // The prompt uses "weatherAndFestivalAdvice" to prevent the AI from
    // dumping financial text into it. We remap it to "seasonalNote" for
    // frontend compatibility.
    if (parsedData.weatherAndFestivalAdvice) {
      parsedData.seasonalNote = parsedData.weatherAndFestivalAdvice;
      delete parsedData.weatherAndFestivalAdvice;
    } else if (!parsedData.seasonalNote) {
      parsedData.seasonalNote = "Pleasant weather expected. Pack comfortable clothing suitable for exploring.";
    }

    // --- Hallucination Guard ---
    // If the AI still leaks financial terms into seasonalNote, intercept
    // and relocate the text to the budgetAnalysis section.
    if (parsedData.seasonalNote) {
      const note = parsedData.seasonalNote.toLowerCase();
      const hasFinancialTerm =
        note.includes("₹") || note.includes("rs") ||
        note.includes("budget") || note.includes("cost") ||
        note.includes("price") || note.includes("expensive");

      if (hasFinancialTerm) {
        console.log("🛡️ Hallucination Guard: Relocated financial text from seasonalNote.");
        if (!parsedData.budgetAnalysis) parsedData.budgetAnalysis = { breakdown: {} };
        if (!parsedData.budgetAnalysis.breakdown) parsedData.budgetAnalysis.breakdown = {};
        parsedData.budgetAnalysis.breakdown["Financial Advisor Note"] = parsedData.seasonalNote;
        parsedData.seasonalNote = "Pleasant weather expected. Pack comfortable clothing suitable for exploring.";
      }
    }

    // --- Deduplication Guard ---
    // Scan all place names across all days and rename duplicates.
    if (parsedData.days && Array.isArray(parsedData.days)) {
      const seenPlaces = new Map();
      parsedData.days.forEach((day) => {
        if (day.places && Array.isArray(day.places)) {
          day.places = day.places.filter((place) => {
            const key = (place.name || "").trim().toLowerCase();
            if (!key) return true;
            if (seenPlaces.has(key)) {
              console.log(`🛡️ Dedup Guard: Removed duplicate place "${place.name}" from Day ${day.dayNumber}.`);
              return false;
            }
            seenPlaces.set(key, true);
            return true;
          });
        }
      });
    }

    return parsedData;
  } catch (error) {
    console.error("❌ JSON Extraction Failed. Raw Output:", text);
    throw new Error("The AI provided an invalid travel data format. Please try again.");
  }
};


// =============================================================================
// API ENDPOINT: ITINERARY GENERATION
// =============================================================================

app.post("/api/generate-itinerary", async (req, res) => {
  try {
    const { formData } = req.body;
    const destination = formData.destination ? formData.destination.trim() : "";
    const transportMode = formData.transportMode ? formData.transportMode.trim() : "Optimal";

    // --- Step 1: Geographical Validation (India Geofence) --- uses retry/rotation
    console.log(`🔍 Verifying destination: ${destination}`);
    const verifyPrompt = `Is the location "${destination}" situated within the country of INDIA?
    Reply strictly with only the word "TRUE" or "FALSE". If it's outside India, reply "FALSE".`;

    let isIndia = false;
    try {
      const verifyResponse = await generateWithRetry("gemini-2.5-flash-lite", {}, verifyPrompt, 2, 1000);
      isIndia = verifyResponse.trim().toUpperCase().includes("TRUE");
    } catch (verifyErr) {
      console.error("⚠️ Geofence check failed, allowing request through:", verifyErr.message);
      isIndia = true; // fail-open so user isn't blocked by quota on validation
    }

    if (!isIndia) {
      return res.status(400).json({
        error: "Sanchaara AI is currently optimized for Incredible India. Please enter a destination within India (e.g., Manali, Goa, Munnar, or Jaipur).",
      });
    }

    // --- Step 2: Configure Generation Model ---
    const modelName = "gemini-2.5-flash-lite";
    const config = {
      generationConfig: {
        temperature: 0.4,
        responseMimeType: "application/json",
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT,  threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    };

    console.log(`✈️ Planning Journey: ${formData.origin} ➔ ${destination}`);

    // Handle Plan B swap instructions
    const modificationNote = formData.specialInstruction
      ? `\n⚠️ SPECIAL MODIFICATION: ${formData.specialInstruction}. You MUST adjust the itinerary to reflect this change.`
      : "";

    // --- Step 3: Construct the AI Prompt ---
    const prompt = `Act as an expert Indian Travel Guide, Logistics Analyst, and Financial Planner.
    Generate a ${formData.days}-day travel plan from ${formData.origin} to ${destination}, India.
    Travelers: ${formData.travelers} | Total Budget Limit: ₹${formData.budget} | Preferred Global Transport Mode: ${transportMode} | Interests: ${formData.interests.join(", ")} ${modificationNote}

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
    8. UNIQUE PLACES (CRITICAL): Every single place across ALL days MUST be unique. NEVER repeat the same place on different days. If you run out of well-known spots, suggest hidden gems, local markets, nature trails, viewpoints, temples, cultural workshops, or artisan villages. Variety is paramount.

    JSON FORMAT (MANDATORY):
    {
      "localPulse": ["..."],
      "budgetAnalysis": { "total": "₹...", "perPerson": "₹...", "breakdown": { "stay": "₹...", "food": "₹...", "transport": "₹...", "FinancialWarning": "Put your funny low-budget explanation here if needed!" } },
      "initialLogistics": { "from": "${formData.origin}", "to": "Nearest Hub", "mode": "...", "distance": "km", "duration": "..." },
      "arrivalLogistics": { "from": "Hub", "to": "First Spot", "distance": "km", "duration": "..." },
      "weatherAndFestivalAdvice": "Describe ONLY the weather, temperature, and clothing to pack for ${formData.startDate}. ABSOLUTELY NO FINANCIAL OR BUDGET TALK.",
      "days": [{
        "dayNumber": 1, "date": "...", "cityLocation": "...",
        "weather": { "temp": "...", "condition": "...", "icon": "emoji", "advice": "..." },
        "nearbyHighlights": { "parks": "Name or omit if none", "theatres": "Name or omit if none", "shopping": "Name or omit if none", "viewpoint": "Name or omit if none" },
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

    // --- Step 4: Generate & Parse ---
    const textResponse = await generateWithRetry(modelName, config, prompt);
    const finalItinerary = cleanAndParseJSON(textResponse);

    res.json(finalItinerary);
    console.log("✅ Itinerary successfully generated and sent.");
  } catch (error) {
    console.error("❌ Itinerary Endpoint Error:", error.message);
    res.status(500).json({
      error: "Sanchaara AI is currently busy. Please wait a moment and try again.",
      details: error.message,
    });
  }
});


// =============================================================================
// API ENDPOINT: CHATBOT
// =============================================================================

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, itineraryContext } = req.body;

    // Build system instruction based on whether an itinerary exists
    let systemInstruction =
      "You are SANCHAARA AI, a concise travel concierge for INCREDIBLE INDIA. Rules: Friendly, max 2 sentences, use emojis.";
    if (itineraryContext) {
      systemInstruction += ` The user is exploring ${itineraryContext.destination}. Current spots: ${itineraryContext.placesMentioned?.join(", ")}. Answer accordingly.`;
    }

    // Sanitize chat history (Gemini expects: user → model → user)
    let cleanHistory = (history || []).filter(
      (item) => item.parts && item.parts[0] && item.parts[0].text.trim() !== ""
    );
    if (cleanHistory.length > 0 && cleanHistory[0].role === "model") {
      cleanHistory.shift();
    }
    if (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === "user") {
      cleanHistory.pop();
    }

    // Retry with key rotation on quota errors
    let lastError;
    for (let attempt = 0; attempt < apiKeys.length; attempt++) {
      try {
        const model = getActiveModel("gemini-2.5-flash-lite", {
          systemInstruction: systemInstruction,
        });
        const chat = model.startChat({ history: cleanHistory });
        const result = await chat.sendMessage(message);
        const chatResponse = await result.response;

        console.log("🤖 Chat response sent.");
        return res.json({ reply: chatResponse.text() });
      } catch (err) {
        lastError = err;
        const isQuotaError = err.message.includes("429") || err.message.includes("quota") || err.message.includes("RESOURCE_EXHAUSTED") || err.message.includes("rate limit") || err.message.includes("exhausted");
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
      reply: "I'm experiencing high traffic from other travelers. Please ask me again in a few seconds! 🇮🇳",
    });
  }
});


// =============================================================================
// API ENDPOINTS: BOOKING INTEGRATIONS (Informational Only)
// =============================================================================

const booking = require("./bookingService");

/**
 * POST /api/search-flights
 * Searches for flight offers via Amadeus API.
 */
app.post("/api/search-flights", async (req, res) => {
  try {
    const { origin, destination, date, adults } = req.body;
    const originCode = booking.resolveIATACode(origin);
    const destCode = booking.resolveIATACode(destination);

    console.log(`✈️ Flight Search: ${originCode} → ${destCode} on ${date}`);
    const flights = await booking.searchFlights(originCode, destCode, date, adults || 1);
    res.json({ flights });
  } catch (error) {
    console.error("❌ Flight Search Error:", error.message);
    res.status(200).json({ flights: [], error: error.message });
  }
});

/**
 * POST /api/search-hotels
 * Searches for hotels near the destination via Amadeus API.
 */
app.post("/api/search-hotels", async (req, res) => {
  try {
    const { destination } = req.body;
    const cityCode = booking.resolveIATACode(destination);

    console.log(`🏨 Hotel Search: ${cityCode}`);
    const hotels = await booking.searchHotels(cityCode);
    res.json({ hotels });
  } catch (error) {
    console.error("❌ Hotel Search Error:", error.message);
    res.status(200).json({ hotels: [], error: error.message });
  }
});

/**
 * POST /api/search-trains
 * Searches for trains between stations via RapidAPI.
 */
app.post("/api/search-trains", async (req, res) => {
  try {
    const { origin, destination, date } = req.body;
    const fromCode = booking.resolveStationCode(origin);
    const toCode = booking.resolveStationCode(destination);

    console.log(`🚆 Train Search: ${fromCode} → ${toCode} on ${date}`);
    const trains = await booking.searchTrains(fromCode, toCode, date);
    res.json({ trains });
  } catch (error) {
    console.error("❌ Train Search Error:", error.message);
    res.status(200).json({ trains: [], error: error.message });
  }
});



const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Sanchaara Server live on http://localhost:${PORT}`);
  console.log(`🔑 Key Status: ${apiKeys.length > 0 ? "CONFIGURED (" + apiKeys.length + " keys active)" : "MISSING"}`);
  console.log(`💡 Server PID: ${process.pid} — Press Ctrl+C to stop.`);
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use! Kill the other process first.`);
  } else {
    console.error("❌ Server error:", err);
  }
  process.exit(1);
});

// Global crash handlers — prevents silent exits
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
});
