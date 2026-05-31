const cache = new Map();

export async function reverseGeocode(lat, lng) {
  const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (cache.has(key)) {
    return cache.get(key);
  }

  const params = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  const response = await fetch(`/api/geocode/reverse?${params}`);
  if (!response.ok) {
    throw new Error("Could not load location details");
  }

  const data = await response.json();
  cache.set(key, data);
  return data;
}
