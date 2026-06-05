import { useEffect, useRef, useState } from "react";

export default function WebcamCaptureModal({ open, onClose, onCapture }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return undefined;

    let cancelled = false;
    setError("");

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Camera is not supported on this device");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError("Camera permission denied or unavailable");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [open]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video?.videoWidth) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        onCapture(
          new File([blob], `photo-${Date.now()}.jpg`, { type: "image/jpeg" })
        );
        onClose();
      },
      "image/jpeg",
      0.92
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="webcam-capture-title"
    >
      <div className="card w-full max-w-lg p-4">
        <h3 id="webcam-capture-title" className="text-lg font-semibold text-black">
          Take photo
        </h3>
        <p className="mt-1 text-sm text-black/70">Position yourself in the frame, then capture.</p>

        {error ? (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        ) : (
          <video
            ref={videoRef}
            className="mt-3 aspect-video w-full rounded-lg border border-theme-border bg-black object-cover"
            playsInline
            muted
          />
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCapture}
            disabled={Boolean(error)}
            className="guest-cta-btn flex-1 px-4 py-2 text-sm disabled:opacity-60"
          >
            Take photo
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-theme-border px-4 py-2 text-sm text-black hover:bg-[#fce1ee]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
