import { Link } from "react-router-dom";
import { Heart, MessageCircle } from "lucide-react";
import { mediaUrl } from "../utils/mediaUrl.js";

export function reviewCommentAuthorLabel(comment) {
  if (comment.authorRole === "admin") {
    return `${comment.authorName} · Admin`;
  }
  if (comment.authorRole === "cleaning_crew") {
    const role = comment.crewSubRole?.replace("_", " ") || "Crew";
    const team = comment.teamName ? ` · ${comment.teamName}` : "";
    return `${comment.authorName}${team} (${role})`;
  }
  return `${comment.authorName} · Resident`;
}

function replyPreviewText(comment) {
  if (comment.text?.trim()) return comment.text.trim();
  if (comment.imageUrl) return "Photo";
  if (comment.voiceUrl) return "Voice note";
  return "Reply";
}

export default function ReviewCommentsSection({
  reportId,
  comments = [],
  backPath,
  backLabel = "Back",
  className = "",
}) {
  const previewComments = comments.slice(-3);

  return (
    <div className={`border-t border-theme-border pt-4 ${className}`.trim()}>
      <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-[#6b0f1a]">
        <MessageCircle className="h-4 w-4" />
        Replies ({comments.length})
      </p>

      {comments.length === 0 ? (
        <p className="text-sm text-black/60">No replies yet.</p>
      ) : (
        <ul className="mb-3 max-h-40 space-y-2 overflow-y-auto">
          {previewComments.map((comment) => (
            <li
              key={comment._id || comment.id}
              className="rounded-lg bg-[#fce1ee]/30 px-3 py-2 text-sm"
            >
              <p className="font-medium text-[#6b0f1a]">
                {reviewCommentAuthorLabel(comment)}
              </p>
              <p className="mt-1 text-black">{replyPreviewText(comment)}</p>
              {comment.imageUrl && (
                <img
                  src={mediaUrl(comment.imageUrl)}
                  alt=""
                  className="mt-2 max-h-24 rounded border object-cover"
                />
              )}
              <div className="mt-1 flex items-center gap-2 text-xs text-black/50">
                <span>{new Date(comment.createdAt).toLocaleString()}</span>
                {(comment.likeCount || 0) > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[#6b0f1a]">
                    <Heart className="h-3 w-3" />
                    {comment.likeCount}
                  </span>
                )}
              </div>
            </li>
          ))}
          {comments.length > previewComments.length && (
            <li className="text-xs text-black/60">
              +{comments.length - previewComments.length} more repl
              {comments.length - previewComments.length === 1 ? "y" : "ies"}
            </li>
          )}
        </ul>
      )}

      <Link
        to={`/reviews/${reportId}/replies`}
        state={{ backPath, backLabel }}
        className="guest-cta-btn inline-flex px-4 py-2 text-sm"
      >
        Write a reply
      </Link>
    </div>
  );
}
