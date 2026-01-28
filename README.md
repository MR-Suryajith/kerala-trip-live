**SANCHAARA AI: Intelligent Indian Odyssey Planner**

**SANCHAARA AI** is a cutting-edge, full-stack travel ecosystem designed to revolutionize how travelers explore Incredible India. Leveraging the reasoning power of **Google Gemini 2.5 Flash-lite**, it transforms static searches into dynamic, logistics-aware, and highly personalized journeys.

**Live Demo:** [sanchaara-ai.netlify.app](https://sanchaara-ai.netlify.app)

---

## ✨ Core Innovations

### 🤖 Generative Neural Itineraries

Unlike traditional planners, Sanchaara uses LLMs to perform multi-variable reasoning (budget vs. distance vs. interests) to create a logical 24-hour cycle from scratch.

### 🛡️ The Survival Grid (Geospatial Integration)

Integrates the **Overpass API (OpenStreetMap)** to provide 100% accurate, live locations for essential services like **Hospitals, ATMs, and Pharmacies** within a 2km radius of any landmark.

### 📊 Predictive Crowd Analyzer

Uses AI-synthesized data to forecast landmark occupancy. A visual heatmap provides users with "Peak Hours" and "Wait Factors" to optimize their visit times.

### 🌤️ Seasonal & Local Intelligence

A real-time "Local Pulse" ticker displays festivals and events occurring during the user's specific travel dates. The AI adjusts logic based on the month (e.g., prioritizing waterfalls during monsoons).

### 💸 Financial Intelligence

Automated group budget decomposition into Accommodation, Food, and Transit, including a "Cost Per Head" share calculation for group travelers.

---

## 🛠️ Technical Stack

- **Frontend:** React.js, Tailwind CSS (v3.4), Lucide-React Icons.
- **Backend:** Node.js, Express.js.
- **AI Engine:** Google Gemini 2.5 Flash & 1.5 Flash.
- **Data APIs:** Overpass API (OSM), Google Maps Embed API.
- **Export:** jsPDF (Vector-based high-quality document generation).
- **Deployment:** Netlify (Frontend) & Render.com (Backend).

---

## 📂 Project Structure

```text
KERALA-LIVE-MAIN/
├── backend/              # Node.js Express Server
│   ├── server.js         # AI Logic & API Endpoints
│   └── .env              # Private API Keys
├── public/               # Static Assets & PWA Config
│   └── _redirects        # Netlify Routing Rules
├── src/
│   ├── components/       # Reusable UI Components (Glassmorphism)
│   ├── services/         # API Service Layer (Gemini/Overpass)
│   ├── App.jsx           # Main Application Logic
│   └── index.css         # Global Styles & Custom Animations
└── build/                # Optimized Production Build (Deployable)


 1. Prerequisites & API Keys
To run Sanchaara AI, you will need:
- **Node.js:** v18.0 or higher.
- **Google Gemini API Key:** Required for the AI engine. Get it for free at [Google AI Studio](https://aistudio.google.com/).
- **OpenStreetMap (Overpass API):** Integrated via public endpoints. **No API key required** (Rate-limited public access).
- **Google Maps Embed:** Utilizes the free public embedder. No billing required for basic route visualization.

Geospatial Intelligence: Sanchaara AI utilizes the Overpass API to perform real-time queries against the OpenStreetMap (OSM) global database. This enables the "Survival Grid" feature to locate physical nodes (Hospitals, ATMs) with 100% accuracy based on GPS coordinates.


2. Backend Setup
code
<>Bash
cd backend
npm install
# Create a .env file and add: GEMINI_API_KEY=your_key
node server.js


3. Frontend Setup
code
<>Bash
# In the root directory
npm install
npm start
```
