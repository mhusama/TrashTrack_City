/** Dhaka city map bounds (southwest → northeast). */
export const DHAKA_CENTER = [23.8103, 90.4125];

export const DHAKA_BOUNDS = [
  [23.68, 90.28],
  [23.97, 90.55],
];

export const DHAKA_ZOOM = {
  default: 12,
  min: 11,
  max: 20,
};

export const MAP_TILE_MAX_NATIVE_ZOOM = 19;

export function isWithinDhakaBounds(lat, lng) {
  const [south, west] = DHAKA_BOUNDS[0];
  const [north, east] = DHAKA_BOUNDS[1];
  return lat >= south && lat <= north && lng >= west && lng <= east;
}
