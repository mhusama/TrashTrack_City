import { useEffect } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { DHAKA_BOUNDS, DHAKA_CENTER, DHAKA_ZOOM } from "../config/dhakaMap.js";
import { reportMarkerIcon } from "../lib/leafletIcons.js";
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

export default function ReportsMap({ reports, height = "400px" }) {
  return (
    <div
      className="relative z-0 overflow-hidden rounded-xl border border-theme-border"
      style={{ height }}
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
        {reports.map((report) => (
          <Marker
            key={report._id}
            position={[report.location.lat, report.location.lng]}
            icon={reportMarkerIcon}
          >
            <Popup>
              <strong>{report.title}</strong>
              <br />
              <span className="capitalize">{report.status.replace("_", " ")}</span>
              {report.location.address ? (
                <>
                  <br />
                  <span className="text-sm">{report.location.address}</span>
                </>
              ) : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
