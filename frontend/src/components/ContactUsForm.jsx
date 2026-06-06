import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { contactApi } from "../api/client.js";

function MessageHistory({ messages }) {
  if (!messages.length) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#6b0f1a]">Your previous messages</h3>
      {messages.map((item) => (
        <article
          key={item.id}
          className="rounded-xl border border-theme-border bg-white p-4 text-sm text-black"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold">{item.subject || "General inquiry"}</p>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                item.status === "replied"
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {item.status === "replied" ? "Replied" : "Awaiting reply"}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-wrap">{item.body}</p>
          {item.adminReply && (
            <div className="mt-3 rounded-lg bg-[#fce1ee]/60 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#6b0f1a]">
                Admin response
              </p>
              <p className="mt-1 whitespace-pre-wrap">{item.adminReply}</p>
            </div>
          )}
          <p className="mt-2 text-xs text-neutral-600">
            Sent {new Date(item.createdAt).toLocaleString("en-GB")}
          </p>
        </article>
      ))}
    </div>
  );
}

export default function ContactUsForm({ user, showHistory = false, onSubmitted }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
    if (user?.email) setEmail(user.email);
  }, [user?.name, user?.email]);

  useEffect(() => {
    if (!showHistory || !user) return;
    setHistoryLoading(true);
    contactApi
      .mine()
      .then((res) => setHistory(res.data.messages || []))
      .catch(() => {})
      .finally(() => setHistoryLoading(false));
  }, [showHistory, user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await contactApi.submit({
        name: user ? undefined : name.trim(),
        email: user ? undefined : email.trim(),
        subject: subject.trim(),
        body: body.trim(),
      });
      toast.success("Message sent. We will get back to you soon.");
      setSubject("");
      setBody("");
      onSubmitted?.();
      if (showHistory && user) {
        const res = await contactApi.mine();
        setHistory(res.data.messages || []);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not send message");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!user && (
          <>
            <label className="block space-y-1">
              <span className="label-text">Your name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field w-full"
                placeholder="Optional"
              />
            </label>
            <label className="block space-y-1">
              <span className="label-text">Email address</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field w-full"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>
          </>
        )}

        {user && (
          <p className="rounded-lg border border-theme-border bg-[#fce1ee]/40 px-3 py-2 text-sm text-black">
            Sending as <strong>{user.name}</strong> ({user.email})
          </p>
        )}

        <label className="block space-y-1">
          <span className="label-text">Subject</span>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="input-field w-full"
            placeholder="What is this about?"
          />
        </label>

        <label className="block space-y-1">
          <span className="label-text">Message</span>
          <textarea
            required
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="input-field min-h-[140px] w-full resize-y"
            placeholder="Tell us how we can help…"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="guest-cta-btn w-full py-3 text-sm sm:w-auto sm:px-8"
        >
          {submitting ? "Sending…" : "Send message"}
        </button>
      </form>

      {showHistory && historyLoading && <p className="text-sm text-black">Loading your messages…</p>}
      {showHistory && !historyLoading && <MessageHistory messages={history} />}
    </div>
  );
}
