/**
 * bookingApi.js — Booking API Service Layer
 *
 * @description  Frontend service for querying flight, hotel, and train
 *               data from the Sanchaara backend booking endpoints.
 */

const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://sanchaara-ai.onrender.com";

/**
 * Searches for flights between two cities.
 */
export const searchFlights = async (origin, destination, date, adults = 1) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search-flights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, date, adults }),
    });
    const data = await response.json();
    return data.flights || [];
  } catch (error) {
    console.error("Flight API Error:", error);
    return [];
  }
};

/**
 * Searches for hotels near a destination.
 */
export const searchHotels = async (destination) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search-hotels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination }),
    });
    const data = await response.json();
    return data.hotels || [];
  } catch (error) {
    console.error("Hotel API Error:", error);
    return [];
  }
};

/**
 * Searches for trains between two stations.
 */
export const searchTrains = async (origin, destination, date) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/search-trains`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination, date }),
    });
    const data = await response.json();
    return data.trains || [];
  } catch (error) {
    console.error("Train API Error:", error);
    return [];
  }
};
