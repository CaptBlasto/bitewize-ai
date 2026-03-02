"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-xl border border-bw-border bg-bw-card px-5 py-2 text-sm font-medium text-bw-muted hover:text-bw-text hover:border-bw-purple transition"
    >
      Sign Out
    </button>
  );
}
