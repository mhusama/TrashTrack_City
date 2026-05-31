import { TileLayer } from "react-leaflet";
import { DHAKA_ZOOM, MAP_TILE_MAX_NATIVE_ZOOM } from "../config/dhakaMap.js";

export default function MapTileLayer() {
  return (
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      maxZoom={DHAKA_ZOOM.max}
      maxNativeZoom={MAP_TILE_MAX_NATIVE_ZOOM}
    />
  );
}
