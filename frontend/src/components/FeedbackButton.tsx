"use client";

import { useState, useRef } from "react";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    setError("");
    setSent(false);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to send");
      }

      setSent(true);
      setText("");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // reset after close animation
    setTimeout(() => {
      setText("");
      setSent(false);
      setError("");
    }, 200);
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => {
          setOpen(true);
          setTimeout(() => textareaRef.current?.focus(), 200);
        }}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent-bg text-accent-text shadow-lg hover:brightness-110 transition-all active:scale-95"
        title="Send feedback"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
          <div
            className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl ring-1 ring-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-primary">Send Feedback</h3>
              <button
                onClick={handleClose}
                className="text-secondary hover:text-primary transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {sent ? (
              <div className="text-center py-6">
                <svg className="mx-auto h-10 w-10 text-green-500 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-base font-medium text-primary">Thank you!</p>
                <p className="text-sm text-secondary mt-1">Your feedback has been sent.</p>
                <button
                  onClick={handleClose}
                  className="mt-4 rounded-md bg-accent-bg px-4 py-2 text-sm font-medium text-accent-text hover:brightness-110 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Tell me what you think…"
                  rows={4}
                  className="block w-full rounded-md border border-border bg-elevated px-3 py-2 text-sm text-primary shadow-sm placeholder-secondary/50 focus:border-accent-text focus:outline-none focus:ring-1 focus:ring-accent-text resize-none"
                />

                {error && (
                  <p className="mt-2 text-sm font-medium text-red-400">{error}</p>
                )}

                <div className="mt-4 flex justify-end gap-3">
                  <button
                    onClick={handleClose}
                    className="rounded-md bg-elevated px-4 py-2 text-sm font-medium text-primary shadow-sm ring-1 ring-inset ring-border hover:brightness-110 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="rounded-md bg-accent-bg px-4 py-2 text-sm font-medium text-accent-text shadow-sm hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}