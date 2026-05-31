import L from "leaflet";

const LOCATION_MARKER_COLOR = "#6b0f1a";

const locationPinSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42" aria-hidden="true">
  <path fill="${LOCATION_MARKER_COLOR}" d="M12 0C5.373 0 0 5.373 0 12c0 8.25 12 24 12 24s12-15.75 12-24C24 5.373 18.627 0 12 0z"/>
  <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
</svg>
`;

export function statusTriangleIcon(color) {
  return L.divIcon({
    className: "status-triangle-marker",
    html: `<div style="width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:18px solid ${color};filter:drop-shadow(0 1px 2px rgba(0,0,0,0.35));"></div>`,
    iconSize: [20, 18],
    iconAnchor: [10, 18],
    popupAnchor: [0, -18],
  });
}

export const reportMarkerIcon = L.divIcon({
  className: "location-marker-icon",
  html: locationPinSvg,
  iconSize: [28, 42],
  iconAnchor: [14, 42],
  popupAnchor: [0, -42],
});

export const hoverCursorIcon = L.divIcon({
  className: "hover-cursor-icon",
  html: '<div class="hover-cursor-pin" aria-hidden="true"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});
