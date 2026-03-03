import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AvatarClient from "@/components/AvatarClient";

function localDateStr(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
}

export default async function AvatarPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const today = localDateStr(new Date());

  // Fetch in parallel
  const [profileResult, bodyStatsResult, todayPlanResult] = await Promise.all([
    supabase
      .from("user_profiles")
      .select(
        "full_name, weight_kg, goal_weight_kg, height_cm, age, sex, primary_goal, activity_level, xp, level, streak"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("body_stats")
      .select("*")
      .eq("id", user.id)
      .single(),
    supabase
      .from("meal_plans")
      .select("id")
      .eq("user_id", user.id)
      .eq("plan_date", today)
      .single(),
  ]);

  const profile = profileResult.data ?? null;
  // PGRST116 = no rows — fine for new users
  const bodyStats =
    bodyStatsResult.error?.code === "PGRST116" ? null : (bodyStatsResult.data ?? null);
  const hasTodayPlan = !todayPlanResult.error && !!todayPlanResult.data;

  return (
    <AvatarClient
      userId={user.id}
      profile={profile}
      initialBodyStats={bodyStats}
      hasTodayPlan={hasTodayPlan}
    />
  );
}
