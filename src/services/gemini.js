// 1. Detect environment automatically
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://sanchaara-ai.onrender.com";

export async function generateItinerary(formData) {
  try {
    // 2. ✅ FIXED: Use the dynamic API_BASE_URL variable
    const response = await fetch(`${API_BASE_URL}/api/generate-itinerary`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ formData }),
    });

    const data = await response.json();

    // 3. Error Handling
    if (!response.ok) {
      // This sends the specific error (e.g., "Incredible India only")
      // back to your TripForm's alert box.
      throw new Error(data.error || "AI is currently busy.");
    }

    return data;
  } catch (error) {
    console.error("Request Failed:", error.message);
    // Rethrow to let the UI (TripForm) show the error message
    throw error;
  }
}
