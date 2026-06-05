import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CornerUpLeft, Heart } from "lucide-react";
import toast from "react-hot-toast";
import { communityFeedApi } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import { homePathForRole } from "../config/roles.js";
import StarRating from "../components/StarRating.jsx";
import ChatMediaActions from "../components/ChatMediaActions.jsx";
import { reviewCommentAuthorLabel } from "../components/ReviewCommentsSection.jsx";
import { mediaUrl } from "../utils/mediaUrl.js";

function ReplyBubble({ comment, onLike, onReply, audioRefs, toggleAudioPlayback }) {
  return (
    <div className="rounded-lg border border-theme-border p-3">
      <p className="text-xs font-semibold text-[#6b0f1a]">
        {reviewCommentAuthorLabel(comment)}
      </p>
      {comment.replyToSenderName && (
        <div className="mt-1 rounded border-l-4 border-[#6b0f1a] bg-[#fce1ee]/40 p-2 text-xs text-black">
          <p className="font-semibold text-[#6b0f1a]">
            Reply to {comment.replyToSenderName}
          </p>
          <p className="mt-1 line-clamp-2">{comment.replyToText || "…"}</p>
        </div>
      )}
      {comment.text && <p className="mt-1 text-sm text-black">{comment.text}</p>}
      {comment.imageUrl && (
        <img
          src={mediaUrl(comment.imageUrl)}
          alt=""
          className="mt-2 max-h-40 rounded-lg border object-cover"
        />
      )}
      {comment.voiceUrl && (
        <audio
          ref={(el) => {
            audioRefs.current[comment._id || comment.id] = el;
          }}
          controls
          preload="metadata"
          src={mediaUrl(comment.voiceUrl)}
          className="mt-2 w-full max-w-xs cursor-pointer"
          onClick={() => toggleAudioPlayback(comment._id || comment.id)}
        />
      )}
      <div className="mt-2 flex items-center gap-3 text-xs text-[#6b0f1a]">
        <button
          type="button"
          onClick={() => onLike(comment._id || comment.id)}
          className="flex items-center gap-1"
        >
          <Heart className={`h-4 w-4 ${comment.likedByMe ? "fill-[#6b0f1a]" : ""}`} />
          {comment.likeCount || 0}
        </button>
        <button
          type="button"
          onClick={() =>
            onReply({
              type: "comment",
              id: comment._id || comment.id,
              senderName: comment.authorName,
              text: comment.text || comment.replyToText || "Reply",
            })
          }
          className="flex items-center gap-1 hover:underline"
        >
          <CornerUpLeft className="h-4 w-4" />
          Reply
        </button>
      </div>
      <p className="mt-1 text-xs text-black/50">
        {new Date(comment.createdAt).toLocaleString()}
      </p>
    </div>
  );
}

export default function ReviewThreadPage() {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [review, setReview] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const backPath =
    location.state?.backPath || (user ? homePathForRole(user.role, user.crewSubRole) : "/");
  const backLabel = location.state?.backLabel || "Back";

  const load = () =>
    communityFeedApi
      .getThread(reportId)
      .then((res) => {
        setReview(res.data.review);
        setComments(res.data.comments);
      })
      .catch(() => {
        toast.error("Could not load review thread");
        navigate(backPath);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, [reportId]);

  const scrollThreadToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
      if (replyTarget?.type === "comment" && replyTarget.id) {
        fd.append("replyToCommentId", replyTarget.id);
      } else if (replyTarget?.type === "review") {
        fd.append("replyToReview", "true");
      }
      await communityFeedApi.sendReply(reportId, fd);
      setText("");
      setImage(null);
      setVoice(null);
      setReplyTarget(null);
      await load();
      scrollThreadToBottom();
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send reply");
    } finally {
      setSending(false);
    }
  };

  const toggleReviewLike = async () => {
    try {
      const res = await communityFeedApi.likeReview(reportId);
      setReview((prev) =>
        prev
          ? {
              ...prev,
              feedback: {
                ...prev.feedback,
                likedByMe: res.data.likedByMe,
                likeCount: res.data.likeCount,
              },
            }
          : prev
      );
    } catch {
      toast.error("Could not update like");
    }
  };

  const toggleCommentLike = async (commentId) => {
    try {
      const res = await communityFeedApi.likeComment(commentId);
      setComments((prev) =>
        prev.map((c) => (c._id === commentId || c.id === commentId ? res.data.comment : c))
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

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-black">Loading…</div>
    );
  }

  if (!review) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-6xl px-4 py-6"
    >
      <section className="card flex min-h-[calc(100vh-8rem)] flex-col p-4 sm:p-6">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="mb-4 self-start text-sm font-medium text-[#6b0f1a] hover:underline"
        >
          ← {backLabel}
        </button>

        <h1 className="text-xl font-bold text-black">Review Replies</h1>
        {review.reportId && (
          <p className="mt-1 font-mono text-xs text-[#6b0f1a]">ID: {review.reportId}</p>
        )}

        <div className="mt-4 grid min-h-0 flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,22rem)]">
          <div className="flex min-h-[20rem] flex-col lg:min-h-0">
            <h2 className="mb-3 shrink-0 text-sm font-semibold uppercase tracking-wide text-[#6b0f1a]">
              Review &amp; Replies
            </h2>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              <article className="rounded-xl border-2 border-[#6b0f1a]/20 bg-[#fce1ee]/20 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-semibold text-black">{review.title}</h2>
                  <p className="text-xs text-black/60">
                    {new Date(review.feedback.submittedAt).toLocaleString()}
                  </p>
                </div>
                <p className="mt-2 text-sm text-black/70">
                  Review by <strong>{review.reviewerName}</strong>
                  {review.assignedTeamDisplay && (
                    <>
                      {" "}
                      · Team: <strong>{review.assignedTeamDisplay}</strong>
                    </>
                  )}
                </p>
                <div className="mt-3">
                  <StarRating value={review.feedback.rating} readOnly />
                </div>
                {review.feedback.comment ? (
                  <p className="mt-3 text-sm text-black">{review.feedback.comment}</p>
                ) : (
                  <p className="mt-3 text-sm text-black/60">No written review.</p>
                )}
                {review.feedback.photoUrl && (
                  <img
                    src={mediaUrl(review.feedback.photoUrl)}
                    alt=""
                    className="mt-3 max-h-48 rounded-lg border object-cover"
                  />
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-[#6b0f1a]">
                  <button
                    type="button"
                    onClick={toggleReviewLike}
                    className="flex items-center gap-1"
                  >
                    <Heart
                      className={`h-4 w-4 ${review.feedback.likedByMe ? "fill-[#6b0f1a]" : ""}`}
                    />
                    {review.feedback.likeCount || 0}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setReplyTarget({
                        type: "review",
                        senderName: review.reviewerName,
                        text: review.feedback.comment || "Review",
                      })
                    }
                    className="flex items-center gap-1 hover:underline"
                  >
                    <CornerUpLeft className="h-4 w-4" />
                    Reply
                  </button>
                </div>
              </article>

              {comments.length === 0 ? (
                <p className="text-sm text-black/60">No replies yet. Be the first to reply.</p>
              ) : (
                comments.map((comment) => (
                  <ReplyBubble
                    key={comment._id || comment.id}
                    comment={comment}
                    onLike={toggleCommentLike}
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
              Write a Reply
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
                placeholder="Write your reply…"
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
                {sending ? "Sending…" : "Send reply"}
              </button>
            </form>
          </aside>
        </div>
      </section>
    </motion.div>
  );
}
