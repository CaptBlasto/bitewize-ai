/*
 * Run this SQL in your Supabase dashboard (SQL Editor) before using this route:
 *
 * create table public.body_stats (
 *   id uuid references auth.users(id) on delete cascade primary key,
 *   current_weight numeric,
 *   goal_weight numeric,
 *   height_cm numeric,
 *   age int,
 *   gender text,
 *   goal text,
 *   body_fat_pct numeric,
 *   activity_level text,
 *   skin_tone text default 'medium',
 *   hair_style text default 'short',
 *   updated_at timestamp with time zone default now()
 * );
 *
 * alter table public.body_stats enable row level security;
 *
 * create policy "Users can view own body stats" on public.body_stats
 *   for select using (auth.uid() = id);
 * create policy "Users can insert own body stats" on public.body_stats
 *   for insert with check (auth.uid() = id);
 * create policy "Users can update own body stats" on public.body_stats
 *   for update using (auth.uid() = id);
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("body_stats")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows found — that's fine for new users
    console.error("body-stats GET error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }

  return NextResponse.json(data ?? null);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("body_stats")
    .upsert({
      id: user.id,
      current_weight: body.current_weight ?? null,
      goal_weight: body.goal_weight ?? null,
      height_cm: body.height_cm ?? null,
      age: body.age ?? null,
      gender: body.gender ?? null,
      goal: body.goal ?? null,
      body_fat_pct: body.body_fat_pct ?? null,
      activity_level: body.activity_level ?? null,
      skin_tone: body.skin_tone ?? "medium",
      hair_style: body.hair_style ?? "short",
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("body-stats POST error:", error);
    return NextResponse.json({ error: "Failed to save stats" }, { status: 500 });
  }

  return NextResponse.json(data);
}
