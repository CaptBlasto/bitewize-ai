import Link from "next/link";
import WaitlistForm from "@/components/WaitlistForm";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-bw-bg text-bw-text font-sans">

      {/* ── Navigation ───────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-bw-border bg-bw-bg/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent">
            Bitewize
          </span>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-bw-muted hover:text-bw-text transition"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="rounded-xl bg-gradient-to-r from-bw-purple to-bw-blue px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      <main>

        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6">
            Eat smarter with{" "}
            <span className="bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent">
              AI-powered
            </span>{" "}
            meal planning
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-bw-muted mb-10">
            Bitewize builds personalized meal plans, tracks your nutrition, and
            adjusts portions automatically — so you can focus on eating well,
            not calculating macros.
          </p>
          <Link
            href="/signup"
            className="inline-block rounded-xl bg-gradient-to-r from-bw-purple to-bw-blue px-8 py-4 text-lg font-semibold text-white hover:opacity-90 transition"
          >
            Get Started Free
          </Link>
        </section>

        {/* ── Features ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="rounded-2xl border border-bw-border bg-bw-card p-8">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-bw-purple to-bw-blue">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Meal Planning</h3>
              <p className="text-bw-muted">
                Tell us your goals and preferences. Our AI generates a full
                weekly plan tailored to you — breakfast through dinner.
              </p>
            </div>

            <div className="rounded-2xl border border-bw-border bg-bw-card p-8">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-bw-purple to-bw-blue">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Portions</h3>
              <p className="text-bw-muted">
                Portion sizes adjust dynamically based on your activity, weight
                goals, and progress — no manual tracking required.
              </p>
            </div>

            <div className="rounded-2xl border border-bw-border bg-bw-card p-8">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-bw-purple to-bw-blue">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Nutrition Insights</h3>
              <p className="text-bw-muted">
                Visual breakdowns of your macros, micronutrients, and trends
                over time — giving you a clear picture of your diet.
              </p>
            </div>

          </div>
        </section>

        {/* ── Waitlist CTA ──────────────────────────────────────── */}
        <section className="border-t border-bw-border">
          <div className="mx-auto max-w-6xl px-6 py-24 text-center">
            <h2 className="text-4xl font-bold mb-4">
              Be the first to{" "}
              <span className="bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent">
                try Bitewize
              </span>
            </h2>
            <p className="text-bw-muted mb-8 max-w-md mx-auto">
              We&apos;re rolling out early access. Drop your email to get
              notified when we launch.
            </p>
            <div className="flex justify-center">
              <WaitlistForm />
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-bw-border py-8 text-center text-bw-muted text-sm">
        &copy; {new Date().getFullYear()} Bitewize. All rights reserved.
      </footer>

    </div>
  );
}
