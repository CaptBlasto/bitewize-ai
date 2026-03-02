import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-bw-bg text-bw-text">

      <header className="border-b border-bw-border bg-bw-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent">
            Bitewize
          </span>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl border border-bw-border bg-bw-card p-10">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent">
              {user.email ?? "there"}
            </span>
          </h1>
          <p className="text-bw-muted mt-2">
            Your dashboard is ready. Meal planning features are coming soon.
          </p>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {["Today's Plan", "Weekly Overview", "Nutrition Stats"].map((label) => (
              <div
                key={label}
                className="rounded-xl border border-bw-border bg-bw-bg p-6 text-center"
              >
                <p className="text-bw-muted text-sm font-medium">{label}</p>
                <p className="mt-2 text-2xl font-bold text-bw-text">—</p>
                <p className="mt-1 text-xs text-bw-muted">Coming soon</p>
              </div>
            ))}
          </div>
        </div>
      </main>

    </div>
  );
}
