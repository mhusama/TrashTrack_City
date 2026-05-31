const DHAKA_BOUNDS = {
  south: 23.68,
  west: 90.28,
  north: 23.97,
  east: 90.55,
};

export function isWithinDhakaBounds(lat, lng) {
  return (
    lat >= DHAKA_BOUNDS.south &&
    lat <= DHAKA_BOUNDS.north &&
    lng >= DHAKA_BOUNDS.west &&
    lng <= DHAKA_BOUNDS.east
  );
}
