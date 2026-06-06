import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapContainer, Marker } from "react-leaflet";
import toast from "react-hot-toast";
import { crewApi } from "../api/client.js";
import { DHAKA_BOUNDS, DHAKA_ZOOM } from "../config/dhakaMap.js";
import { crewStatusLabelForReport, crewMapMarkerColorForReport } from "../config/crewStatus.js";
import { statusTriangleIcon } from "../lib/leafletIcons.js";
import MapTileLayer from "../components/MapTileLayer.jsx";
import { mediaUrl } from "../utils/mediaUrl.js";

export default function TeamLeaderReportDetailPage() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [disposalOn, setDisposalOn] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    crewApi
      .getReport(id)
      .then((res) => {
        const r = res.data.report;
        setReport(r);
        setDisposalOn(r.crewStatus === "disposal_in_progress");
        setShowUpdateForm(
          r.crewStatus === "disposal_in_progress" || r.crewStatus === "awaiting_approval"
        );
      })
      .catch(() => toast.error("Report not found"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const handleDisposalSubmit = async () => {
    setSubmitting(true);
    try {
      await crewApi.setDisposal(id, disposalOn);
      toast.success(disposalOn ? "Marked Disposal in Progress" : "Disposal status cleared");
      load();
      if (disposalOn) setShowUpdateForm(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not update");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatedTaskSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("description", description.trim());
      if (image) fd.append("image", image);
      await crewApi.submitUpdatedTask(id, fd);
      toast.success("Updated task report submitted for approval");
      setDescription("");
      setImage(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnsubmit = async () => {
    setSubmitting(true);
    try {
      await crewApi.unsubmitUpdatedTask(id);
      toast.success("Update unsubmitted — status set to Disposal in Progress");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not unsubmit");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (!report) return <p>Report not found.</p>;

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const pos = [report.location.lat, report.location.lng];
  const canEditDisposal = ["assigned", "disposal_in_progress"].includes(report.crewStatus);
  const canSubmitUpdate = report.crewStatus === "disposal_in_progress";
  const canUnsubmitUpdate =
    report.crewStatus === "awaiting_approval" && Boolean(report.updatedTaskReport?.submittedAt);

  return (
    <div className="space-y-6 text-black">
      <Link to="/crew/leader" className="text-sm font-medium text-[#6b0f1a] hover:underline">
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
        <p className="mt-2 text-sm">{report.description}</p>
        {report.photoUrl && (
          <img
            src={mediaUrl(report.photoUrl)}
            alt=""
            className="mt-4 max-h-48 rounded-lg border object-cover"
          />
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-theme-border" style={{ height: "320px" }}>
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
            icon={statusTriangleIcon(crewMapMarkerColorForReport(report))}
          />
        </MapContainer>
      </section>

      {canEditDisposal && (
        <section className="card p-6">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setDisposalOn((v) => !v)}
              className={`h-10 w-20 rounded-full border-2 transition-colors ${
                disposalOn ? "border-green-600 bg-green-500" : "border-red-600 bg-red-500"
              }`}
              aria-label="Disposal in Progress toggle"
            />
            <span className="font-semibold">Disposal in Progress</span>
            <button
              type="button"
              disabled={submitting}
              onClick={handleDisposalSubmit}
              className="guest-cta-btn px-6 py-2"
            >
              Submit
            </button>
          </div>
        </section>
      )}

      {showUpdateForm && (canSubmitUpdate || canUnsubmitUpdate) && (
        <section className="card p-6">
          <h2 className="mb-4 text-lg font-semibold">Updated Task Report</h2>
          <p className="text-sm">
            Report ID: {report.reportId} · Title: {report.title}
          </p>
          {canSubmitUpdate ? (
            <form onSubmit={handleUpdatedTaskSubmit} className="mt-4 space-y-4">
              <label className="block space-y-1">
                <span className="label-text">Description</span>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="input-field"
                />
              </label>
              <label className="block space-y-1">
                <span className="label-text">Image (jpg/png)</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  capture="environment"
                  onChange={(e) => setImage(e.target.files?.[0] || null)}
                  className="input-field py-2"
                />
              </label>
              <label className="block space-y-1">
                <span className="label-text">Update Date</span>
                <input readOnly value={today} className="input-field bg-[#fce1ee]/40" />
              </label>
              <button type="submit" disabled={submitting} className="btn-primary px-8 py-3">
                {submitting ? "Submitting…" : "Submit updated report"}
              </button>
            </form>
          ) : (
            <div className="mt-4 space-y-3">
              {report.updatedTaskReport?.description && (
                <p className="rounded-lg border border-theme-border bg-[#fce1ee]/30 p-3 text-sm">
                  {report.updatedTaskReport.description}
                </p>
              )}
              {report.updatedTaskReport?.imageUrl && (
                <img
                  src={mediaUrl(report.updatedTaskReport.imageUrl)}
                  alt=""
                  className="max-h-48 rounded-lg border object-cover"
                />
              )}
              <p className="text-sm text-neutral-600">
                Awaiting admin approval. Unsubmit to return to Disposal in Progress.
              </p>
            </div>
          )}
          {canUnsubmitUpdate && (
            <button
              type="button"
              disabled={submitting}
              onClick={handleUnsubmit}
              className={`rounded-lg border-2 border-[#6b0f1a] bg-white px-8 py-3 font-semibold text-[#6b0f1a] transition-colors hover:bg-[#fce1ee] disabled:opacity-50 ${
                canSubmitUpdate ? "mt-4" : "mt-2"
              }`}
            >
              {submitting ? "Processing…" : "Unsubmit"}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
