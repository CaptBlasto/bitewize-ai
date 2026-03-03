/*
 * Run this SQL in your Supabase dashboard (SQL Editor) before using this route:
 *
 * alter table public.user_profiles
 *   add column if not exists xp integer default 0,
 *   add column if not exists level integer default 1,
 *   add column if not exists streak integer default 0,
 *   add column if not exists last_active_date date;
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─── Helpers ────────────────────────────────────────────────────────────────

const XP_PER_LEVEL = 200;

function calcLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function getTierName(level: number): string {
  if (level <= 5) return "Rookie";
  if (level <= 10) return "Warrior";
  if (level <= 20) return "Elite";
  return "Legend";
}

function getTodayString(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];
}

function buildStatsResponse(xp: number, streak: number, lastActiveDate: string | null, fullName: string | null) {
  const level = calcLevel(xp);
  const xpInLevel = xp % XP_PER_LEVEL;
  const firstName = fullName?.split(" ")[0] ?? null;
  return {
    xp,
    level,
    streak,
    tierName: getTierName(level),
    xpInLevel,
    xpToNextLevel: XP_PER_LEVEL,
    xpPct: Math.round((xpInLevel / XP_PER_LEVEL) * 100),
    last_active_date: lastActiveDate,
    firstName,
  };
}

// ─── GET — fetch current XP stats ───────────────────────────────────────────

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("xp, level, streak, last_active_date, full_name")
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const xp: number = profile.xp ?? 0;
  const streak: number = profile.streak ?? 0;

  return NextResponse.json(buildStatsResponse(xp, streak, profile.last_active_date, profile.full_name));
}

// ─── POST — award XP ────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const type: string = body.type ?? "";

  if (type !== "login" && type !== "meal_plan") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("xp, level, streak, last_active_date, full_name")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const today = getTodayString();
  let newXp: number = profile.xp ?? 0;
  let newStreak: number = profile.streak ?? 0;
  let newLastActiveDate: string | null = profile.last_active_date ?? null;
  let xpAwarded = 0;
  let alreadyAwarded = false;

  if (type === "login") {
    if (newLastActiveDate === today) {
      // Already credited today — return current stats without a DB write
      alreadyAwarded = true;
    } else {
      // Compute yesterday's date string
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yesterdayStr = new Date(
        yest.getTime() - yest.getTimezoneOffset() * 60000
      )
        .toISOString()
        .split("T")[0];

      if (newLastActiveDate === yesterdayStr) {
        // Consecutive day — extend streak
        newStreak = newStreak + 1;
      } else {
        // Streak broken or brand-new user — start fresh
        newStreak = 1;
      }

      xpAwarded = 100;
      newXp = newXp + xpAwarded;
      newLastActiveDate = today;
    }
  } else {
    // meal_plan
    xpAwarded = 50;
    newXp = newXp + xpAwarded;
  }

  const newLevel = calcLevel(newXp);

  if (!alreadyAwarded) {
    const updatePayload: Record<string, unknown> = {
      xp: newXp,
      level: newLevel,
    };

    if (type === "login") {
      updatePayload.streak = newStreak;
      updatePayload.last_active_date = newLastActiveDate;
    }

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update(updatePayload)
      .eq("id", user.id);

    if (updateError) {
      console.error("award-xp update error:", updateError);
      return NextResponse.json({ error: "Failed to update XP" }, { status: 500 });
    }
  }

  return NextResponse.json({
    ...buildStatsResponse(newXp, newStreak, newLastActiveDate, profile.full_name),
    xpAwarded,
    alreadyAwarded,
  });
}
