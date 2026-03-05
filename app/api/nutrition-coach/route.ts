import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface AdditionalFoods {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function buildSystemPrompt(
  mealPlan: Record<string, unknown>,
  userProfile: Record<string, unknown>,
  additionalFoods?: AdditionalFoods | null
): string {
  const macros = (mealPlan.macros as Record<string, unknown>) ?? {};
  const meals = Array.isArray(mealPlan.meals)
    ? (mealPlan.meals as Record<string, unknown>[])
    : [];

  const mealSummary = meals
    .map((m, i) => {
      return `${i + 1}. ${m.type ?? "Meal"}: ${m.name ?? "Unknown"} — ${m.calories ?? 0} cal (P: ${m.protein ?? 0}g, C: ${m.carbs ?? 0}g, F: ${m.fat ?? 0}g)`;
    })
    .join("\n");

  return `You are BiteWize AI, a personalized nutrition coach. Help users understand and optimize their meal plan.

USER PROFILE:
- Goal: ${userProfile.primary_goal ?? userProfile.goal ?? "Not specified"}
- Level: ${userProfile.level ?? 1}
- Current Streak: ${userProfile.streak ?? 0} days

TODAY'S MEAL PLAN:
${mealSummary || "No meals available"}

DAILY TOTALS:
- Calories: ${macros.total_calories ?? 0} kcal
- Protein: ${macros.total_protein ?? 0}g
- Carbs: ${macros.total_carbs ?? 0}g
- Fat: ${macros.total_fat ?? 0}g
- Fiber: ${macros.total_fiber ?? 0}g

Be concise, encouraging, and specific to this user's meal plan. Reference their actual meals and goal when relevant. Keep responses under 200 words unless asked for more detail.${
    additionalFoods && (additionalFoods.calories > 0)
      ? `\n\nADDITIONAL FOODS LOGGED TODAY (outside the meal plan):\n- Calories: +${additionalFoods.calories} kcal\n- Protein: +${additionalFoods.protein}g\n- Carbs: +${additionalFoods.carbs}g\n- Fat: +${additionalFoods.fat}g\nFactor these into your advice about whether the user is on track.`
      : ""
  }`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, mealPlan, userProfile, additionalFoods } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages array is required" },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(
      mealPlan ?? {},
      userProfile ?? {},
      additionalFoods ?? null
    );

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages as Anthropic.MessageParam[],
    });

    const reply =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error:", error.status, error.message);
      return NextResponse.json(
        { error: "AI service error. Please try again." },
        { status: 500 }
      );
    }
    console.error("Unexpected error in nutrition-coach:", error);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
