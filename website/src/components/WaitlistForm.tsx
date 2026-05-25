"use client";

import { FormEvent, useState } from "react";

const FORM_ENDPOINT = process.env.NEXT_PUBLIC_WAITLIST_FORM_ENDPOINT ?? "";
const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@hititoff.app";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    if (!email.trim() || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
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
          body: JSON.stringify({ email, source: "hititoff.app" }),
        });

        if (!response.ok) {
          throw new Error("Submission failed");
        }

        setStatus("success");
        setMessage("You are on the list. We will email you when HitItOff launches.");
        setEmail("");
        return;
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again or email us directly.");
        return;
      }
    }

    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=HitItOff%20Waitlist&body=Please%20notify%20me%20at%20launch%3A%20${encodeURIComponent(email)}`;
    setStatus("success");
    setMessage("Your email app should open so you can join the waitlist.");
  }

  return (
    <div className="glass-card rounded-2xl p-6 sm:p-8">
      <h2 className="text-2xl font-semibold">Join the waitlist</h2>
      <p className="mt-2 text-sm leading-relaxed text-text-muted">
        Be first to know when HitItOff launches on the App Store and Google Play.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="waitlist-email" className="sr-only">
            Email address
          </label>
          <input
            id="waitlist-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none ring-primary/30 transition focus:ring-2"
          />
        </div>
        <input
          type="text"
          name="_gotcha"
          tabIndex={-1}
          autoComplete="off"
          className="hidden"
          aria-hidden="true"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "loading" ? "Submitting..." : "Notify me at launch"}
        </button>
      </form>
      {message && (
        <p
          className={`mt-4 text-sm ${status === "error" ? "text-danger" : "text-success"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
