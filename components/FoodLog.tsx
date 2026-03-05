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
    setIsSaving(true);

    const supabase = createClient();
    const { data } = await supabase
      .from("food_log")
      .insert({
        user_id: userId,
        date,
        food_name: pendingFood.foodName,
        calories: pendingFood.calories,
        protein: pendingFood.protein,
        carbs: pendingFood.carbs,
        fat: pendingFood.fat,
        serving_size: pendingFood.servingSize,
        meal_type: selectedMeal,
      })
      .select("id, food_name, calories, protein, carbs, fat, meal_type, serving_size")
      .single();

    if (data) {
      updateEntries([...entries, data as FoodEntry]);
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
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-medium text-bw-text">{pendingFood.foodName}</p>
                  <p className="text-xs text-bw-muted mt-0.5">{pendingFood.servingSize}</p>
                </div>
                <div className="flex gap-3 text-xs text-bw-muted">
                  <span>
                    <span className="font-semibold text-bw-text">{pendingFood.calories}</span> cal
                  </span>
                  <span>
                    P <span className="font-semibold text-bw-text">{pendingFood.protein}g</span>
                  </span>
                  <span>
                    C <span className="font-semibold text-bw-text">{pendingFood.carbs}g</span>
                  </span>
                  <span>
                    F <span className="font-semibold text-bw-text">{pendingFood.fat}g</span>
                  </span>
                </div>
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
            </div>
          )}

          {/* Food table */}
          {entries.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-bw-border text-xs text-bw-muted">
                    <th className="pb-2 text-left font-medium">Food</th>
                    <th className="pb-2 text-right font-medium">Cals</th>
                    <th className="pb-2 text-right font-medium">P</th>
                    <th className="pb-2 text-right font-medium">C</th>
                    <th className="pb-2 text-right font-medium">F</th>
                    <th className="pb-2 text-right font-medium">Meal</th>
                    <th className="pb-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-bw-border/50">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="group">
                      <td className="py-2 pr-4 text-bw-text">{entry.food_name}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-bw-muted">
                        {entry.calories}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-bw-muted">
                        {entry.protein}g
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-bw-muted">
                        {entry.carbs}g
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-bw-muted">
                        {entry.fat}g
                      </td>
                      <td className="py-2 pr-3 text-right text-xs text-bw-muted">
                        {entry.meal_type}
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="rounded-lg p-1 text-bw-muted opacity-0 group-hover:opacity-100 hover:text-red-400 hover:bg-red-400/10 transition"
                          aria-label="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Extra totals */}
          {entries.length > 0 && (
            <p className="text-sm font-medium text-amber-400">
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
