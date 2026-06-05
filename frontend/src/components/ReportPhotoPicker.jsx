import { useState } from "react";
import { Camera } from "lucide-react";
import toast from "react-hot-toast";
import PhotoCropper from "./PhotoCropper.jsx";
import WebcamCaptureModal from "./WebcamCaptureModal.jsx";

export default function ReportPhotoPicker({
  photoFile,
  onPhotoChange,
  label = "Photo (optional)",
  emptyLabel = "Upload & crop photo",
}) {
  const [previewSrc, setPreviewSrc] = useState(null);
  const [webcamOpen, setWebcamOpen] = useState(false);

  const openPreview = (file) => {
    setPreviewSrc(URL.createObjectURL(file));
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    openPreview(file);
  };

  const handleWebcamCapture = (file) => {
    openPreview(file);
  };

  const handleCropped = (blob) => {
    onPhotoChange(new File([blob], "photo.jpg", { type: "image/jpeg" }));
    setPreviewSrc(null);
    toast.success("Photo ready");
  };

  const handleCancel = () => {
    setPreviewSrc(null);
  };

  return (
    <div className="space-y-2">
      <span className="label-text">{label}</span>
      {previewSrc ? (
        <PhotoCropper
          imageSrc={previewSrc}
          onCropped={handleCropped}
          onCancel={handleCancel}
        />
      ) : (
        <div className="space-y-2">
          <label className="flex min-h-[10rem] cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-theme-border py-8 transition-colors hover:bg-black hover:text-white">
            <Camera className="h-5 w-5" />
            <span className="text-sm">{photoFile ? photoFile.name : emptyLabel}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </label>
          <button
            type="button"
            onClick={() => setWebcamOpen(true)}
            className="guest-cta-btn w-full py-2.5 text-sm"
          >
            Take photo
          </button>
        </div>
      )}

      <WebcamCaptureModal
        open={webcamOpen}
        onClose={() => setWebcamOpen(false)}
        onCapture={handleWebcamCapture}
      />
    </div>
  );
}
