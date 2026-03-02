"use client";

import { useState } from "react";

export default function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="text-bw-purple font-medium text-lg">
        You&apos;re on the list. We&apos;ll be in touch soon.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row gap-3 w-full max-w-md"
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="flex-1 rounded-xl bg-bw-card border border-bw-border px-4 py-3 text-bw-text placeholder:text-bw-muted focus:outline-none focus:ring-2 focus:ring-bw-purple transition"
      />
      <button
        type="submit"
        className="rounded-xl bg-gradient-to-r from-bw-purple to-bw-blue px-6 py-3 font-semibold text-white hover:opacity-90 transition"
      >
        Join Waitlist
      </button>
    </form>
  );
}
