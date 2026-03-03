/*
 * Run this SQL in your Supabase dashboard (SQL Editor) before using this route:
 *
 * create table public.meal_plans (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users(id) on delete cascade not null,
 *   plan_date date not null,
 *   meals jsonb not null,
 *   macros jsonb not null,
 *   generated_at timestamp with time zone default now(),
 *   unique(user_id, plan_date)
 * );
 *
 * alter table public.meal_plans enable row level security;
 *
 * create policy "Users can view own meal plans" on public.meal_plans
 *   for select using (auth.uid() = user_id);
 *
 * create policy "Users can insert own meal plans" on public.meal_plans
 *   for insert with check (auth.uid() = user_id);
 *
 * create policy "Users can update own meal plans" on public.meal_plans
 *   for update using (auth.uid() = user_id);
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT =
  "You are a professional nutritionist and personal chef. You create delicious, realistic, detailed meal plans tailored to each person's exact profile. Always return valid JSON only — no markdown, no explanation, just the raw JSON object.";

function buildUserPrompt(profile: Record<string, unknown>, date: string): string {
  const dietTypes = Array.isArray(profile.diet_types)
    ? (profile.diet_types as string[]).join(", ")
    : "Standard";
  const allergies = Array.isArray(profile.allergies)
    ? (profile.allergies as string[]).join(", ") || "None"
    : "None";
  const appliances = Array.isArray(profile.appliances)
    ? (profile.appliances as string[]).join(", ") || "Stovetop, Oven"
    : "Stovetop, Oven";
  const mealsPerDay = (profile.meals_per_day as number) ?? 3;

  return `Generate a complete personalized daily meal plan for this person:

Name: ${profile.full_name ?? "User"}
Age: ${profile.age} | Sex: ${profile.sex}
Height: ${profile.height_cm}cm | Current Weight: ${profile.weight_kg}kg | Goal Weight: ${profile.goal_weight_kg}kg
Primary Goal: ${profile.primary_goal}
Activity Level: ${profile.activity_level}
Timeline to results: ${profile.timeline}
Diet Type: ${dietTypes}
Food Allergies: ${allergies}
Foods they DISLIKE (never include): ${profile.disliked_foods || "None"}
Foods they LOVE (prioritize): ${profile.loved_foods || "None"}
Meals per day: ${mealsPerDay}
Meal Preps: ${profile.meal_prep}
Weekly grocery budget: $${profile.weekly_budget}
Cooking skill: ${profile.cooking_skill}
Max cook time per meal: ${profile.cook_time}
Available appliances: ${appliances}
Location: ${profile.location_city ?? ""}, ${profile.location_state ?? ""}

IMPORTANT VARIETY RULES:
- Today's date is ${date} — use this to seed variety
- NEVER repeat the same protein two meals in a row
- Rotate proteins across the week: if beef was used yesterday, use fish, turkey, or eggs today
- Vary cooking methods: if breakfast is pan-fried, lunch should be baked or grilled
- Include at least one vegetable-forward meal per day
- Breakfast should NOT always be eggs/beef — rotate between: oatmeal, smoothies, yogurt parfait, avocado toast, breakfast burritos, protein pancakes
- Lunch and dinner should feel completely different from each other
- Make meals feel exciting and restaurant-quality, not repetitive meal prep
- The date ${date} should influence the meal selection — Monday feels different from Friday

Generate exactly ${mealsPerDay} meals. Return ONLY this JSON structure with no extra text:

{
  "meals": [
    {
      "type": "Breakfast",
      "name": "Full meal name",
      "description": "Appetizing 1-2 sentence description of the meal",
      "ingredients": [
        { "item": "Chicken breast", "amount": "6 oz", "calories": 185, "protein": 35, "carbs": 0, "fat": 4 },
        { "item": "Brown rice", "amount": "1/2 cup dry", "calories": 170, "protein": 4, "carbs": 36, "fat": 1 }
      ],
      "prep_time": "10 min",
      "cook_time": "20 min",
      "total_time": "30 min",
      "servings": 1,
      "difficulty": "Easy",
      "calories": 450,
      "protein": 42,
      "carbs": 38,
      "fat": 12,
      "fiber": 4,
      "sugar": 3,
      "sodium": 480,
      "instructions": [
        "Step 1: Detailed first instruction.",
        "Step 2: Detailed second instruction.",
        "Step 3: Continue until done."
      ],
      "meal_prep_tips": "Optional tip for prepping this meal in advance.",
      "estimated_cost": "$3.50"
    }
  ],
  "macros": {
    "total_calories": 2100,
    "total_protein": 165,
    "total_carbs": 210,
    "total_fat": 70,
    "total_fiber": 28,
    "total_sugar": 45,
    "water_oz": 80,
    "calorie_breakdown": {
      "protein_pct": 32,
      "carbs_pct": 40,
      "fat_pct": 28
    },
    "estimated_daily_cost": "$12.50",
    "nutrition_tip": "Personalized tip based on their specific goal and profile",
    "grocery_list": ["item 1", "item 2", "item 3"]
  }
}`;
}

export async function POST(request: Request) {
  console.log("API KEY LOADED:", process.env.ANTHROPIC_API_KEY?.slice(0, 15));
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const today = new Date();
    const date: string =
      body.date ?? new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    const force: boolean = body.force === true;

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found. Complete onboarding first." }, { status: 404 });
    }

    // Return existing plan if not forcing regeneration
    if (!force) {
      const { data: existing } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("plan_date", date)
        .single();

      if (existing) {
        return NextResponse.json(existing);
      }
    }

    // Call Anthropic API
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log("KEY AT REQUEST TIME:", apiKey?.slice(0, 20));

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildUserPrompt(profile, date) }],
      }),
    });

    console.log("Anthropic response status:", anthropicRes.status);

    const errText = await anthropicRes.text();

    if (!anthropicRes.ok) {
      console.error("Anthropic API error:", errText);
      return NextResponse.json(
        { error: "AI generation failed. Please try again." },
        { status: 500 }
      );
    }

    const aiData = JSON.parse(errText);
    const rawText: string = aiData.content?.[0]?.text ?? "";

    let planJson: { meals: unknown[]; macros: unknown };
    try {
      // Strip any accidental markdown code fences just in case
      const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      planJson = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawText.slice(0, 500));
      return NextResponse.json(
        { error: "AI returned invalid data. Please try again." },
        { status: 500 }
      );
    }

    // Upsert into meal_plans
    const { data: savedPlan, error: saveError } = await supabase
      .from("meal_plans")
      .upsert(
        {
          user_id: user.id,
          plan_date: date,
          meals: planJson.meals,
          macros: planJson.macros,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,plan_date" }
      )
      .select()
      .single();

    if (saveError) {
      console.error("Supabase upsert error:", saveError);
      return NextResponse.json({ error: "Failed to save meal plan." }, { status: 500 });
    }

    return NextResponse.json(savedPlan);
  } catch (err) {
    console.error("Unexpected error in generate-meal-plan:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
