import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Camera } from "lucide-react";
import { reportsApi } from "../api/client.js";
import PhotoCropper from "../components/PhotoCropper.jsx";

const categories = [
  { value: "overflow", label: "Bin overflow" },
  { value: "illegal_dump", label: "Illegal dump" },
  { value: "missed_pickup", label: "Missed pickup" },
  { value: "damaged_bin", label: "Damaged bin" },
  { value: "other", label: "Other" },
];

export default function NewReportPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "other",
    lat: "40.7128",
    lng: "-74.0060",
    address: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => data.append(key, value));
    if (photoFile) data.append("photo", photoFile);

    try {
      await reportsApi.create(data);
      toast.success("Report submitted");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold">New report</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Title</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-brand-500"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Description</span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-brand-500"
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Category</span>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Latitude</span>
            <input
              required
              type="number"
              step="any"
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            />
          </label>
          <label className="block space-y-1 text-sm">
            <span className="text-slate-400">Longitude</span>
            <input
              required
              type="number"
              step="any"
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
            />
          </label>
        </div>

        <label className="block space-y-1 text-sm">
          <span className="text-slate-400">Address (optional)</span>
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2"
          />
        </label>

        <div className="space-y-2">
          <span className="text-sm text-slate-400">Photo (optional)</span>
          {previewSrc ? (
            <PhotoCropper
              imageSrc={previewSrc}
              onCropped={handleCropped}
              onCancel={() => setPreviewSrc(null)}
            />
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-8 hover:border-brand-500">
              <Camera className="h-5 w-5 text-slate-500" />
              <span className="text-sm text-slate-400">
                {photoFile ? photoFile.name : "Upload & crop photo"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </div>
  );
}
