import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    // Return full plan for a specific date
    if (date) {
      const { data, error } = await supabase
        .from("meal_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("plan_date", date)
        .single();

      if (error || !data) {
        return NextResponse.json(null);
      }

      return NextResponse.json(data);
    }

    // Return summary of all plans (no meals JSON to keep response small)
    const { data, error } = await supabase
      .from("meal_plans")
      .select("id, plan_date, macros, generated_at")
      .eq("user_id", user.id)
      .order("plan_date", { ascending: false });

    if (error) {
      return NextResponse.json({ error: "Failed to fetch history." }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("Unexpected error in meal-history:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
