"use client";

import { FormEvent, useState } from "react";

import { APP_NAME, SUPPORT_EMAIL } from "@/lib/brand";

const FORM_ENDPOINT = process.env.NEXT_PUBLIC_SUPPORT_FORM_ENDPOINT ?? "";

export function SupportForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [feedback, setFeedback] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setFeedback("");

    if (!email.trim() || !message.trim()) {
      setStatus("error");
      setFeedback("Please fill in all fields.");
      return;
    }

    if (FORM_ENDPOINT) {
      try {
        const response = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, message, source: "support" }),
        });
        if (!response.ok) throw new Error("Failed");
        setStatus("success");
        setFeedback("Thanks — we received your message and will reply soon.");
        setEmail("");
        setMessage("");
        return;
      } catch {
        setStatus("error");
        setFeedback("Something went wrong. Please email us directly.");
        return;
      }
    }

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`${APP_NAME} Support`)}&body=${encodeURIComponent(`From: ${email}\n\n${message}`)}`;
    setStatus("success");
    setFeedback("Your email app should open so you can send your message.");
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card mt-8 space-y-4 rounded-2xl p-6">
      <div>
        <label htmlFor="support-email" className="mb-2 block text-sm font-medium">
          Email
        </label>
        <input
          id="support-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none ring-primary/30 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="support-message" className="mb-2 block text-sm font-medium">
          Message
        </label>
        <textarea
          id="support-message"
          required
          rows={5}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none ring-primary/30 focus:ring-2"
        />
      </div>
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {status === "loading" ? "Sending..." : "Send message"}
      </button>
      {feedback && (
        <p
          className={`text-sm ${status === "error" ? "text-danger" : "text-success"}`}
          role="status"
        >
          {feedback}
        </p>
      )}
    </form>
  );
}
