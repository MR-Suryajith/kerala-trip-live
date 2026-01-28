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

````text
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

1.rerequisites
Node.js installed.
A Gemini API Key from Google AI Studio.



Here is a professional and comprehensive README.md tailored exactly to your project structure and features. I have also explained the relevance of the build folder below.
Relevance of the build/static folder
The build folder (specifically static/css and static/js) is the most important folder for your live website, but it is not for you to edit.
Production Readiness: Browsers cannot read the JSX or Tailwind code you write in the src folder. When you run npm run build, React converts your code into highly optimized, minified, and compressed JavaScript and CSS files.
Performance: These files are "bundled" together so the website loads instantly. The strange numbers in the filenames (e.g., main.a1b2c3d4.js) are "hashes" that help browsers handle caching efficiently.
Deployment: This is the folder Netlify or Render actually looks at to show your site to the world. Your src folder is for development; the build folder is for the users.
The Professional README.md for SANCHAARA AI
Paste this into your README.md file:
code
Markdown
# 🌴 SANCHAARA AI: Intelligent Indian Odyssey Planner 🌊

**SANCHAARA AI** is a cutting-edge, full-stack travel ecosystem designed to revolutionize how travelers explore Incredible India. Leveraging the reasoning power of **Google Gemini 2.5 Flash**, it transforms static searches into dynamic, logistics-aware, and highly personalized journeys.

🚀 **Live Demo:** [sanchaara-ai.netlify.app](https://sanchaara-ai.netlify.app)

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
🚀 Getting Started
1. Prerequisites
Node.js installed.
A Gemini API Key from Google AI Studio.

2. Backend Setup
code
Bash
cd backend
npm install
# Create a .env file and add: GEMINI_API_KEY=your_key
node server.js


3. Frontend Setup
code
Bash
# In the root directory
npm install
npm start
````
