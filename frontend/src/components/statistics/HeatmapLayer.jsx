import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

const GRADIENT = {
  0.0: "#22c55e",
  0.35: "#84cc16",
  0.55: "#eab308",
  0.75: "#f97316",
  1.0: "#ef4444",
};

export default function HeatmapLayer({ points, visible }) {
  const map = useMap();

  useEffect(() => {
    if (!visible || !points?.length) return undefined;

    const layer = L.heatLayer(points, {
      radius: 28,
      blur: 22,
      maxZoom: 17,
      minOpacity: 0.35,
      gradient: GRADIENT,
    });
    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points, visible]);

  return null;
}
