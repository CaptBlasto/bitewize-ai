"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { ChevronDown, ChevronUp, Plus, Loader2, Trash2 } from "lucide-react";

export interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface FoodEntry {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  meal_type: string;
  serving_size: string;
}

interface NutritionResult {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

interface Props {
  userId: string;
  date: string;
  onTotalsChange: (extras: MacroTotals) => void;
}

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

function sumEntries(list: FoodEntry[]): MacroTotals {
  return list.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

// Matches MealPlanCard pill style but with bg-white/10 base
function MacroPill({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold ${color}`}>
      {icon} {label}
    </span>
  );
}

function EntryMacros({ calories, protein, carbs, fat }: { calories: number; protein: number; carbs: number; fat: number }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <MacroPill icon="🔥" label={`${calories} cal`} color="text-bw-purple" />
      <MacroPill icon="💪" label={`${protein}g`} color="text-bw-blue" />
      <MacroPill icon="🌾" label={`${carbs}g`} color="text-emerald-400" />
      <MacroPill icon="🥑" label={`${fat}g`} color="text-orange-400" />
    </div>
  );
}

export default function FoodLog({ userId, date, onTotalsChange }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [pendingFood, setPendingFood] = useState<NutritionResult | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<string>("Breakfast");
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEntries() {
      const supabase = createClient();
      const { data } = await supabase
        .from("food_log")
        .select("id, food_name, calories, protein, carbs, fat, meal_type, serving_size")
        .eq("user_id", userId)
        .eq("date", date)
        .order("created_at", { ascending: true });

      const fetched = (data ?? []) as FoodEntry[];
      setEntries(fetched);
      onTotalsChange(sumEntries(fetched));
    }

    fetchEntries();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, date]);

  function updateEntries(updated: FoodEntry[]) {
    setEntries(updated);
    onTotalsChange(sumEntries(updated));
  }

  function resetInput() {
    setShowInput(false);
    setInputValue("");
    setPendingFood(null);
    setLookupError(null);
    setSaveError(null);
  }

  async function handleLookup() {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    setIsLookingUp(true);
    setLookupError(null);
    setPendingFood(null);

    try {
      const res = await fetch("/api/log-food", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foodDescription: trimmed }),
      });
      if (!res.ok) throw new Error("Lookup failed");
      const data: NutritionResult = await res.json();
      setPendingFood(data);
    } catch {
      setLookupError("Couldn't look up that food. Please try again.");
    } finally {
      setIsLookingUp(false);
    }
  }

  async function handleConfirm() {
    if (!pendingFood) return;

    if (!userId) {
      console.warn("FoodLog: userId is null, cannot insert");
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const supabase = createClient();
    const { data, error } = await supabase
      .from("food_log")
      .insert({
        user_id: userId,
        date,
        food_name: pendingFood.foodName,
        calories: pendingFood.calories,
        protein: pendingFood.protein,
        carbs: pendingFood.carbs,
        fat: pendingFood.fat,
        meal_type: selectedMeal.toLowerCase(),
      })
      .select("id, food_name, calories, protein, carbs, fat, meal_type, serving_size")
      .single();

    console.log("Insert result:", { data, error });

    if (error) {
      setSaveError(`Failed to save: ${error.message}`);
      setIsSaving(false);
      return;
    }

    if (data) {
      const updated = [...entries, data as FoodEntry];
      updateEntries(updated);
    }

    setIsSaving(false);
    resetInput();
  }

  async function handleDelete(id: string) {
    const supabase = createClient();
    await supabase.from("food_log").delete().eq("id", id);
    updateEntries(entries.filter((e) => e.id !== id));
  }

  const totals = sumEntries(entries);

  return (
    <div className="rounded-2xl border border-bw-border bg-bw-card overflow-hidden">
      {/* Collapsible header */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-bw-border/30 transition"
      >
        <span className="font-semibold text-bw-text">Today&apos;s Food Log</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-bw-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-bw-muted" />
        )}
      </button>

      {isOpen && (
        <div className="px-5 pb-5 space-y-4">
          {/* Log Food trigger */}
          {!showInput && (
            <button
              onClick={() => setShowInput(true)}
              className="flex items-center gap-1.5 rounded-xl border border-dashed border-bw-border bg-bw-bg px-4 py-2 text-sm text-bw-muted hover:border-bw-purple hover:text-bw-purple transition"
            >
              <Plus className="w-4 h-4" />
              Log Food
            </button>
          )}

          {/* Input row */}
          {showInput && !pendingFood && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLookup()}
                  placeholder="What did you eat?"
                  autoFocus
                  disabled={isLookingUp}
                  className="flex-1 rounded-xl border border-bw-border bg-bw-bg px-3.5 py-2 text-sm text-bw-text placeholder:text-bw-muted focus:outline-none focus:border-bw-purple transition disabled:opacity-50"
                />
                <button
                  onClick={handleLookup}
                  disabled={!inputValue.trim() || isLookingUp}
                  className="rounded-xl bg-bw-purple px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 transition flex items-center gap-1.5"
                >
                  {isLookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Look up"}
                </button>
                <button
                  onClick={resetInput}
                  className="rounded-xl border border-bw-border px-3 py-2 text-sm text-bw-muted hover:text-bw-text transition"
                >
                  Cancel
                </button>
              </div>

              {isLookingUp && (
                <p className="flex items-center gap-2 text-sm text-bw-muted pl-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Looking up nutrition...
                </p>
              )}

              {lookupError && (
                <p className="text-sm text-red-400 pl-1">{lookupError}</p>
              )}
            </div>
          )}

          {/* Confirmation card */}
          {pendingFood && !isLookingUp && (
            <div className="rounded-xl border border-bw-purple/30 bg-bw-purple/5 p-4 space-y-3">
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-bw-text">{pendingFood.foodName}</p>
                  <p className="text-xs text-bw-muted mt-0.5">{pendingFood.servingSize}</p>
                </div>
                <EntryMacros
                  calories={pendingFood.calories}
                  protein={pendingFood.protein}
                  carbs={pendingFood.carbs}
                  fat={pendingFood.fat}
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex gap-1 flex-wrap">
                  {MEAL_TYPES.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMeal(m)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        selectedMeal === m
                          ? "bg-bw-purple text-white"
                          : "border border-bw-border text-bw-muted hover:border-bw-purple hover:text-bw-purple"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex gap-2">
                  <button
                    onClick={resetInput}
                    className="rounded-xl border border-bw-border px-3 py-1.5 text-xs text-bw-muted hover:text-bw-text transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={isSaving}
                    className="rounded-xl bg-bw-purple px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {isSaving ? "Saving..." : "Confirm"}
                  </button>
                </div>
              </div>

              {saveError && (
                <p className="text-xs text-red-400">{saveError}</p>
              )}
            </div>
          )}

          {/* Food log list */}
          {entries.length > 0 && (
            <div className="divide-y divide-bw-border/50">
              {entries.map((entry) => (
                <div key={entry.id} className="group flex items-start justify-between gap-3 py-3">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-bw-text truncate">{entry.food_name}</span>
                      <span className="shrink-0 rounded-full bg-bw-border px-2 py-0.5 text-[10px] font-medium text-bw-muted">
                        {entry.meal_type}
                      </span>
                    </div>
                    <EntryMacros
                      calories={entry.calories}
                      protein={entry.protein}
                      carbs={entry.carbs}
                      fat={entry.fat}
                    />
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="mt-0.5 rounded-lg p-1 text-bw-muted opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition shrink-0"
                    aria-label="Delete entry"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Extra totals */}
          {entries.length > 0 && (
            <p className="text-sm font-medium text-amber-400 pt-1">
              Extra today: +{totals.calories} cal · +{totals.protein}g protein · +{totals.carbs}g carbs · +{totals.fat}g fat
            </p>
          )}

          {/* Empty state */}
          {entries.length === 0 && !showInput && (
            <p className="text-sm text-bw-muted">No foods logged yet today.</p>
          )}
        </div>
      )}
    </div>
  );
}
