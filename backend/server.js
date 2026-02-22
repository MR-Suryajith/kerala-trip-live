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
const rateLimit = require("express-rate-limit");
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

// Fix #1: Restrict CORS to known origins only
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://sanchaara-ai.onrender.com",
  "https://sanchaara-ai.netlify.app"
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, Postman, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());

// Fix #2: Rate limit AI generation and packing-list endpoints (15 req/min per IP)
const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please wait a minute before trying again." },
});
app.use("/api/generate-itinerary", generationLimiter);
app.use("/api/packing-list", generationLimiter);


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


// =============================================================================
// INPUT SANITIZER — Fix #3: Prevent Prompt Injection
// =============================================================================

/**
 * Strips characters and phrases that could be used for prompt injection.
 * @param   {string} input  Raw user input.
 * @returns {string}        Sanitized input safe to embed in AI prompts.
 */
const sanitizeInput = (input) => {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/[`{}\[\]]/g, "")                                           // strip JSON/code chars
    .replace(/ignore all|forget|jailbreak|pretend|act as/gi, "")         // strip injection phrases
    .trim()
    .substring(0, 200);                                                   // cap length
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

    // --- Deduplication Guard (Fix #2: Bypass generic terms) ---
    // Scan all place names and remove exact duplicates, UNLESS they are generic meals/breaks.
    if (parsedData.days && Array.isArray(parsedData.days)) {
      const seenPlaces = new Map();
      const genericTerms = ["breakfast", "lunch", "dinner", "check", "rest", "relax", "travel", "drive", "transit"];

      parsedData.days.forEach((day) => {
        if (day.places && Array.isArray(day.places)) {
          day.places = day.places.filter((place) => {
            const key = (place.name || "").trim().toLowerCase();
            if (!key) return true;

            // Skip deduplication for generic transport/meal terms
            const isGeneric = genericTerms.some(term => key.includes(term));
            if (isGeneric) return true;

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

    // --- Structural Schema Validation (Fix #3) ---
    // Ensure the core days array exists to prevent React frontend crashes (.map is not a function)
    if (!parsedData.days || !Array.isArray(parsedData.days) || parsedData.days.length === 0) {
      throw new Error("AI returned JSON without a valid 'days' array.");
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
    // Fix #3: Sanitize all user inputs to prevent prompt injection
    const destination = sanitizeInput(formData.destination);
    const transportMode = sanitizeInput(formData.transportMode) || "Optimal";
    const originSafe = sanitizeInput(formData.origin);

    // --- Step 1: Geographical Validation (India Geofence) --- uses retry/rotation
    console.log(`🔍 Verifying destination: ${destination}`);
    const verifyPrompt = `Is the location "${destination}" situated within the country of INDIA?
    Reply strictly with only the word "TRUE" or "FALSE". If it's outside India, reply "FALSE".`;

    let isIndia = false;
    try {
      const verifyResponse = await generateWithRetry("gemini-2.5-flash-lite", {}, verifyPrompt, 2, 1000);
      isIndia = verifyResponse.trim().toUpperCase().includes("TRUE");
    } catch (verifyErr) {
      // Fix #4: Fail-closed — don't silently bypass validation
      console.error("⚠️ Geofence check failed:", verifyErr.message);
      return res.status(503).json({
        error: "Location verification is temporarily unavailable. Please try again in a moment.",
      });
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

    // --- Budget Tier Mapping ---
    const budgetTiers = {
      budget: { label: 'Budget', perDay: '₹800–1,500 per person/day', style: 'Hostels, dormitories, street food, public transport, free attractions' },
      comfort: { label: 'Comfort', perDay: '₹2,000–4,000 per person/day', style: '3-star hotels, mid-range restaurants, mix of private/public transport, paid attractions' },
      luxury: { label: 'Luxury', perDay: '₹6,000+ per person/day', style: '5-star resorts, fine dining, private car/flights, premium experiences, spa & wellness' },
    };
    const tier = budgetTiers[formData.budget] || budgetTiers.comfort;
    let budgetInstruction;
    if (formData.budget === 'custom' && formData.customBudget) {
      budgetInstruction = `Total Budget Limit: ₹${formData.customBudget} for ${formData.travelers} travelers over ${formData.days} days. Allocate this amount wisely.`;
    } else if (budgetTiers[formData.budget]) {
      budgetInstruction = `Budget Tier: ${tier.label} (${tier.perDay}). Style: ${tier.style}. Calculate the total budget as: ${formData.travelers} travelers × ${formData.days} days × per-day rate.`;
    } else {
      budgetInstruction = `Total Budget Limit: ₹${formData.budget}`;
    }

    // --- Step 3: Construct the AI Prompt ---
    const prompt = `Act as an expert Indian Travel Guide, Logistics Analyst, and Transport Director.
    Generate a highly realistic ${formData.days}-day road-trip/travel plan from ${originSafe} to ${destination}, India.
    Travelers: ${formData.travelers} | ${budgetInstruction} | Preferred Global Transport Mode: ${transportMode} | Interests: ${formData.interests.map(sanitizeInput).join(", ")} ${modificationNote}

    STRICT OUTPUT RULES:
    1. STRICT TIMELINES & TRAVEL PHYSICS (CRITICAL): You MUST use exact, chronological AM/PM timestamps for every \`place.time\`.
       - Account for real-world travel time in India! Average highway speed is ~60 km/h. Hill station speed is ~30 km/h.
       - If two places are 200km apart, their timestamps MUST be at least 4-6 hours apart. Do NOT schedule a 250km drive in 1.5 hours.
    2. TRANSIT & PITSTOPS: If there is a long drive/train between cities (>3 hours), you MUST schedule realistic pitstops (e.g., "Breakfast on the way at X") and include them as items in the \`places\` array with accurate chronological timestamps (e.g., 3 hours after departure time).
    3. INITIAL TRANSIT (${formData.origin} to nearest hub for ${destination}): YOU MUST use the preferred mode "${transportMode}" if possible.
       - STILL GENERATE the plan using this mode regardless of budget tier.
    4. BUDGET WARNINGS: If the budget tier seems too low for the trip, put a funny warning inside \`budgetAnalysis.breakdown.FinancialWarning\`. You are FORBIDDEN from putting budget warnings in \`weatherAndFestivalAdvice\`.
    5. LOCAL TRANSIT (CRITICAL RULE): Do NOT show flight times between local daily places. Show ONLY ground travel (distance + driving/walking time).
       - Day 1 \`places\` array MUST start at ${destination} or the nearest arrival hub in that region! Do NOT include ${formData.origin} or the departure airport in the \`places\` array, otherwise, the map will try to draw a 40-hour driving route! The \`initialLogistics\` block handles the long-haul transit.
    6. OPTIONAL DETOURS: If a specific viewpoint or activity requires a long detour that might be skipped due to time/traffic, set \`isOptional: true\` for that place. Otherwise, set it to \`false\`.
    7. localPulse: Identify real festivals/events in ${destination} on these dates. MUST be an array of simple strings.
    8. UNIQUE AND EXPLICIT NAMES FOR MAPS (CRITICAL): Every single \`place.name\` MUST be unique and explicit. If a place is generic (e.g., "Coffee Estate", "Viewpoint"), you MUST append the city and state name to it (e.g., "Coffee Estate, Chikmagalur, Karnataka").
       - Google Maps uses these exact names. If you just write "Coffee Estate", Google Maps will draw a 15-hour route to a random estate in another state! Always append the specific city name to ensure local routing.

    JSON FORMAT (MANDATORY):
    {
      "localPulse": ["..."],
      "budgetAnalysis": { "total": "₹...", "perPerson": "₹...", "breakdown": { "stay": "₹...", "food": "₹...", "transport": "₹...", "FinancialWarning": "Put your funny low-budget explanation here if needed!" } },
      "initialLogistics": { "from": "${formData.origin}", "to": "Nearest Hub", "mode": "...", "distance": "km", "duration": "..." },
      "arrivalLogistics": { "from": "Hub", "to": "First Spot", "distance": "km", "duration": "..." },
      "days": [{
        "dayNumber": 1, "date": "...", "cityLocation": "...", "drivingRoute": "Actual cities passed through today, e.g. Aluva -> Thrissur -> Palakkad -> Coonoor",
        "nearbyHighlights": { "parks": "Name or omit if none", "theatres": "Name or omit if none", "shopping": "Name or omit if none", "viewpoint": "Name or omit if none" },
        "places": [{
            "name": "...",
            "coordinates": { "lat": 0.0, "lng": 0.0 },
            "crowdAnalysis": { "peakHours": "...", "occupancy": 80, "status": "Busy", "waitFactor": "20 mins", "trend": "rising" },
            "rank": 9.5,
            "time": "06:00 AM",
            "isOptional": false,
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
          // Fix #3: Small delay to let the new key's connection initialize
          await new Promise((res) => setTimeout(res, 500));
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

    // Fix #5: Don't make API call with unknown codes
    if (!originCode || !destCode) {
      console.log(`⚠️ Flight Search skipped: Unknown IATA code for "${!originCode ? origin : destination}"`);
      return res.json({ flights: [], error: `Airport not found for ${!originCode ? origin : destination}. Try a major city.` });
    }

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

    // Fix #5: Don't make API call with unknown codes
    if (!cityCode) {
      console.log(`⚠️ Hotel Search skipped: Unknown IATA code for "${destination}"`);
      return res.json({ hotels: [], error: `City not found in lookup: ${destination}` });
    }

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


// =============================================================================
// API ENDPOINT: LIVE WEATHER PROXY
// =============================================================================

app.get("/api/weather", async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: "Missing coordinates" });

    const API_KEY = process.env.OPENWEATHER_API_KEY;
    if (!API_KEY) return res.status(500).json({ error: "Weather API key not configured" });

    // Fetch 5-day / 3-hour forecast data
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

    // Fallback to cross-fetch or global fetch
    const fetchMod = await import('node-fetch');
    const fetchFunc = fetchMod.default || fetchMod;

    const response = await fetchFunc(url);
    if (!response.ok) throw new Error(`Weather API returned status: ${response.status}`);

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("❌ Weather API Error:", error.message);
    res.status(500).json({ error: "Failed to fetch live weather data" });
  }
});

// =============================================================================
// API ENDPOINT: SMART PACKING LIST (Groq / Llama 3.3)
// =============================================================================
// Uses a separate AI provider (Groq) to avoid Gemini quota consumption.

const Groq = require("groq-sdk");
const groqClient = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

app.post("/api/packing-list", async (req, res) => {
  try {
    if (!groqClient) {
      return res.status(500).json({ error: "Groq API key not configured." });
    }

    const { destination, days, weather, activities, travelers } = req.body;

    const prompt = `You are an expert travel packing assistant for DOMESTIC INDIA travel. The traveler is an Indian citizen traveling WITHIN India. Generate a smart packing checklist for this trip:
    - Destination: ${destination}, India
    - Duration: ${days} days
    - Weather: ${weather || "Unknown"}
    - Activities: ${activities || "General sightseeing"}
    - Travelers: ${travelers || 1} people

    Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
    {
      "categories": [
        {
          "name": "Clothing",
          "icon": "shirt",
          "items": ["Item 1", "Item 2"]
        },
        {
          "name": "Toiletries & Health",
          "icon": "heart",
          "items": ["Item 1", "Item 2"]
        },
        {
          "name": "Electronics",
          "icon": "zap",
          "items": ["Item 1", "Item 2"]
        },
        {
          "name": "Documents & Money",
          "icon": "file",
          "items": ["Item 1", "Item 2"]
        },
        {
          "name": "Essentials",
          "icon": "backpack",
          "items": ["Item 1", "Item 2"]
        }
      ]
    }

    Rules:
    - This is DOMESTIC travel within India. NEVER suggest passport, visa, or any international travel documents.
    - For documents, suggest: Aadhaar Card, Driving License, train/flight tickets, hotel bookings, etc.
    - Keep items practical and specific to the destination/weather
    - Max 6-8 items per category
    - Include destination-specific items (e.g., rain gear for monsoon Kerala, sunscreen for Goa beaches, warm layers for Manali)
    - No generic filler items`;

    console.log(`🎒 Generating packing list for ${destination} (${days} days)`);

    const chatCompletion = await groqClient.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      max_completion_tokens: 1024,
    });

    const responseText = chatCompletion.choices[0]?.message?.content || "";

    // Extract JSON from response
    const jsonStart = responseText.indexOf("{");
    const jsonEnd = responseText.lastIndexOf("}") + 1;
    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error("No valid JSON in Groq response");
    }

    const packingList = JSON.parse(responseText.substring(jsonStart, jsonEnd));
    console.log("✅ Packing list generated successfully.");
    res.json(packingList);

  } catch (error) {
    console.error("❌ Packing List Error:", error.message);
    res.status(500).json({ error: "Could not generate packing list. Please try again." });
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
