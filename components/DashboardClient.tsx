"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import MealPlanCard from "@/components/MealPlanCard";
import MealCalendarCard from "@/components/MealCalendarCard";
import WeeklyOverviewCard from "@/components/WeeklyOverviewCard";
import NutritionStatsCard from "@/components/NutritionStatsCard";
import XPStatsCard from "@/components/XPStatsCard";
import NutritionCoach from "@/components/NutritionCoach";
import ProfileSettings from "@/components/ProfileSettings";
import FoodLog, { type MacroTotals } from "@/components/FoodLog";

interface UserProfile {
  full_name: string | null;
  plan: string | null;
  primary_goal: string | null;
  weight_kg: number | null;
  goal_weight_kg: number | null;
}

interface Props {
  userId: string;
  email: string;
  profile: UserProfile | null;
}

export default function DashboardClient({ userId, email, profile }: Props) {
  const router = useRouter();
  const _now = new Date();
  const today = new Date(_now.getTime() - _now.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [weeklyRefreshKey, setWeeklyRefreshKey] = useState(0);
  const [xpRefreshKey, setXpRefreshKey] = useState(0);
  const [activeMealPlan, setActiveMealPlan] = useState<Record<string, unknown> | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [extraMacros, setExtraMacros] = useState<MacroTotals>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [profileData, setProfileData] = useState<UserProfile | null>(profile);

  async function fetchProfile() {
    const supabase = createClient();
    const { data } = await supabase
      .from("user_profiles")
      .select("full_name, plan, primary_goal, weight_kg, goal_weight_kg")
      .eq("id", userId)
      .single();
    if (data) setProfileData(data as UserProfile);
  }

  const coachUserProfile = profileData
    ? { ...profileData, tier: profileData.plan }
    : null;

  const displayName = profileData?.full_name ?? email.split("@")[0] ?? "there";
  const userPlan = profileData?.plan ?? "free";
  const isPro = userPlan === "premium";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-bw-bg text-bw-text">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-bw-border bg-bw-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent">
            Bitewize
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-xl border border-bw-border bg-bw-card px-4 py-2 text-sm font-medium text-bw-muted hover:text-bw-text hover:border-bw-purple transition flex items-center gap-1.5"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={handleLogout}
              className="rounded-xl border border-bw-border bg-bw-card px-5 py-2 text-sm font-medium text-bw-muted hover:text-bw-text hover:border-bw-purple transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">

        {/* Welcome banner */}
        <div className="mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-extrabold">
              Welcome back,{" "}
              <span className="bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent">
                {displayName}
              </span>
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold tracking-wide ${
                isPro
                  ? "bg-bw-purple/20 text-bw-purple border border-bw-purple/30"
                  : "bg-bw-border text-bw-muted border border-bw-border"
              }`}
            >
              {isPro ? "⚡ PRO" : "FREE"}
            </span>
          </div>
          {profileData?.primary_goal && (
            <p className="mt-1.5 text-bw-muted">
              Goal: <span className="text-bw-text font-medium">{profileData.primary_goal}</span>
              {profileData.weight_kg && profileData.goal_weight_kg && (
                <span className="ml-3 text-sm">
                  · {profileData.weight_kg}kg → {profileData.goal_weight_kg}kg
                </span>
              )}
            </p>
          )}
        </div>

        {/* Dashboard grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column — wider */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <MealPlanCard
              userPlan={userPlan}
              userId={userId}
              selectedDate={selectedDate}
              onMealPlanChange={(plan) => setActiveMealPlan(plan as Record<string, unknown> | null)}
              onPlanGenerated={() => {
                setWeeklyRefreshKey((k) => k + 1);
                setXpRefreshKey((k) => k + 1);
              }}
              extraMacros={extraMacros}
            />
            <FoodLog
              userId={userId}
              date={selectedDate}
              onTotalsChange={setExtraMacros}
            />
            <MealCalendarCard
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            <XPStatsCard refreshKey={xpRefreshKey} />
            <WeeklyOverviewCard refreshKey={weeklyRefreshKey} />
            <NutritionStatsCard />
          </div>

        </div>
      </main>

      <NutritionCoach
        mealPlan={activeMealPlan}
        userProfile={coachUserProfile}
        additionalFoods={extraMacros.calories > 0 ? extraMacros : null}
      />

      <ProfileSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onProfileUpdate={fetchProfile}
        userId={userId}
      />
    </div>
  );
}
