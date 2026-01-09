# KeralaLive Trip Planner - Phase 1 Setup & Complete Code

## Initial Setup (Run in Terminal)

```bash
npx create-react-app keralalive-trip-planner
cd keralalive-trip-planner

npm install @google/generative-ai firebase axios tailwindcss
npx tailwindcss init -p
```

## Project Folder Structure for Phase 1

```
keralalive-trip-planner/
├── src/
│   ├── components/
│   │   ├── TripForm.jsx
│   │   └── ItineraryDisplay.jsx
│   ├── services/
│   │   ├── gemini.js
│   │   └── firebase.js
│   ├── App.jsx
│   ├── App.css
│   └── index.js
├── .env.local
├── tailwind.config.js
├── public/
└── package.json
```

## Step 1: .env.local (API Keys)

Create `.env.local` in root and add:

```
REACT_APP_GEMINI_API_KEY=your_gemini_api_key_here
REACT_APP_FIREBASE_API_KEY=your_firebase_key
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
```

Get Gemini key from: https://ai.google.dev/aistudio/

## Step 2: tailwind.config.js (Already generated, just ensure it's there)

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

## Phase 1 - Complete File Code (Copy Paste in VS Code)

### services/gemini.js - ML Itinerary Generator

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

export async function generateItinerary(formData) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Build Kerala-specific prompt
    const prompt = `Generate a Kerala-only ${formData.days}-day trip itinerary.
Origin: ${formData.origin} (Haryana).
Budget: ${formData.budget} (low/moderate/high).
Interests: ${formData.interests.join(', ')}.

IMPORTANT: 
- Only Kerala destinations (Kochi, Munnar, Alleppey, Wayanad, Varkala, Thekkady, etc.)
- Each day 3-5 places maximum
- Include travel time between places
- Return ONLY valid JSON, no markdown code blocks

Return as valid JSON:
{
  "days": [
    {
      "dayNumber": 1,
      "date": "Day 1",
      "places": [
        {
          "name": "place name",
          "time": "9:00 AM - 12:00 PM",
          "type": "hill_station/beach/backwater/temple/city",
          "description": "short description",
          "estimatedCost": "₹500-1000",
          "travelTimeFromPrevious": "3 hours by bus"
        }
      ]
    }
  ],
  "totalDays": ${formData.days},
  "estimatedTotalCost": "₹8000-15000"
}`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    
    // Clean JSON if wrapped in markdown
    let cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const itinerary = JSON.parse(cleanedText);
    
    return itinerary;
  } catch (error) {
    console.error('Gemini error:', error);
    throw new Error('Failed to generate itinerary');
  }
}
```

**Explanation:** 
- Uses Gemini 1.5 Flash (free tier, 15 RPM limit)
- Sends Kerala-specific prompt with structured JSON request
- Cleans markdown formatting from response
- Error handling for API failures

---

### components/TripForm.jsx - Form Input

```javascript
import { useState } from 'react';
import { generateItinerary } from '../services/gemini';

const interestOptions = [
  'beach',
  'backwater',
  'hill_station',
  'temple',
  'wildlife',
  'ayurveda',
  'city',
  'houseboat'
];

