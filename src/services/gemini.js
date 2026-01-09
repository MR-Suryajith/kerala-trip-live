export async function generateItinerary(formData) {
  try {
    const response = await fetch('http://localhost:5000/api/generate-itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate itinerary. Ensure backend is running.');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}