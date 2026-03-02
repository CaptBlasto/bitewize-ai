"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const FREE_FEATURES = [
  "30-day meal planning",
  "Basic recipe suggestions",
  "Streak scoring system",
];

const PRO_FEATURES = [
  "Unlimited meal plans",
  "Recipes tailored to your dietary restrictions & preferences",
  "Nearby stores with cheapest ingredient prices",
  "Body composition tracker with customizable avatar",
  "Advanced scoring & analytics system",
];

export default function PlanPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  function selectPlan(plan: "free" | "premium") {
    localStorage.setItem("bw_selected_plan", plan);
    router.push("/onboarding/questionnaire");
  }

  return (
    <div className="min-h-screen bg-bw-bg text-bw-text flex flex-col items-center justify-center px-6 py-16">

      {/* Logo */}
      <Link
        href="/"
        className="text-2xl font-bold bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent mb-6"
      >
        Bitewize
      </Link>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold mb-3">Choose your plan</h1>
        <p className="text-bw-muted max-w-md mx-auto">
          Start free and upgrade anytime, or go Pro from day one for the full AI-powered experience.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">

        {/* Free */}
        <div
          className="flex flex-col rounded-2xl border border-bw-border bg-bw-card p-8 transition-all duration-500"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transitionDelay: "100ms",
          }}
        >
          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-bw-muted">
              Starter
            </span>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-extrabold">$0</span>
              <span className="text-bw-muted mb-1.5 text-sm">/month</span>
            </div>
            <p className="mt-2 text-sm text-bw-muted">Everything you need to get started.</p>
          </div>

          <ul className="flex flex-col gap-3 mb-8 flex-1">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={() => selectPlan("free")}
            className="w-full rounded-xl border border-bw-border bg-bw-bg py-3 font-semibold text-bw-text hover:border-bw-purple/60 transition"
          >
            Start Free
          </button>
        </div>

        {/* Premium */}
        <div
          className="relative flex flex-col rounded-2xl border border-bw-purple/40 bg-bw-card p-8 transition-all duration-500"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(24px)",
            transitionDelay: "200ms",
            boxShadow: "0 0 48px rgba(167,139,250,0.14), 0 0 96px rgba(96,165,250,0.07)",
          }}
        >
          {/* Badge */}
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
            <span className="rounded-full bg-gradient-to-r from-bw-purple to-bw-blue px-4 py-1 text-xs font-bold text-white whitespace-nowrap">
              Most Popular
            </span>
          </div>

          <div className="mb-6">
            <span className="text-xs font-semibold uppercase tracking-widest text-bw-purple">
              Pro
            </span>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-5xl font-extrabold bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent">
                $9.98
              </span>
              <span className="text-bw-muted mb-1.5 text-sm">/month</span>
            </div>
            <p className="mt-2 text-sm text-bw-muted">The full Bitewize experience.</p>
          </div>

          <ul className="flex flex-col gap-3 mb-8 flex-1">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm">
                <CheckIcon gradient />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={() => selectPlan("premium")}
            className="w-full rounded-xl bg-gradient-to-r from-bw-purple to-bw-blue py-3 font-semibold text-white hover:opacity-90 transition"
          >
            Go Premium
          </button>
        </div>

      </div>
    </div>
  );
}

function CheckIcon({ gradient }: { gradient?: boolean }) {
  return (
    <svg
      className={`mt-0.5 h-4 w-4 flex-shrink-0 ${gradient ? "text-bw-purple" : "text-bw-blue"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  );
}
