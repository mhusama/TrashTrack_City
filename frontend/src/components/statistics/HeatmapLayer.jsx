import { useCallback, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import { DHAKA_ZOOM } from "../../config/dhakaMap.js";

const GRADIENT = {
  0.0: "#22c55e",
  0.3: "#84cc16",
  0.5: "#eab308",
  0.7: "#f97316",
  1.0: "#ef4444",
};

const HEAT_RADIUS = 28;
const HEAT_BLUR = 22;
const REFERENCE_ZOOM = DHAKA_ZOOM.default;

function mergeClusterIntensity(intensities, zoomOut) {
  if (!intensities.length) return 0;
  if (zoomOut <= 0) {
    return Math.max(...intensities);
  }
  return intensities.reduce((sum, value) => sum + value, 0) / intensities.length;
}

function clusterHeatPoints(map, points, { clusterRadius, zoomOut }) {
  if (!points?.length) return [];

  const projected = points.map((point) => {
    const lat = point[0];
    const lng = point[1];
    const intensity = point[2] ?? 1;
    const container = map.latLngToContainerPoint([lat, lng]);
    return { lat, lng, intensity, x: container.x, y: container.y };
  });

  const used = new Set();
  const clusters = [];
  const radiusSquared = clusterRadius * clusterRadius;

  for (let i = 0; i < projected.length; i += 1) {
    if (used.has(i)) continue;

    const seed = projected[i];
    used.add(i);

    let sumLat = seed.lat;
    let sumLng = seed.lng;
    const intensities = [seed.intensity];
    let count = 1;

    for (let j = i + 1; j < projected.length; j += 1) {
      if (used.has(j)) continue;

      const other = projected[j];
      const dx = other.x - seed.x;
      const dy = other.y - seed.y;
      if (dx * dx + dy * dy <= radiusSquared) {
        sumLat += other.lat;
        sumLng += other.lng;
        intensities.push(other.intensity);
        count += 1;
        used.add(j);
      }
    }

    clusters.push([
      sumLat / count,
      sumLng / count,
      mergeClusterIntensity(intensities, zoomOut),
    ]);
  }

  return clusters;
}

function prepareHeatPointsForZoom(map, points) {
  const zoom = map.getZoom();
  const zoomOut = Math.max(0, REFERENCE_ZOOM - zoom);
  const baseRadius = HEAT_RADIUS + HEAT_BLUR;
  const clusterRadius = baseRadius * (1 + zoomOut * 0.4);
  const intensityDamping = Math.pow(0.72, zoomOut);
  const dynamicMax = 0.85 * (1 + zoomOut * 0.75);

  const clustered = clusterHeatPoints(map, points, { clusterRadius, zoomOut });
  const scaled = clustered.map(([lat, lng, intensity]) => [
    lat,
    lng,
    Math.max(0.1, intensity * intensityDamping),
  ]);

  return { points: scaled, max: dynamicMax };
}

export default function HeatmapLayer({ points, visible }) {
  const map = useMap();
  const layerRef = useRef(null);

  const redraw = useCallback(() => {
    if (!visible || !points?.length) {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
      return;
    }

    const { points: displayPoints, max } = prepareHeatPointsForZoom(map, points);

    if (layerRef.current) {
      layerRef.current.setLatLngs(displayPoints);
      layerRef.current.setOptions({ max });
      return;
    }

    layerRef.current = L.heatLayer(displayPoints, {
      radius: HEAT_RADIUS,
      blur: HEAT_BLUR,
      maxZoom: 17,
      max,
      minOpacity: 0.38,
      gradient: GRADIENT,
    });
    layerRef.current.addTo(map);
  }, [map, points, visible]);

  useEffect(() => {
    redraw();

    map.on("zoomend", redraw);
    map.on("moveend", redraw);

    return () => {
      map.off("zoomend", redraw);
      map.off("moveend", redraw);
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, redraw]);

  return null;
}
