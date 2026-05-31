import { useEffect, useRef, useState } from "react";
import { CornerUpLeft, Heart } from "lucide-react";
import toast from "react-hot-toast";
import { chatApi } from "../api/client.js";
import { mediaUrl } from "../utils/mediaUrl.js";

export default function CrewChatPanel() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [image, setImage] = useState(null);
  const [voice, setVoice] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [recording, setRecording] = useState(false);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const audioRefs = useRef({});
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const load = () => {
    chatApi
      .list()
      .then((res) => setMessages(res.data.messages))
      .catch(() => toast.error("Could not load chat"));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(
    () => () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    },
    []
  );

  const pickSupportedMimeType = () => {
    if (!window.MediaRecorder || !window.MediaRecorder.isTypeSupported) return "";
    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ];
    return candidates.find((type) => window.MediaRecorder.isTypeSupported(type)) || "";
  };

  const stopRecordingAndSave = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") return;
    setProcessingVoice(true);
    await new Promise((resolve) => {
      recorder.addEventListener("stop", resolve, { once: true });
      recorder.stop();
    });
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    const chunks = recordedChunksRef.current;
    recordedChunksRef.current = [];
    if (!chunks.length) {
      setProcessingVoice(false);
      toast.error("No voice captured");
      return;
    }

    const mimeType = recorder.mimeType || "audio/webm";
    const blob = new Blob(chunks, { type: mimeType });
    const ext = mimeType.includes("mp4") ? "m4a" : mimeType.includes("ogg") ? "ogg" : "webm";
    const file = new File([blob], `voice-${Date.now()}.${ext}`, { type: mimeType });
    setVoice(file);
    setProcessingVoice(false);
  };

  const toggleRecording = async () => {
    if (recording) {
      setRecording(false);
      await stopRecordingAndSave();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      toast.error("Live voice recording is not supported on this device");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;
      recordedChunksRef.current = [];
      const mimeType = pickSupportedMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.start();
      setRecording(true);
      toast.success("Recording started");
    } catch {
      toast.error("Microphone permission denied or unavailable");
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !image && !voice) return;
    setSending(true);
    try {
      const fd = new FormData();
      if (text.trim()) fd.append("text", text.trim());
      if (image) fd.append("image", image);
      if (voice) fd.append("voice", voice);
      if (replyTarget?.id) fd.append("replyToMessageId", replyTarget.id);
      await chatApi.send(fd);
      setText("");
      setImage(null);
      setVoice(null);
      setReplyTarget(null);
      load();
    } catch {
      toast.error("Could not send message");
    } finally {
      setSending(false);
    }
  };

  const toggleLike = async (id) => {
    try {
      const res = await chatApi.like(id);
      setMessages((prev) =>
        prev.map((m) => (m._id === id || m.id === id ? res.data.message : m))
      );
    } catch {
      toast.error("Could not update like");
    }
  };

  const toggleAudioPlayback = async (id) => {
    const current = audioRefs.current[id];
    if (!current) return;
    const allAudios = Object.values(audioRefs.current);
    for (const audio of allAudios) {
      if (audio && audio !== current) {
        audio.pause();
      }
    }
    if (current.paused) {
      try {
        await current.play();
      } catch {
        toast.error("Unable to play this audio on your device");
      }
      return;
    }
    current.pause();
  };

  return (
    <div className="card flex h-[70vh] flex-col p-4">
      <div className="flex-1 space-y-3 overflow-y-auto pr-2">
        {messages.map((msg) => (
          <div key={msg._id || msg.id} className="rounded-lg border border-theme-border p-3">
            <p className="text-xs font-semibold text-[#6b0f1a]">
              {msg.senderName}
              {msg.teamName ? ` · ${msg.teamName}` : ""}
              {msg.crewSubRole ? ` (${msg.crewSubRole.replace("_", " ")})` : ""}
            </p>
            {msg.text && <p className="mt-1 text-sm">{msg.text}</p>}
            {msg.replyToMessageId && (
              <div className="mt-1 rounded border-l-4 border-[#6b0f1a] bg-[#fce1ee]/40 p-2 text-xs text-black">
                <p className="font-semibold text-[#6b0f1a]">
                  Reply to {msg.replyToSenderName || "message"}
                </p>
                <p className="mt-1 line-clamp-2">{msg.replyToText || "…"}</p>
              </div>
            )}
            {msg.imageUrl && (
              <img
                src={mediaUrl(msg.imageUrl)}
                alt=""
                className="mt-2 max-h-40 rounded-lg border object-cover"
              />
            )}
            {msg.voiceUrl && (
              <audio
                ref={(el) => {
                  audioRefs.current[msg._id || msg.id] = el;
                }}
                controls
                preload="metadata"
                src={mediaUrl(msg.voiceUrl)}
                className="mt-2 w-full max-w-xs cursor-pointer"
                onClick={() => toggleAudioPlayback(msg._id || msg.id)}
              />
            )}
            <div className="mt-2 flex items-center gap-3 text-xs text-[#6b0f1a]">
              <button
                type="button"
                onClick={() => toggleLike(msg._id || msg.id)}
                className="flex items-center gap-1"
              >
                <Heart className={`h-4 w-4 ${msg.likedByMe ? "fill-[#6b0f1a]" : ""}`} />
                {msg.likeCount || 0}
              </button>
              {msg.text && (
                <button
                  type="button"
                  onClick={() =>
                    setReplyTarget({
                      id: msg._id || msg.id,
                      senderName: msg.senderName,
                      text: msg.text,
                    })
                  }
                  className="flex items-center gap-1 hover:underline"
                >
                  <CornerUpLeft className="h-4 w-4" />
                  Reply
                </button>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="mt-4 space-y-2 border-t border-theme-border pt-4">
        {replyTarget && (
          <div className="rounded border-l-4 border-[#6b0f1a] bg-[#fce1ee]/40 p-2 text-xs text-black">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-[#6b0f1a]">Replying to {replyTarget.senderName}</p>
                <p className="mt-1 line-clamp-2">{replyTarget.text}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyTarget(null)}
                className="font-semibold text-[#6b0f1a] hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Type a message…"
          className="input-field w-full"
        />
        <div className="flex flex-wrap gap-2">
          <label className="guest-cta-btn cursor-pointer px-4 py-2 text-sm">
            Image
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
            />
          </label>
          <button
            type="button"
            onClick={toggleRecording}
            disabled={sending || processingVoice}
            className={`guest-cta-btn px-4 py-2 text-sm ${
              recording ? "ring-2 ring-red-600" : ""
            }`}
          >
            {recording ? "Stop Voice" : "Voice"}
          </button>
          <label className="guest-cta-btn cursor-pointer px-4 py-2 text-sm">
            Upload Voice
            <input
              type="file"
              accept="audio/*"
              capture
              className="hidden"
              onChange={(e) => setVoice(e.target.files?.[0] || null)}
            />
          </label>
        </div>
        {recording && <p className="text-xs font-medium text-red-600">Recording... tap Voice again to stop.</p>}
        {processingVoice && <p className="text-xs text-black">Processing voice note...</p>}
        {voice && !recording && !processingVoice && (
          <p className="text-xs text-green-700">Voice note ready: {voice.name}</p>
        )}
        <button type="submit" disabled={sending} className="btn-primary w-full py-2">
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
