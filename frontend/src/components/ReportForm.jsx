import { useState } from "react";
import toast from "react-hot-toast";
import { Camera } from "lucide-react";
import PhotoCropper from "./PhotoCropper.jsx";
import LocationPickerMap from "./LocationPickerMap.jsx";
import ReportCategoryPicker from "./ReportCategoryPicker.jsx";
import {
  SMELL_RISK_OPTIONS,
  SENSITIVE_LOCATION_OPTIONS,
  WASTE_SPREAD_OPTIONS,
} from "../config/reportRiskFields.js";
import { categoryRequiresSubcategory } from "../config/reportCategories.js";
import { DHAKA_CENTER, isWithinDhakaBounds } from "../config/dhakaMap.js";
import { reverseGeocode } from "../lib/reverseGeocode.js";
import { mediaUrl } from "../utils/mediaUrl.js";

function buildInitialForm(initialData) {
  if (!initialData) {
    return {
      title: "",
      description: "",
      category: "",
      subcategory: "",
      lat: String(DHAKA_CENTER[0]),
      lng: String(DHAKA_CENTER[1]),
      address: "",
      nearbyLandmark: "",
      smellRisk: "",
      wasteSpreadArea: "",
      sensitiveLocations: [],
    };
  }

  return {
    title: initialData.title || "",
    description: initialData.description || "",
    category: initialData.category || "",
    subcategory: initialData.subcategory || "",
    lat: String(initialData.location?.lat ?? DHAKA_CENTER[0]),
    lng: String(initialData.location?.lng ?? DHAKA_CENTER[1]),
    address: initialData.location?.address || "",
    nearbyLandmark: initialData.location?.nearbyLandmark || "",
    smellRisk: initialData.smellRisk || "",
    wasteSpreadArea: initialData.wasteSpreadArea || "",
    sensitiveLocations: initialData.sensitiveLocations || [],
  };
}

export default function ReportForm({
  initialData = null,
  existingPhotoUrl = "",
  submitLabel = "Submit report",
  onSubmit,
}) {
  const [form, setForm] = useState(() => buildInitialForm(initialData));
  const [photoFile, setPhotoFile] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  const currentPhotoUrl = photoFile ? null : existingPhotoUrl;

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

  const handleLocationChange = async (lat, lng) => {
    setForm((prev) => ({
      ...prev,
      lat: lat.toFixed(5),
      lng: lng.toFixed(5),
    }));

    setLocationLoading(true);
    try {
      const details = await reverseGeocode(lat, lng);
      setForm((prev) => ({
        ...prev,
        lat: lat.toFixed(5),
        lng: lng.toFixed(5),
        address: details.addressText || details.displayName || "",
        nearbyLandmark: details.landmark || "",
      }));
    } catch {
      toast.error("Could not identify the address for this pin");
    } finally {
      setLocationLoading(false);
    }
  };

  const handleCategoryChange = ({ category, subcategory }) => {
    setForm((prev) => ({ ...prev, category, subcategory }));
  };

  const toggleSensitiveLocation = (value) => {
    setForm((prev) => {
      const selected = prev.sensitiveLocations.includes(value)
        ? prev.sensitiveLocations.filter((item) => item !== value)
        : [...prev.sensitiveLocations, value];
      return { ...prev, sensitiveLocations: selected };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.category) {
      toast.error("Please select a category");
      return;
    }
    if (categoryRequiresSubcategory(form.category) && !form.subcategory) {
      toast.error("Please select a subcategory for the chosen waste type");
      return;
    }

    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (!isWithinDhakaBounds(lat, lng)) {
      toast.error("Please place the pin inside Dhaka city");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form, photoFile);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="new-report-form space-y-6">
      <div className="new-report-column space-y-4">
        <label className="block space-y-1">
          <span className="label-text">Title</span>
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="input-field"
          />
        </label>

        <label className="block space-y-1">
          <span className="label-text">Description</span>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field min-h-[7rem]"
          />
        </label>

        <ReportCategoryPicker
          category={form.category}
          subcategory={form.subcategory}
          onChange={handleCategoryChange}
        />

        <fieldset className="space-y-2">
          <legend className="label-text">Smell/Health Risk Indicator</legend>
          <div className="new-report-options-stack rounded-xl border border-theme-border p-3">
            {SMELL_RISK_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="smellRisk"
                  value={option.value}
                  checked={form.smellRisk === option.value}
                  onChange={(e) => setForm({ ...form, smellRisk: e.target.value })}
                  className="accent-[#6b0f1a]"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="label-text">Waste Spread Area</legend>
          <div className="new-report-options-stack rounded-xl border border-theme-border p-3">
            {WASTE_SPREAD_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="radio"
                  name="wasteSpreadArea"
                  value={option.value}
                  checked={form.wasteSpreadArea === option.value}
                  onChange={(e) => setForm({ ...form, wasteSpreadArea: e.target.value })}
                  className="accent-[#6b0f1a]"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="label-text">Is the waste near sensitive locations?</legend>
          <div className="new-report-options-stack rounded-xl border border-theme-border p-3">
            {SENSITIVE_LOCATION_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={form.sensitiveLocations.includes(option.value)}
                  onChange={() => toggleSensitiveLocation(option.value)}
                  className="accent-[#6b0f1a]"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <LocationPickerMap lat={form.lat} lng={form.lng} onChange={handleLocationChange} />

        <label className="block space-y-1">
          <span className="label-text">Location</span>
          <input
            readOnly
            value={locationLoading ? "Identifying location…" : form.address}
            placeholder="Auto-filled when you pin a location on the map"
            className="input-field bg-[#fce1ee]/40"
          />
          <p className="text-xs text-black">
            Filled automatically from your pinned map location.
          </p>
        </label>

        <label className="block space-y-1">
          <span className="label-text">Nearby landmark</span>
          <input
            readOnly
            value={locationLoading ? "Identifying nearby landmark…" : form.nearbyLandmark}
            placeholder='e.g. "Near Kaliganj Bus Stand"'
            className="input-field bg-[#fce1ee]/40"
          />
          <p className="text-xs text-black">
            A nearby place of interest is detected automatically from the pin.
          </p>
        </label>

        <div className="space-y-2">
          <span className="label-text">Photo (optional)</span>
          {currentPhotoUrl && !previewSrc && (
            <img
              src={mediaUrl(currentPhotoUrl)}
              alt="Current report"
              className="max-h-48 w-full rounded-lg border border-theme-border object-cover"
            />
          )}
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
                {photoFile
                  ? photoFile.name
                  : currentPhotoUrl
                    ? "Replace photo"
                    : "Upload & crop photo"}
              </span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
          )}
        </div>
      </div>

      <div className="new-report-submit-row">
        <button type="submit" disabled={submitting} className="guest-cta-btn px-8 py-3">
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function buildFormData(form, photoFile) {
  const data = new FormData();
  data.append("title", form.title);
  data.append("description", form.description);
  data.append("category", form.category);
  data.append("subcategory", form.subcategory);
  data.append("lat", form.lat);
  data.append("lng", form.lng);
  data.append("address", form.address);
  data.append("nearbyLandmark", form.nearbyLandmark);
  data.append("smellRisk", form.smellRisk);
  data.append("wasteSpreadArea", form.wasteSpreadArea);
  data.append("sensitiveLocations", JSON.stringify(form.sensitiveLocations));
  if (photoFile) data.append("photo", photoFile);
  return data;
}

export { buildFormData };
