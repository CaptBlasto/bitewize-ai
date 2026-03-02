"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bw-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent"
          >
            Bitewize
          </Link>
          <h1 className="mt-4 text-2xl font-semibold text-bw-text">
            Welcome back
          </h1>
          <p className="mt-2 text-bw-muted text-sm">Sign in to your account</p>
        </div>

        <div className="rounded-2xl border border-bw-border bg-bw-card p-8">
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-bw-muted mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl bg-bw-bg border border-bw-border px-4 py-3 text-bw-text placeholder:text-bw-muted focus:outline-none focus:ring-2 focus:ring-bw-purple transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-bw-muted mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl bg-bw-bg border border-bw-border px-4 py-3 text-bw-text placeholder:text-bw-muted focus:outline-none focus:ring-2 focus:ring-bw-purple transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-gradient-to-r from-bw-purple to-bw-blue py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-bw-muted">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="text-bw-purple hover:opacity-80 transition font-medium"
          >
            Sign up
          </Link>
        </p>

      </div>
    </div>
  );
}
