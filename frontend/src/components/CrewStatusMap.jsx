import { useEffect } from "react";
import { MapContainer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { DHAKA_BOUNDS, DHAKA_CENTER, DHAKA_ZOOM } from "../config/dhakaMap.js";
import { crewMapMarkerColor } from "../config/crewStatus.js";
import { statusTriangleIcon } from "../lib/leafletIcons.js";
import MapHoverInspector from "./MapHoverInspector.jsx";
import MapTileLayer from "./MapTileLayer.jsx";

function FitReportBounds({ reports }) {
  const map = useMap();

  useEffect(() => {
    if (reports.length === 0) {
      map.setView(DHAKA_CENTER, DHAKA_ZOOM.default);
      return;
    }
    const bounds = L.latLngBounds(
      reports.map((report) => [report.location.lat, report.location.lng])
    );
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: DHAKA_ZOOM.max });
  }, [map, reports]);

  return null;
}

export default function CrewStatusMap({ reports, height = "70vh", className = "" }) {
  return (
    <div
      className={`relative z-0 overflow-hidden rounded-xl ${className}`.trim()}
      style={{ height, border: "0.5rem dashed #6b0f1a" }}
    >
      <MapContainer
        center={DHAKA_CENTER}
        zoom={DHAKA_ZOOM.default}
        minZoom={DHAKA_ZOOM.min}
        maxZoom={DHAKA_ZOOM.max}
        maxBounds={DHAKA_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom
        className="map-hover-cursor h-full w-full"
        style={{ height: "100%", minHeight: height }}
      >
        <MapTileLayer />
        <MapHoverInspector />
        <FitReportBounds reports={reports} />
        {reports.map((report) => {
          const color = crewMapMarkerColor(report.crewStatus);
          return (
            <Marker
              key={report._id}
              position={[report.location.lat, report.location.lng]}
              icon={statusTriangleIcon(color)}
              interactive={false}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}
