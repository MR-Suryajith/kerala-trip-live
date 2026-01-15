/**
 * Overpass API Service
 * Fetches nearby essential services from OpenStreetMap data.
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
    const response = await fetch(url);
    const data = await response.json();
    return data.elements.map((e) => ({
      name: e.tags.name || `Unnamed ${type}`,
      lat: e.lat || e.center?.lat,
      lon: e.lon || e.center?.lon,
      distance: "Within 2km",
    }));
  } catch (error) {
    console.error("Overpass Error:", error);
    return [];
  }
};
