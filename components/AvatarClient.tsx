"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import BodySilhouette, { OutfitTier, HairStyle, Gender } from "@/components/BodySilhouette";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserProfile {
  full_name: string | null;
  weight_kg: number | null;
  goal_weight_kg: number | null;
  height_cm: number | null;
  age: number | null;
  sex: string | null;
  primary_goal: string | null;
  activity_level: string | null;
  xp: number | null;
  level: number | null;
  streak: number | null;
}

interface BodyStats {
  current_weight: number | null;
  goal_weight: number | null;
  height_cm: number | null;
  age: number | null;
  gender: string | null;
  goal: string | null;
  body_fat_pct: number | null;
  activity_level: string | null;
  skin_tone: string | null;
  hair_style: string | null;
}

interface XPStats {
  xp: number;
  level: number;
  streak: number;
  xpInLevel: number;
}

interface Props {
  userId: string;
  profile: UserProfile | null;
  initialBodyStats: BodyStats | null;
  hasTodayPlan: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SKIN_TONES = [
  { id: "fair",   hex: "#FDEBD0", label: "Fair" },
  { id: "light",  hex: "#F1C27D", label: "Light" },
  { id: "medium", hex: "#E0AC69", label: "Medium" },
  { id: "tan",    hex: "#C68642", label: "Tan" },
  { id: "brown",  hex: "#8D5524", label: "Brown" },
  { id: "deep",   hex: "#4A2912", label: "Deep" },
];

const HAIR_STYLES: { id: HairStyle; label: string }[] = [
  { id: "short",  label: "Short" },
  { id: "medium", label: "Medium" },
  { id: "long",   label: "Long" },
  { id: "bun",    label: "Bun" },
];

const GOALS = [
  { id: "fat_loss",    label: "Fat Loss" },
  { id: "muscle_gain", label: "Muscle Gain" },
  { id: "recomp",      label: "Recomp" },
  { id: "maintenance", label: "Maintain" },
];

const ACTIVITY_LEVELS = [
  { id: "sedentary",  label: "Sedentary" },
  { id: "light",      label: "Light" },
  { id: "moderate",   label: "Moderate" },
  { id: "active",     label: "Active" },
  { id: "athlete",    label: "Athlete" },
];

const GENDERS: { id: Gender; label: string }[] = [
  { id: "male",    label: "Male" },
  { id: "female",  label: "Female" },
  { id: "neutral", label: "Non-binary" },
];

const BF_DESCRIPTORS = [
  { range: [5, 12],  label: "Very Lean / Athletic" },
  { range: [13, 20], label: "Fit" },
  { range: [21, 28], label: "Average" },
  { range: [29, 35], label: "Above Average" },
  { range: [36, 45], label: "High" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOutfitTier(level: number): OutfitTier {
  if (level <= 5)  return "rookie";
  if (level <= 10) return "warrior";
  if (level <= 20) return "elite";
  return "legend";
}

function getOutfitLabel(tier: OutfitTier): string {
  return { rookie: "Basic Clothes", warrior: "Athletic Gear", elite: "Elite Gear", legend: "Legendary Outfit ⚡" }[tier];
}

function nextTierLevel(level: number): number | null {
  if (level < 6)  return 6;
  if (level < 11) return 11;
  if (level < 21) return 21;
  return null;
}

function muscleFromActivity(activity: string | null): number {
  const map: Record<string, number> = {
    sedentary: 1, light: 1.5, moderate: 2.5, active: 3.5, athlete: 4.5,
  };
  return map[activity ?? "moderate"] ?? 2.5;
}

function postureFromStats(level: number, streak: number): number {
  const fromLevel = Math.min(3, level / 7);
  const fromStreak = Math.min(2, streak / 10);
  return Math.max(1, Math.round(fromLevel + fromStreak));
}

function projectStats(
  bodyFatPct: number,
  muscleLevel: number,
  goal: string,
  days: number
): { bodyFatPct: number; muscleLevel: number } {
  const rates: Record<string, { fat: number; muscle: number }> = {
    fat_loss:     { fat: 0.07,  muscle: 0.01 },
    muscle_gain:  { fat: 0.015, muscle: 0.04 },
    recomp:       { fat: 0.04,  muscle: 0.025 },
    maintenance:  { fat: 0.005, muscle: 0.005 },
  };
  const r = rates[goal] ?? rates.recomp;
  return {
    bodyFatPct: Math.max(5, bodyFatPct - r.fat * days),
    muscleLevel: Math.min(5, muscleLevel + r.muscle * days),
  };
}

function getBFDescriptor(pct: number): string {
  for (const d of BF_DESCRIPTORS) {
    if (pct >= d.range[0] && pct <= d.range[1]) return d.label;
  }
  return "";
}

function mapGoalFromProfile(primary_goal: string | null): string {
  if (!primary_goal) return "recomp";
  const g = primary_goal.toLowerCase();
  if (g.includes("lose") || g.includes("fat")) return "fat_loss";
  if (g.includes("muscle") || g.includes("build")) return "muscle_gain";
  if (g.includes("maintain")) return "maintenance";
  return "recomp";
}

function mapGenderFromSex(sex: string | null): Gender {
  if (sex === "Male") return "male";
  if (sex === "Female") return "female";
  return "neutral";
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AvatarClient({ userId, profile, initialBodyStats, hasTodayPlan }: Props) {
  const router = useRouter();
  const firstName = profile?.full_name?.split(" ")[0] ?? "Your";

  // Form state (pre-filled from body_stats, falling back to user_profiles)
  const [form, setForm] = useState({
    current_weight: initialBodyStats?.current_weight ?? profile?.weight_kg ?? 70,
    goal_weight:    initialBodyStats?.goal_weight    ?? profile?.goal_weight_kg ?? 65,
    height_cm:      initialBodyStats?.height_cm      ?? profile?.height_cm ?? 170,
    age:            initialBodyStats?.age            ?? profile?.age ?? 25,
    gender:         (initialBodyStats?.gender        ?? mapGenderFromSex(profile?.sex ?? null)) as Gender,
    goal:           initialBodyStats?.goal           ?? mapGoalFromProfile(profile?.primary_goal ?? null),
    body_fat_pct:   initialBodyStats?.body_fat_pct   ?? 22,
    activity_level: initialBodyStats?.activity_level ?? profile?.activity_level ?? "moderate",
    skin_tone:      initialBodyStats?.skin_tone      ?? "medium",
    hair_style:     (initialBodyStats?.hair_style    ?? "short") as HairStyle,
  });

  const [xpStats, setXpStats] = useState<XPStats>({
    xp: profile?.xp ?? 0,
    level: profile?.level ?? 1,
    streak: profile?.streak ?? 0,
    xpInLevel: (profile?.xp ?? 0) % 200,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/award-xp")
      .then((r) => r.json())
      .then((d) => { if (!d.error) setXpStats(d); })
      .catch(() => {});
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/body-stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  // Derived avatar params
  const level = xpStats.level;
  const streak = xpStats.streak;
  const outfitTier = getOutfitTier(level);
  const skinHex = SKIN_TONES.find((s) => s.id === form.skin_tone)?.hex ?? "#E0AC69";
  const muscleBase = muscleFromActivity(form.activity_level);
  const postureLevel = postureFromStats(level, streak);

  const todayStats = { bodyFatPct: form.body_fat_pct, muscleLevel: muscleBase };
  const day30Stats = projectStats(form.body_fat_pct, muscleBase, form.goal, 30);
  const day90Stats = projectStats(form.body_fat_pct, muscleBase, form.goal, 90);

  const effects = {
    glowRing: streak > 0,
    dimmed: !hasTodayPlan,
    shimmer: xpStats.xpInLevel < 25 && level > 1,
  };

  function pill(
    options: { id: string; label: string }[],
    value: string,
    onChange: (v: string) => void
  ) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
              value === o.id
                ? "bg-bw-purple/20 border-bw-purple/50 text-bw-purple"
                : "border-bw-border text-bw-muted hover:border-bw-purple/40 hover:text-bw-text"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    );
  }

  const nextLevel = nextTierLevel(level);
  const currentTierLabel = getOutfitLabel(outfitTier);

  return (
    <div className="min-h-screen bg-bw-bg text-bw-text">

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-bw-border bg-bw-card/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent">
              Bitewize
            </span>
            <Link
              href="/dashboard"
              className="flex items-center gap-1 text-sm text-bw-muted hover:text-bw-text transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
          </div>
          <button
            onClick={handleLogout}
            className="rounded-xl border border-bw-border bg-bw-card px-5 py-2 text-sm font-medium text-bw-muted hover:text-bw-text hover:border-bw-purple transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">

        {/* Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold">
            <span className="bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent">
              {firstName}&apos;s Avatar
            </span>
          </h1>
          <p className="mt-1.5 text-bw-muted text-sm">
            Your body composition visualized — see your transformation path.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left — Avatar display (2/3 width) */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Three avatar states */}
            <div className="rounded-2xl border border-bw-border bg-bw-card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold">Transformation Preview</h2>
                <div className="flex items-center gap-2 text-xs text-bw-muted">
                  {effects.glowRing && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      {streak} day streak
                    </span>
                  )}
                  {effects.dimmed && (
                    <span className="text-yellow-500/80">No plan today</span>
                  )}
                  {effects.shimmer && (
                    <span className="text-amber-400">✨ Leveled up!</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Today */}
                <div className="flex flex-col items-center gap-3">
                  <BodySilhouette
                    gender={form.gender}
                    bodyFatPct={todayStats.bodyFatPct}
                    muscleLevel={todayStats.muscleLevel}
                    postureLevel={postureLevel}
                    skinTone={skinHex}
                    hairStyle={form.hair_style}
                    outfitTier={outfitTier}
                    effects={effects}
                    label="Today"
                  />
                  <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-bw-border text-xs text-bw-muted">
                      {todayStats.bodyFatPct.toFixed(0)}% BF
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-bw-border text-xs text-bw-muted">
                      {todayStats.muscleLevel.toFixed(1)} muscle
                    </span>
                  </div>
                </div>

                {/* 30 Days */}
                <div className="flex flex-col items-center gap-3">
                  <BodySilhouette
                    gender={form.gender}
                    bodyFatPct={day30Stats.bodyFatPct}
                    muscleLevel={day30Stats.muscleLevel}
                    postureLevel={Math.min(5, postureLevel + 1)}
                    skinTone={skinHex}
                    hairStyle={form.hair_style}
                    outfitTier={outfitTier}
                    effects={{ glowRing: false, dimmed: false, shimmer: false }}
                    label="30 Days"
                  />
                  <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-bw-blue/10 border border-bw-blue/20 text-xs text-bw-blue">
                      {day30Stats.bodyFatPct.toFixed(0)}% BF
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-bw-blue/10 border border-bw-blue/20 text-xs text-bw-blue">
                      {day30Stats.muscleLevel.toFixed(1)} muscle
                    </span>
                  </div>
                </div>

                {/* 90 Days */}
                <div className="flex flex-col items-center gap-3">
                  <BodySilhouette
                    gender={form.gender}
                    bodyFatPct={day90Stats.bodyFatPct}
                    muscleLevel={day90Stats.muscleLevel}
                    postureLevel={Math.min(5, postureLevel + 2)}
                    skinTone={skinHex}
                    hairStyle={form.hair_style}
                    outfitTier={outfitTier}
                    effects={{ glowRing: false, dimmed: false, shimmer: false }}
                    label="90 Days"
                  />
                  <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-bw-purple/10 border border-bw-purple/20 text-xs text-bw-purple">
                      {day90Stats.bodyFatPct.toFixed(0)}% BF
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-bw-purple/10 border border-bw-purple/20 text-xs text-bw-purple">
                      {day90Stats.muscleLevel.toFixed(1)} muscle
                    </span>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-bw-border grid grid-cols-3 gap-3 text-center text-xs text-bw-muted">
                <div>Current state</div>
                <div className="text-bw-blue">If consistent for 30 days</div>
                <div className="text-bw-purple">Full 90-day transformation</div>
              </div>
            </div>

            {/* Body Stats Form */}
            <div className="rounded-2xl border border-bw-border bg-bw-card p-6">
              <h2 className="text-lg font-bold mb-5">Body Stats</h2>

              <div className="flex flex-col gap-5">

                {/* Weight + Height row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-bw-muted mb-1.5">
                      Current Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={form.current_weight ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, current_weight: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-xl bg-bw-bg border border-bw-border px-4 py-2.5 text-bw-text text-sm focus:outline-none focus:ring-2 focus:ring-bw-purple transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-bw-muted mb-1.5">
                      Goal Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={form.goal_weight ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, goal_weight: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-xl bg-bw-bg border border-bw-border px-4 py-2.5 text-bw-text text-sm focus:outline-none focus:ring-2 focus:ring-bw-purple transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-bw-muted mb-1.5">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={form.height_cm ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, height_cm: parseFloat(e.target.value) || 0 }))}
                      className="w-full rounded-xl bg-bw-bg border border-bw-border px-4 py-2.5 text-bw-text text-sm focus:outline-none focus:ring-2 focus:ring-bw-purple transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-bw-muted mb-1.5">
                      Age
                    </label>
                    <input
                      type="number"
                      value={form.age ?? ""}
                      onChange={(e) => setForm((f) => ({ ...f, age: parseInt(e.target.value) || 0 }))}
                      className="w-full rounded-xl bg-bw-bg border border-bw-border px-4 py-2.5 text-bw-text text-sm focus:outline-none focus:ring-2 focus:ring-bw-purple transition"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-medium text-bw-muted mb-2">Gender</label>
                  {pill(GENDERS, form.gender, (v) => setForm((f) => ({ ...f, gender: v as Gender })))}
                </div>

                {/* Goal */}
                <div>
                  <label className="block text-xs font-medium text-bw-muted mb-2">Goal</label>
                  {pill(GOALS, form.goal, (v) => setForm((f) => ({ ...f, goal: v })))}
                </div>

                {/* Body Fat Slider */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-xs font-medium text-bw-muted">Body Fat %</label>
                    <span className="text-xs font-semibold text-bw-text">
                      {form.body_fat_pct}% — {getBFDescriptor(form.body_fat_pct)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={45}
                    value={form.body_fat_pct}
                    onChange={(e) => setForm((f) => ({ ...f, body_fat_pct: parseInt(e.target.value) }))}
                    className="w-full accent-[#a78bfa]"
                  />
                  <div className="flex justify-between text-[10px] text-bw-muted mt-1">
                    <span>5% Lean</span>
                    <span>15% Fit</span>
                    <span>25% Average</span>
                    <span>35% High</span>
                    <span>45%+</span>
                  </div>
                </div>

                {/* Activity Level */}
                <div>
                  <label className="block text-xs font-medium text-bw-muted mb-2">Activity Level</label>
                  {pill(ACTIVITY_LEVELS, form.activity_level, (v) => setForm((f) => ({ ...f, activity_level: v })))}
                </div>

                {/* Save */}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-1 w-full rounded-xl bg-gradient-to-r from-bw-purple to-bw-blue py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Stats"}
                </button>
              </div>
            </div>
          </div>

          {/* Right — Customization */}
          <div className="flex flex-col gap-6">

            {/* Avatar customization */}
            <div className="rounded-2xl border border-bw-border bg-bw-card p-6">
              <h2 className="text-lg font-bold mb-5">Customize</h2>

              {/* Skin tone */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-bw-muted mb-3">Skin Tone</label>
                <div className="flex gap-2 flex-wrap">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      title={tone.label}
                      onClick={() => setForm((f) => ({ ...f, skin_tone: tone.id }))}
                      className={`h-8 w-8 rounded-full border-2 transition ${
                        form.skin_tone === tone.id
                          ? "border-bw-purple ring-2 ring-bw-purple ring-offset-1 ring-offset-bw-card"
                          : "border-bw-border hover:border-bw-purple/50"
                      }`}
                      style={{ backgroundColor: tone.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Hair style */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-bw-muted mb-3">Hair Style</label>
                <div className="grid grid-cols-4 gap-2">
                  {HAIR_STYLES.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, hair_style: h.id }))}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition ${
                        form.hair_style === h.id
                          ? "border-bw-purple bg-bw-purple/10 text-bw-purple"
                          : "border-bw-border text-bw-muted hover:border-bw-purple/40"
                      }`}
                    >
                      <HairIcon style={h.id} />
                      <span className="text-[10px] font-medium">{h.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Outfit (auto, based on level) */}
              <div>
                <label className="block text-xs font-medium text-bw-muted mb-3">Outfit</label>
                <div className={`rounded-xl border p-3 ${
                  outfitTier === "legend"  ? "border-amber-500/30 bg-amber-500/10" :
                  outfitTier === "elite"   ? "border-bw-purple/30 bg-bw-purple/10" :
                  outfitTier === "warrior" ? "border-bw-blue/30 bg-bw-blue/10" :
                  "border-bw-border bg-bw-border/30"
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${
                      outfitTier === "legend"  ? "text-amber-400" :
                      outfitTier === "elite"   ? "text-bw-purple" :
                      outfitTier === "warrior" ? "text-bw-blue" :
                      "text-bw-muted"
                    }`}>
                      {currentTierLabel}
                    </span>
                    <span className="text-xs text-bw-muted">Lv.{level}</span>
                  </div>
                  {nextLevel && (
                    <p className="text-[10px] text-bw-muted mt-1">
                      Reach Level {nextLevel} to unlock{" "}
                      {nextLevel === 6 ? "Athletic Gear" : nextLevel === 11 ? "Elite Gear" : "Legendary Outfit"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* XP summary */}
            <div className="rounded-2xl border border-bw-border bg-bw-card p-6">
              <h2 className="text-base font-bold mb-3">Progress</h2>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-extrabold bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent">
                  Lv.{level}
                </span>
                {streak > 0 && (
                  <span className="text-sm font-semibold">🔥 {streak} day streak</span>
                )}
              </div>
              <div className="h-2 w-full rounded-full bg-bw-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-bw-purple to-bw-blue transition-all duration-500"
                  style={{ width: `${Math.round((xpStats.xpInLevel / 200) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-bw-muted mt-1.5 text-right">
                {xpStats.xpInLevel} / 200 XP
              </p>
              {!hasTodayPlan && (
                <Link
                  href="/dashboard"
                  className="mt-3 block w-full text-center rounded-xl border border-bw-purple/30 bg-bw-purple/10 py-2 text-xs font-medium text-bw-purple hover:bg-bw-purple/20 transition"
                >
                  Generate today&apos;s plan to earn XP →
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Hair Icon Components ─────────────────────────────────────────────────────

function HairIcon({ style }: { style: HairStyle }) {
  const cls = "w-7 h-7";
  if (style === "short") {
    return (
      <svg className={cls} viewBox="0 0 28 28" fill="currentColor">
        <ellipse cx="14" cy="12" rx="7" ry="5" />
        <circle cx="14" cy="15" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (style === "medium") {
    return (
      <svg className={cls} viewBox="0 0 28 28" fill="currentColor">
        <ellipse cx="14" cy="10" rx="7" ry="5" />
        <rect x="7" y="13" width="3" height="8" rx="1.5" />
        <rect x="18" y="13" width="3" height="8" rx="1.5" />
      </svg>
    );
  }
  if (style === "long") {
    return (
      <svg className={cls} viewBox="0 0 28 28" fill="currentColor">
        <ellipse cx="14" cy="9" rx="7" ry="5" />
        <rect x="6" y="12" width="3" height="13" rx="1.5" />
        <rect x="19" y="12" width="3" height="13" rx="1.5" />
        <rect x="11" y="13" width="6" height="10" rx="2" />
      </svg>
    );
  }
  // bun
  return (
    <svg className={cls} viewBox="0 0 28 28" fill="currentColor">
      <ellipse cx="14" cy="15" rx="7" ry="5" />
      <circle cx="14" cy="8" r="4" />
    </svg>
  );
}
