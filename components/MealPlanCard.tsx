"use client";

import { useEffect, useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Ingredient {
  item: string;
  amount: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Meal {
  type: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  prep_time: string;
  cook_time: string;
  total_time: string;
  servings: number;
  difficulty: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  instructions: string[];
  meal_prep_tips?: string;
  estimated_cost: string;
}

interface Macros {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_sugar: number;
  water_oz: number;
  calorie_breakdown: { protein_pct: number; carbs_pct: number; fat_pct: number };
  estimated_daily_cost: string;
  nutrition_tip: string;
  grocery_list: string[];
}

interface MealPlan {
  id: string;
  plan_date: string;
  meals: Meal[];
  macros: Macros;
}

interface Props {
  userPlan: string;
  userId: string;
  selectedDate: string;
  onPlanGenerated?: () => void;
}

// ─── Meal type badge config ───────────────────────────────────────────────────

const MEAL_COLORS: Record<string, string> = {
  Breakfast: "bg-bw-purple/20 text-bw-purple",
  Lunch:     "bg-bw-blue/20 text-bw-blue",
  Dinner:    "bg-emerald-500/20 text-emerald-400",
  Snack:     "bg-amber-500/20 text-amber-400",
};

function mealBadgeCls(type: string) {
  return MEAL_COLORS[type] ?? "bg-bw-border text-bw-muted";
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MealPlanCard({ userPlan, selectedDate, onPlanGenerated }: Props) {
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [groceryOpen, setGroceryOpen] = useState(false);

  useEffect(() => {
    fetchPlan(selectedDate);
  }, [selectedDate]);

  async function fetchPlan(date: string) {
    setLoading(true);
    setMealPlan(null);
    setError(null);
    setExpanded(0);
    try {
      const res = await fetch(`/api/meal-history?date=${date}`);
      const data = await res.json();
      setMealPlan(data ?? null);
    } catch {
      setError("Failed to load meal plan.");
    } finally {
      setLoading(false);
    }
  }

  async function generatePlan(force = false) {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-meal-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate, force }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Generation failed");
      }
      const data = await res.json();
      setMealPlan(data);
      setExpanded(0);
      onPlanGenerated?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  const isPro = userPlan === "premium";
  const displayDate = new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });

  return (
    <div className="rounded-2xl border border-bw-border bg-bw-card p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold">Today&apos;s Meal Plan</h2>
          <p className="text-xs text-bw-muted mt-0.5">{displayDate}</p>
        </div>
        {mealPlan && (
          isPro ? (
            <button
              onClick={() => generatePlan(true)}
              disabled={generating}
              className="flex items-center gap-1.5 rounded-xl border border-bw-border px-3 py-1.5 text-xs font-medium text-bw-muted hover:text-bw-text hover:border-bw-purple/40 transition disabled:opacity-50"
            >
              <RefreshIcon />
              Regenerate
            </button>
          ) : (
            <div className="relative group">
              <button className="flex items-center gap-1.5 rounded-xl border border-bw-border px-3 py-1.5 text-xs font-medium text-bw-muted opacity-50 cursor-not-allowed">
                <LockIcon />
                Regenerate
              </button>
              <div className="absolute right-0 top-8 z-10 hidden group-hover:block w-44 rounded-xl border border-bw-border bg-bw-card p-2 text-xs text-bw-muted shadow-lg">
                Upgrade to Pro to regenerate meal plans
              </div>
            </div>
          )
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span>{error}</span>
          <button
            onClick={() => { setError(null); fetchPlan(selectedDate); }}
            className="ml-3 text-xs underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading fetch */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-bw-muted">
          <Spinner className="h-6 w-6" />
          <span className="text-sm">Loading meal plan…</span>
        </div>
      )}

      {/* Generating */}
      {generating && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Spinner className="h-7 w-7 text-bw-purple" />
          <p className="text-sm font-medium text-bw-text">Generating your personalized meal plan with AI…</p>
          <p className="text-xs text-bw-muted">This usually takes 10–20 seconds</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && !generating && !mealPlan && !error && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <div className="text-4xl">🍽️</div>
          <p className="text-bw-muted text-sm">No meal plan for this date.</p>
          <button
            onClick={() => generatePlan(false)}
            className="rounded-xl bg-gradient-to-r from-bw-purple to-bw-blue px-6 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
          >
            Generate Meal Plan
          </button>
        </div>
      )}

      {/* Plan content */}
      {!loading && !generating && mealPlan && (
        <>
          {/* Macro summary pills */}
          <div className="flex flex-wrap gap-2 mb-5">
            <MacroPill icon="🔥" label={`${mealPlan.macros.total_calories} cal`} color="bg-bw-purple/15 text-bw-purple" />
            <MacroPill icon="💪" label={`${mealPlan.macros.total_protein}g protein`} color="bg-bw-blue/15 text-bw-blue" />
            <MacroPill icon="🌾" label={`${mealPlan.macros.total_carbs}g carbs`} color="bg-emerald-500/15 text-emerald-400" />
            <MacroPill icon="🥑" label={`${mealPlan.macros.total_fat}g fat`} color="bg-orange-500/15 text-orange-400" />
            <MacroPill icon="💧" label={`${mealPlan.macros.water_oz}oz water`} color="bg-cyan-500/15 text-cyan-400" />
            <MacroPill icon="💰" label={`~${mealPlan.macros.estimated_daily_cost}/day`} color="bg-bw-border text-bw-muted" />
          </div>

          {/* Meal accordions */}
          <div className="flex flex-col gap-3">
            {mealPlan.meals.map((meal, i) => (
              <MealAccordion
                key={i}
                meal={meal}
                index={i}
                isOpen={expanded === i}
                onToggle={() => setExpanded(expanded === i ? null : i)}
              />
            ))}
          </div>

          {/* Nutrition tip */}
          {mealPlan.macros.nutrition_tip && (
            <div className="mt-5 rounded-xl border-l-4 border-bw-purple bg-bw-purple/5 px-4 py-3">
              <p className="text-xs font-semibold text-bw-purple mb-1">Nutrition Tip</p>
              <p className="text-sm text-bw-muted">{mealPlan.macros.nutrition_tip}</p>
            </div>
          )}

          {/* Grocery List */}
          {mealPlan.macros.grocery_list?.length > 0 && (
            <div className="mt-4">
              <button
                onClick={() => setGroceryOpen(!groceryOpen)}
                className="flex w-full items-center justify-between rounded-xl border border-bw-border bg-bw-bg px-4 py-3 text-sm font-medium text-bw-muted hover:text-bw-text transition"
              >
                <span>🛒 Grocery List ({mealPlan.macros.grocery_list.length} items)</span>
                <ChevronIcon open={groceryOpen} />
              </button>
              <div
                className="overflow-hidden transition-all duration-300"
                style={{ maxHeight: groceryOpen ? "600px" : "0" }}
              >
                <div className="pt-3 grid grid-cols-2 gap-1.5">
                  {mealPlan.macros.grocery_list.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-bw-muted">
                      <span className="h-1 w-1 rounded-full bg-bw-purple flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Meal Accordion ───────────────────────────────────────────────────────────

function MealAccordion({
  meal, index, isOpen, onToggle,
}: {
  meal: Meal; index: number; isOpen: boolean; onToggle: () => void;
}) {
  return (
    <div className="rounded-xl border border-bw-border bg-bw-bg overflow-hidden">
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-bw-border/20 transition"
      >
        <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${mealBadgeCls(meal.type)}`}>
          {meal.type}
        </span>
        <span className="flex-1 font-medium text-sm truncate">{meal.name}</span>
        <span className="text-xs text-bw-muted flex-shrink-0">{meal.calories} cal</span>
        <span className="text-xs text-bw-muted flex-shrink-0">{meal.total_time}</span>
        <ChevronIcon open={isOpen} />
      </button>

      {/* Expanded content */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: isOpen ? "2000px" : "0" }}
      >
        <div className="px-4 pb-4 border-t border-bw-border pt-4">

          {/* Description */}
          <p className="text-sm text-bw-muted italic mb-4">{meal.description}</p>

          {/* Two-column: ingredients + macros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">

            {/* Ingredients */}
            <div>
              <p className="text-xs font-semibold text-bw-muted uppercase tracking-wider mb-2">Ingredients</p>
              <div className="flex flex-col gap-2">
                {meal.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-sm text-bw-text">{ing.item}</span>
                      <span className="text-xs text-bw-muted ml-1">({ing.amount})</span>
                    </div>
                    <span className="text-xs text-bw-muted flex-shrink-0">{ing.calories} cal</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Macro breakdown */}
            <div>
              <p className="text-xs font-semibold text-bw-muted uppercase tracking-wider mb-2">Nutrition</p>
              <div className="grid grid-cols-2 gap-2">
                <MiniStat label="Protein" value={`${meal.protein}g`} color="text-bw-blue" />
                <MiniStat label="Carbs" value={`${meal.carbs}g`} color="text-emerald-400" />
                <MiniStat label="Fat" value={`${meal.fat}g`} color="text-orange-400" />
                <MiniStat label="Fiber" value={`${meal.fiber}g`} color="text-green-400" />
                <MiniStat label="Sugar" value={`${meal.sugar}g`} color="text-yellow-400" />
                <MiniStat label="Sodium" value={`${meal.sodium}mg`} color="text-bw-muted" />
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-4">
            <p className="text-xs font-semibold text-bw-muted uppercase tracking-wider mb-2">Instructions</p>
            <ol className="flex flex-col gap-2">
              {meal.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-shrink-0 h-5 w-5 rounded-full bg-bw-purple/20 text-bw-purple text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-bw-muted">{step.replace(/^Step \d+:\s*/i, "")}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Footer: cost, difficulty, prep tip */}
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-bw-border">
            <span className="text-xs text-bw-muted">💰 {meal.estimated_cost}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              meal.difficulty === "Easy"
                ? "bg-emerald-500/15 text-emerald-400"
                : meal.difficulty === "Medium" || meal.difficulty === "Intermediate"
                ? "bg-amber-500/15 text-amber-400"
                : "bg-red-500/15 text-red-400"
            }`}>
              {meal.difficulty}
            </span>
            {meal.meal_prep_tips && (
              <span className="text-xs text-bw-muted">📦 {meal.meal_prep_tips}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function MacroPill({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      {icon} {label}
    </span>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg bg-bw-card border border-bw-border px-3 py-2">
      <p className="text-xs text-bw-muted">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 flex-shrink-0 text-bw-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none" stroke="currentColor" viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );
}

function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
