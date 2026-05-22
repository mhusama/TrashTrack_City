import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const defaultCenter = [40.7128, -74.006];

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function ReportsMap({ reports, height = "400px" }) {
  const center =
    reports.length > 0
      ? [reports[0].location.lat, reports[0].location.lng]
      : defaultCenter;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800" style={{ height }}>
      <MapContainer
        center={center}
        zoom={13}
        scrollWheelZoom
        className="h-full w-full"
        style={{ height: "100%", minHeight: height }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {reports.map((report) => (
          <Marker
            key={report._id}
            position={[report.location.lat, report.location.lng]}
            icon={markerIcon}
          >
            <Popup>
              <strong>{report.title}</strong>
              <br />
              <span className="capitalize">{report.status.replace("_", " ")}</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
