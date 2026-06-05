import { useEffect, useRef, useState } from "react";
import { CornerUpLeft, Heart } from "lucide-react";
import toast from "react-hot-toast";
import { chatApi } from "../api/client.js";
import ChatMediaActions from "./ChatMediaActions.jsx";
import { mediaUrl } from "../utils/mediaUrl.js";

function ChatMessageBubble({ msg, onLike, onReply, audioRefs, toggleAudioPlayback }) {
  const messageId = msg._id || msg.id;
  const previewText = msg.text || (msg.imageUrl ? "Photo" : msg.voiceUrl ? "Voice note" : "Message");

  return (
    <div className="rounded-lg border border-theme-border p-3">
      <p className="text-xs font-semibold text-[#6b0f1a]">
        {msg.senderName}
        {msg.teamName ? ` · ${msg.teamName}` : ""}
        {msg.crewSubRole ? ` (${msg.crewSubRole.replace("_", " ")})` : ""}
      </p>
      {msg.replyToMessageId && (
        <div className="mt-1 rounded border-l-4 border-[#6b0f1a] bg-[#fce1ee]/40 p-2 text-xs text-black">
          <p className="font-semibold text-[#6b0f1a]">
            Reply to {msg.replyToSenderName || "message"}
          </p>
          <p className="mt-1 line-clamp-2">{msg.replyToText || "…"}</p>
        </div>
      )}
      {msg.text && <p className="mt-1 text-sm text-black">{msg.text}</p>}
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
            audioRefs.current[messageId] = el;
          }}
          controls
          preload="metadata"
          src={mediaUrl(msg.voiceUrl)}
          className="mt-2 w-full max-w-xs cursor-pointer"
          onClick={() => toggleAudioPlayback(messageId)}
        />
      )}
      <div className="mt-2 flex items-center gap-3 text-xs text-[#6b0f1a]">
        <button type="button" onClick={() => onLike(messageId)} className="flex items-center gap-1">
          <Heart className={`h-4 w-4 ${msg.likedByMe ? "fill-[#6b0f1a]" : ""}`} />
          {msg.likeCount || 0}
        </button>
        <button
          type="button"
          onClick={() =>
            onReply({
              id: messageId,
              senderName: msg.senderName,
              text: previewText,
            })
          }
          className="flex items-center gap-1 hover:underline"
        >
          <CornerUpLeft className="h-4 w-4" />
          Reply
        </button>
      </div>
      {msg.createdAt && (
        <p className="mt-1 text-xs text-black/50">
          {new Date(msg.createdAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}

export default function CrewChatPanel({
  api = chatApi,
  messagesTitle = "Messages",
  composerTitle = "Write a Message",
  placeholder = "Type a message…",
  sendLabel = "Send",
}) {
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
    api
      .list()
      .then((res) => setMessages(res.data.messages))
      .catch(() => toast.error("Could not load chat"));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [api]);

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
      await api.send(fd);
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
      const res = await api.like(id);
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
    <div className="card flex min-h-[70vh] flex-col p-4 sm:p-6">
      <div className="grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
        <div className="flex min-h-[20rem] flex-col lg:min-h-0">
          <h2 className="mb-3 shrink-0 text-sm font-semibold uppercase tracking-wide text-[#6b0f1a]">
            {messagesTitle}
          </h2>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="text-sm text-black/60">No messages yet. Start the conversation.</p>
            ) : (
              messages.map((msg) => (
                <ChatMessageBubble
                  key={msg._id || msg.id}
                  msg={msg}
                  onLike={toggleLike}
                  onReply={setReplyTarget}
                  audioRefs={audioRefs}
                  toggleAudioPlayback={toggleAudioPlayback}
                />
              ))
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <aside className="flex flex-col border-t border-theme-border bg-white pt-4 lg:sticky lg:top-6 lg:z-10 lg:max-h-[calc(100vh-10rem)] lg:self-start lg:overflow-y-auto lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <h2 className="mb-3 shrink-0 text-sm font-semibold uppercase tracking-wide text-[#6b0f1a]">
            {composerTitle}
          </h2>
          <form onSubmit={handleSend} className="flex min-h-0 flex-1 flex-col space-y-3">
            {replyTarget && (
              <div className="rounded border-l-4 border-[#6b0f1a] bg-[#fce1ee]/40 p-2 text-xs text-black">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#6b0f1a]">
                      Replying to {replyTarget.senderName}
                    </p>
                    <p className="mt-1 line-clamp-3">{replyTarget.text}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyTarget(null)}
                    className="shrink-0 font-semibold text-[#6b0f1a] hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder={placeholder}
              className="input-field min-h-[7rem] w-full flex-1 resize-y"
            />
            <ChatMediaActions
              image={image}
              onImageChange={setImage}
              voice={voice}
              onVoiceChange={setVoice}
              recording={recording}
              processingVoice={processingVoice}
              onToggleRecording={toggleRecording}
              disabled={sending}
              vertical
            />
            <button type="submit" disabled={sending} className="btn-primary w-full py-2.5">
              {sending ? "Sending…" : sendLabel}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
