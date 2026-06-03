import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapContainer, Marker } from "react-leaflet";
import toast from "react-hot-toast";
import { crewApi } from "../api/client.js";
import { DHAKA_BOUNDS, DHAKA_ZOOM } from "../config/dhakaMap.js";
import { crewStatusLabelForReport, crewMapMarkerColor } from "../config/crewStatus.js";
import { statusTriangleIcon } from "../lib/leafletIcons.js";
import MapTileLayer from "../components/MapTileLayer.jsx";
import { mediaUrl } from "../utils/mediaUrl.js";

export default function TeamMemberReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    crewApi
      .getReport(id)
      .then((res) => setReport(res.data.report))
      .catch(() => toast.error("Report not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading…</p>;
  if (!report) return <p>Report not found.</p>;

  const pos = [report.location.lat, report.location.lng];

  return (
    <div className="space-y-6 text-black">
      <Link to="/crew/member" className="text-sm font-medium text-[#6b0f1a] hover:underline">
        ← Back to Task Reports
      </Link>
      <section className="card p-6">
        <h1 className="text-2xl font-bold">{report.title}</h1>
        {report.reportId && (
          <p className="font-mono text-sm text-[#6b0f1a]">Report ID: {report.reportId}</p>
        )}
        <p className="mt-2">
          Status: <strong>{crewStatusLabelForReport(report)}</strong>
        </p>
        <p className="mt-2">{report.description}</p>
        {report.photoUrl && (
          <img
            src={mediaUrl(report.photoUrl)}
            alt=""
            className="mt-4 max-h-48 rounded-lg border object-cover"
          />
        )}
      </section>
      <section className="overflow-hidden rounded-xl border" style={{ height: "320px" }}>
        <MapContainer
          center={pos}
          zoom={DHAKA_ZOOM.default}
          minZoom={DHAKA_ZOOM.min}
          maxZoom={DHAKA_ZOOM.max}
          maxBounds={DHAKA_BOUNDS}
          scrollWheelZoom
          style={{ height: "100%", width: "100%" }}
        >
          <MapTileLayer />
          <Marker
            position={pos}
            icon={statusTriangleIcon(crewMapMarkerColor(report.crewStatus))}
          />
        </MapContainer>
      </section>
      {report.updatedTaskReport?.submittedAt && (
        <section className="card p-6">
          <h2 className="text-lg font-semibold">Updated Task Report</h2>
          <p>{report.updatedTaskReport.description}</p>
          {report.updatedTaskReport.imageUrl && (
            <img
              src={mediaUrl(report.updatedTaskReport.imageUrl)}
              alt=""
              className="mt-2 max-h-48 rounded-lg border"
            />
          )}
        </section>
      )}
    </div>
  );
}
