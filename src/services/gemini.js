// This helper detects if you are running locally or on the deployed site
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://sanchaara-ai.onrender.com";

export async function generateItinerary(formData) {
  try {
    const response = await fetch(
      "https://sanchaara-ai.onrender.com/api/generate-itinerary",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      // This is what allows TripForm to show "Designed exclusively for Kerala"
      throw new Error(data.error || "AI is busy");
    }

    return data;
  } catch (error) {
    throw error;
  }
}
