import { Fragment, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { contactApi } from "../api/client.js";

export default function AdminResidentMessagesPanel() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [savingId, setSavingId] = useState("");

  const load = () => {
    contactApi
      .adminList()
      .then((res) => setMessages(res.data.messages || []))
      .catch(() => toast.error("Failed to load resident messages"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, []);

  const openMessage = (message) => {
    if (expandedId === message.id) {
      setExpandedId(null);
      setReplyDraft("");
      return;
    }
    setExpandedId(message.id);
    setReplyDraft(message.adminReply || "");
  };

  const handleReply = async (messageId) => {
    if (!replyDraft.trim()) {
      toast.error("Enter a response");
      return;
    }
    setSavingId(messageId);
    try {
      const res = await contactApi.adminReply(messageId, { reply: replyDraft.trim() });
      setMessages((current) =>
        current.map((row) => (row.id === messageId ? res.data.message : row))
      );
      toast.success("Response sent");
      setExpandedId(null);
      setReplyDraft("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send response");
    } finally {
      setSavingId("");
    }
  };

  if (loading) return <p>Loading resident messages…</p>;

  if (messages.length === 0) {
    return <p className="text-black">No resident messages yet.</p>;
  }

  const openCount = messages.filter((item) => item.status === "open").length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-black">
        <strong>{openCount}</strong> message{openCount !== 1 ? "s" : ""} awaiting a response.
      </p>

      <div className="overflow-hidden rounded-xl border border-theme-border">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-theme-border bg-[#fce1ee]">
                <th className="px-4 py-3 font-semibold text-black">From</th>
                <th className="px-4 py-3 font-semibold text-black">Subject</th>
                <th className="px-4 py-3 font-semibold text-black">Received</th>
                <th className="px-4 py-3 font-semibold text-black">Status</th>
                <th className="px-4 py-3 font-semibold text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((message) => {
                const isExpanded = expandedId === message.id;
                return (
                  <Fragment key={message.id}>
                    <tr className="border-b border-theme-border">
                      <td className="px-4 py-3 text-black">
                        <p className="font-medium">{message.senderName || "Guest"}</p>
                        <p className="text-xs text-neutral-600">{message.senderEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-black">
                        {message.subject || "General inquiry"}
                      </td>
                      <td className="px-4 py-3 text-black">
                        {new Date(message.createdAt).toLocaleString("en-GB", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            message.status === "replied"
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {message.status === "replied" ? "Replied" : "Open"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => openMessage(message)}
                          className="guest-cta-btn px-4 py-1.5 text-sm"
                        >
                          {isExpanded ? "Close" : message.status === "replied" ? "View" : "Reply"}
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="border-b border-theme-border bg-[#fce1ee]/40">
                        <td colSpan={5} className="px-4 py-4">
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-[#6b0f1a]">
                                Resident message
                              </p>
                              <p className="mt-2 whitespace-pre-wrap text-black">{message.body}</p>
                            </div>

                            {message.adminReply && message.status === "replied" && (
                              <div className="rounded-lg border border-theme-border bg-white p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#6b0f1a]">
                                  Your previous response
                                </p>
                                <p className="mt-2 whitespace-pre-wrap text-black">
                                  {message.adminReply}
                                </p>
                              </div>
                            )}

                            <label className="block space-y-1">
                              <span className="label-text">
                                {message.status === "replied" ? "Update response" : "Your response"}
                              </span>
                              <textarea
                                rows={5}
                                value={replyDraft}
                                onChange={(e) => setReplyDraft(e.target.value)}
                                className="input-field min-h-[120px] w-full resize-y"
                                placeholder="Write your reply to the resident…"
                              />
                            </label>

                            <button
                              type="button"
                              disabled={savingId === message.id}
                              onClick={() => handleReply(message.id)}
                              className="guest-cta-btn px-6 py-2 text-sm"
                            >
                              {savingId === message.id ? "Sending…" : "Send response"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
