// This helper detects if you are running locally or on the deployed site
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://sanchaara-ai.onrender.com";

export async function generateItinerary(formData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/generate-itinerary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ formData }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "Failed to generate itinerary. AI might be busy."
      );
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    // Important: Rethrow the error so your TripForm can show the alert
    throw error;
  }
}
