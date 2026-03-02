import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/DashboardClient";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("full_name, plan, primary_goal, weight_kg, goal_weight_kg")
    .eq("id", user.id)
    .single();

  return (
    <DashboardClient
      userId={user.id}
      email={user.email ?? ""}
      profile={profile}
    />
  );
}