export default function TripForm({ onItinerary, onLoading }) {
  const [formData, setFormData] = useState({
    origin: 'Narnaund, Haryana',
    days: '4',
    budget: 'moderate',
    interests: ['backwater', 'beach']
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    onLoading(true);
    setError('');

    try {
      const itinerary = await generateItinerary(formData);
      onItinerary(itinerary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  const handleInterestChange = (interest) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-lg p-8 space-y-6">
        
        {/* Origin Input */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Starting Point (Haryana/NCR)</label>
          <input
            type="text"
            value={formData.origin}
            onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
            placeholder="e.g., Narnaund, Haryana"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
            required
          />
        </div>

        {/* Days */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Trip Duration</label>
          <select
            value={formData.days}
            onChange={(e) => setFormData({ ...formData, days: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
          >
            <option value="2">2 days</option>
            <option value="3">3 days</option>
            <option value="4">4 days</option>
            <option value="5">5 days</option>
            <option value="7">7 days</option>
          </select>
        </div>

        {/* Budget */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Budget</label>
          <select
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
          >
            <option value="low">Low (₹500-800/day)</option>
            <option value="moderate">Moderate (₹1000-2000/day)</option>
            <option value="high">High (₹3000+/day)</option>
          </select>
        </div>

        {/* Interests */}
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Interests (Select Multiple)</label>
          <div className="grid grid-cols-2 gap-4">
            {interestOptions.map(interest => (
              <label key={interest} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.interests.includes(interest)}
                  onChange={() => handleInterestChange(interest)}
                  className="w-4 h-4 text-green-500 cursor-pointer"
                />
                <span className="ml-2 text-gray-700 capitalize">{interest.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white font-bold py-3 rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? '🔄 Generating Kerala Itinerary...' : '✈️ Generate My Trip'}
        </button>
      </form>
    </div>
  );
}
```

**Explanation:**
- Controlled form inputs (React state)
- Multiple interest checkboxes for Kerala attractions
- Loading state during Gemini API call
- Error display for API failures
- Tailwind CSS for responsive styling

---

### components/ItineraryDisplay.jsx - Results Display

```javascript
import React from 'react';

export default function ItineraryDisplay({ itinerary, onEdit }) {
  if (!itinerary || !itinerary.days) {
    return <div className="text-center text-gray-500">Loading itinerary...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-center text-white mb-2">Your Kerala Itinerary</h2>
        <p className="text-center text-white text-lg">
          {itinerary.totalDays} Days | Estimated Budget: {itinerary.estimatedTotalCost}
        </p>
        <button
          onClick={onEdit}
          className="mt-4 mx-auto block bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600"
        >
          ← Edit Trip
        </button>
      </div>

      <div className="space-y-6">
        {itinerary.days.map((day, dayIndex) => (
          <div key={dayIndex} className="bg-white shadow-lg rounded-lg overflow-hidden">
            
            {/* Day Header */}
            <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6">
              <h3 className="text-2xl font-bold">{day.date}</h3>
            </div>

            {/* Places in Day */}
            <div className="p-6 space-y-4">
              {day.places && day.places.map((place, placeIndex) => (
                <div key={placeIndex} className="border-l-4 border-green-500 pl-4 py-3 bg-gray-50 rounded">
                  
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-800">{place.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize mr-2">
                          {place.type.replace('_', ' ')}
                        </span>
                        <span className="text-green-600 font-semibold">⏰ {place.time}</span>
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-700 mt-2">{place.description}</p>

                  <div className="mt-3 flex justify-between text-sm text-gray-600">
                    <span>💰 {place.estimatedCost}</span>
                    {place.travelTimeFromPrevious && (
                      <span>🚗 {place.travelTimeFromPrevious}</span>
                    )}
                  </div>

                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-8 bg-white shadow-lg rounded-lg p-6 text-center">
        <p className="text-gray-700 text-lg">
          Ready to explore Kerala? 🌴
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Phase 2 coming soon: Live traffic alerts, place ranking, and AI chat assistant!
        </p>
      </div>
    </div>
  );
}
```

**Explanation:**
- Maps over itinerary days and places
- Color-coded badges for place types
- Displays time, cost, travel info
- Edit button to return to form
- Clean Tailwind card layout

---

### App.jsx - Main Component

```javascript
import { useState } from 'react';
import TripForm from './components/TripForm';
import ItineraryDisplay from './components/ItineraryDisplay';

function App() {
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 via-blue-400 to-green-600 py-12 px-4">
      
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white drop-shadow-lg mb-2">
          🌴 KeralaLive Trip Planner 🌊
        </h1>
        <p className="text-xl text-white drop-shadow-lg">
          AI-Powered Kerala Itineraries with Live Updates
        </p>
      </div>

      {/* Main Content */}
      <div className={`transition-all ${loading ? 'opacity-70' : 'opacity-100'}`}>
        {!itinerary ? (
          <TripForm onItinerary={setItinerary} onLoading={setLoading} />
        ) : (
          <ItineraryDisplay itinerary={itinerary} onEdit={() => setItinerary(null)} />
        )}
      </div>

      {/* Footer */}
      <footer className="text-center mt-16 text-white text-sm">
        <p>© 2026 KeralaLive | Made with ❤️ for AI/ML Students</p>
      </footer>
    </div>
  );
}

export default App;
```

**Explanation:**
- Top-level state for itinerary
- Conditional render: form or display
- Loading state indicator
- Gradient background with Kerala theme

---

### src/index.css - Tailwind Base

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
}
```

---

## How to Run Phase 1

1. **Start development server:**
   ```bash
   npm start
   ```

2. **Fill the form:**
   - Origin: Narnaund, Haryana
   - Duration: 4 days
   - Budget: Moderate
   - Interests: beach, backwater

3. **Click "Generate My Trip"**
   - Wait 2-3 seconds for Gemini API response
   - See Kerala itinerary displayed

4. **Edit Trip:**
   - Click "← Edit Trip" to generate new itinerary

---

## Testing Checklist ✓

- [ ] Form loads with pre-filled values
- [ ] All interest checkboxes work
- [ ] Loading spinner shows during generation
- [ ] Itinerary displays with correct structure
- [ ] Days and places render properly
- [ ] Edit button returns to form
- [ ] No console errors

---

## Deploy to Vercel (Free)

```bash
npm install -g vercel
vercel
# Add .env.local values when prompted
```

---

## Next Phase

Phase 2 adds:
- Ranking system for places
- Nearest best alternatives
- Live traffic/weather alerts

See `Phase2-RankingAndSuggestions.md` for complete Phase 2 code.
