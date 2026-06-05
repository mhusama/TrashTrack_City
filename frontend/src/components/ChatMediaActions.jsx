import { useState } from "react";
import WebcamCaptureModal from "./WebcamCaptureModal.jsx";

export default function ChatMediaActions({
  image,
  onImageChange,
  voice,
  onVoiceChange,
  recording = false,
  processingVoice = false,
  onToggleRecording,
  disabled = false,
  vertical = false,
}) {
  const [webcamOpen, setWebcamOpen] = useState(false);
  const layoutClass = vertical ? "flex flex-col gap-2" : "flex flex-wrap gap-2";

  return (
    <>
      <div className={layoutClass}>
        <label className="guest-cta-btn cursor-pointer px-4 py-2 text-center text-sm">
          Image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled}
            onChange={(e) => onImageChange(e.target.files?.[0] || null)}
          />
        </label>
        <button
          type="button"
          onClick={() => setWebcamOpen(true)}
          disabled={disabled}
          className="guest-cta-btn px-4 py-2 text-sm disabled:opacity-60"
        >
          Take photo
        </button>
        <button
          type="button"
          onClick={onToggleRecording}
          disabled={disabled || processingVoice}
          className={`guest-cta-btn px-4 py-2 text-sm disabled:opacity-60 ${
            recording ? "ring-2 ring-red-600" : ""
          }`}
        >
          {recording ? "Stop Voice" : "Voice"}
        </button>
        <label className="guest-cta-btn cursor-pointer px-4 py-2 text-center text-sm">
          Upload Voice
          <input
            type="file"
            accept="audio/*"
            className="hidden"
            disabled={disabled}
            onChange={(e) => onVoiceChange(e.target.files?.[0] || null)}
          />
        </label>
      </div>

      {recording && (
        <p className="text-xs font-medium text-red-600">
          Recording... tap Voice again to stop.
        </p>
      )}
      {processingVoice && <p className="text-xs text-black">Processing voice note...</p>}
      {voice && !recording && !processingVoice && (
        <p className="text-xs text-green-700">Voice note ready: {voice.name}</p>
      )}
      {image && (
        <p className="text-xs text-green-700">Image ready: {image.name}</p>
      )}

      <WebcamCaptureModal
        open={webcamOpen}
        onClose={() => setWebcamOpen(false)}
        onCapture={onImageChange}
      />
    </>
  );
}
