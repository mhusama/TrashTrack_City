import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Camera } from "lucide-react";
import toast from "react-hot-toast";
import { reportsApi } from "../api/client.js";
import PhotoCropper from "../components/PhotoCropper.jsx";
import { mediaUrl } from "../utils/mediaUrl.js";

export default function EditReportPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoFile, setPhotoFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    reportsApi
      .get(id)
      .then((res) => setReport(res.data.report))
      .catch(() => toast.error("Report not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewSrc(URL.createObjectURL(file));
  };

  const handleCropped = (blob) => {
    setPhotoFile(new File([blob], "report-photo.jpg", { type: "image/jpeg" }));
    setPreviewSrc(null);
    toast.success("Photo ready");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoFile) {
      toast.error("Please choose a new photo");
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("photo", photoFile);
      await reportsApi.update(id, data);
      toast.success("Report photo updated");
      navigate(`/reports/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update report photo");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className="text-black">Loading report…</p>;
  }

  if (!report) {
    return (
      <div className="card p-8 text-center">
        <p className="text-black">Report not found.</p>
        <Link to="/" className="link-inline mt-4 inline-block">
          Back to My Reports
        </Link>
      </div>
    );
  }

  const issuedDate = new Date(report.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="new-report-page w-full text-black">
      <button
        type="button"
        onClick={() => navigate(`/reports/${id}`)}
        className="mb-4 text-sm font-medium text-[#6b0f1a] hover:underline"
      >
        ← Back to report
      </button>
      <h1 className="mb-2 text-2xl font-bold text-black">Change report photo</h1>
      <p className="mb-6 text-sm text-black/80">
        Only the report photo can be updated here. All other details, including the issued
        date ({issuedDate}), stay unchanged.
      </p>

      <form onSubmit={handleSubmit} className="card max-w-xl space-y-6 p-6">
        <div>
          <p className="label-text">Current photo</p>
          {report.photoUrl ? (
            <img
              src={mediaUrl(report.photoUrl)}
              alt="Current report"
              className="mt-2 max-h-48 w-full rounded-lg border border-theme-border object-cover"
            />
          ) : (
            <p className="mt-2 text-sm text-black/70">No photo on this report yet.</p>
          )}
        </div>

        <div className="space-y-2">
          <span className="label-text">New photo</span>
          {previewSrc ? (
            <PhotoCropper
              imageSrc={previewSrc}
              onCropped={handleCropped}
              onCancel={() => setPreviewSrc(null)}
            />
          ) : (
            <label className="flex min-h-[10rem] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-theme-border py-8 transition-colors hover:bg-black hover:text-white">
              <Camera className="h-5 w-5" />
              <span className="text-sm">
                {photoFile ? photoFile.name : "Upload & crop photo"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>

        <button type="submit" disabled={submitting || !photoFile} className="guest-cta-btn px-8 py-3">
          {submitting ? "Saving…" : "Save photo"}
        </button>
      </form>
    </div>
  );
}
