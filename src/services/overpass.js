/**
 * overpass.js — OpenStreetMap Overpass API Service
 *
 * @description  Fetches nearby essential services (hospitals, ATMs, restrooms,
 *               cafes) within a 2km radius of the user's current location
 *               using the Overpass API.
 */
export const fetchNearbyEssentials = async (lat, lon, type = "hospital") => {
  // Types: hospital, atm, pharmacy, toilets, cafe
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="${type}"](around:2000, ${lat}, ${lon});
      way["amenity"="${type}"](around:2000, ${lat}, ${lon});
    );
    out body;
    >;
    out skel qt;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
    query
  )}`;

  try {
    // Fix #8: Add 5-second timeout so SurvivalGrid doesn't hang on slow networks
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await response.json();
    return data.elements.map((e) => ({
      name: e.tags?.name || `Unnamed ${type}`,
      lat: e.lat || e.center?.lat,
      lon: e.lon || e.center?.lon,
      distance: "Within 2km",
    }));
  } catch (error) {
    if (error.name === "AbortError") {
      console.warn("Overpass API timed out after 5s.");
    } else {
      console.error("Overpass Error:", error);
    }
    return [];
  }
};
