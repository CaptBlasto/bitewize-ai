"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  firstName: string;
  age: string;
  gender: string;
  heightUnit: "imperial" | "metric";
  heightFt: string;
  heightIn: string;
  heightCm: string;
  weightUnit: "lbs" | "kg";
  weight: string;
  goalWeight: string;
  goal: string;
  activityLevel: string;
  dietTypes: string[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdate: () => void;
  userId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const GOALS = ["Weight Loss", "Muscle Gain", "Maintain"];

const ACTIVITY_LEVELS = ["Sedentary", "Light", "Moderate", "Active", "Very Active"];

const DIET_OPTIONS = [
  "None", "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Keto", "Halal",
];

const GENDERS = ["Male", "Female", "Prefer not to say"];

const EMPTY: FormState = {
  firstName: "",
  age: "",
  gender: "",
  heightUnit: "imperial",
  heightFt: "",
  heightIn: "",
  heightCm: "",
  weightUnit: "lbs",
  weight: "",
  goalWeight: "",
  goal: "",
  activityLevel: "",
  dietTypes: [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cmToImperial(cm: number) {
  const totalIn = cm / 2.54;
  return { ft: String(Math.floor(totalIn / 12)), in: String(Math.round(totalIn % 12)) };
}

function kgToLbs(kg: number) {
  return String(Math.round(kg * 2.20462 * 10) / 10);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProfileSettings({ isOpen, onClose, onProfileUpdate, userId }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState(false);

  // Load current profile whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    setError(null);

    async function load() {
      setFetching(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("user_profiles")
        .select(
          "full_name, age, sex, height_cm, weight_kg, goal_weight_kg, primary_goal, activity_level, diet_types"
        )
        .eq("id", userId)
        .single();

      if (data) {
        const hUnit: "imperial" | "metric" = "imperial";
        const wUnit: "lbs" | "kg" = "lbs";
        const imp = data.height_cm ? cmToImperial(data.height_cm) : { ft: "", in: "" };

        setForm({
          firstName: data.full_name?.split(" ")[0] ?? "",
          age: data.age ? String(data.age) : "",
          gender: data.sex ?? "",
          heightUnit: hUnit,
          heightFt: imp.ft,
          heightIn: imp.in,
          heightCm: data.height_cm ? String(Math.round(data.height_cm)) : "",
          weightUnit: wUnit,
          weight: data.weight_kg ? kgToLbs(data.weight_kg) : "",
          goalWeight: data.goal_weight_kg ? kgToLbs(data.goal_weight_kg) : "",
          goal: data.primary_goal ?? "",
          activityLevel: data.activity_level ?? "",
          dietTypes: Array.isArray(data.diet_types) ? data.diet_types : [],
        });
      }
      setFetching(false);
    }

    load();
  }, [isOpen, userId]);

  function set<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function toggleDiet(item: string) {
    setForm((prev) => {
      const has = prev.dietTypes.includes(item);
      // "None" is exclusive
      if (item === "None") return { ...prev, dietTypes: has ? [] : ["None"] };
      const next = has
        ? prev.dietTypes.filter((d) => d !== item)
        : [...prev.dietTypes.filter((d) => d !== "None"), item];
      return { ...prev, dietTypes: next };
    });
  }

  function validate(): string | null {
    const age = Number(form.age);
    if (!form.age || isNaN(age) || age < 13 || age > 100)
      return "Age must be between 13 and 100.";
    const w = Number(form.weight);
    if (!form.weight || isNaN(w) || w <= 0)
      return "Current weight must be a positive number.";
    const gw = Number(form.goalWeight);
    if (!form.goalWeight || isNaN(gw) || gw <= 0)
      return "Target weight must be a positive number.";
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setLoading(true);

    // Convert to storage units (cm, kg)
    const heightCm =
      form.heightUnit === "imperial"
        ? (Number(form.heightFt) * 12 + Number(form.heightIn)) * 2.54
        : Number(form.heightCm);

    const toKg = (val: string) =>
      form.weightUnit === "lbs" ? Number(val) * 0.453592 : Number(val);

    const supabase = createClient();
    const { error: dbErr } = await supabase.from("user_profiles").upsert({
      id: userId,
      full_name: form.firstName.trim(),
      age: Number(form.age),
      sex: form.gender,
      height_cm: heightCm ? Math.round(heightCm * 10) / 10 : null,
      weight_kg: Math.round(toKg(form.weight) * 10) / 10,
      goal_weight_kg: Math.round(toKg(form.goalWeight) * 10) / 10,
      primary_goal: form.goal,
      activity_level: form.activityLevel,
      diet_types: form.dietTypes,
    });

    setLoading(false);

    if (dbErr) {
      setError("Failed to save. Please try again.");
      return;
    }

    // Show toast and notify parent
    setToast(true);
    setTimeout(() => setToast(false), 3000);
    onProfileUpdate();
  }

  function handleClose() {
    setError(null);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Success toast */}
      {toast && (
        <div className="fixed top-5 right-5 z-[70] flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 px-4 py-3 text-sm font-medium text-emerald-400 shadow-lg">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Profile updated ✓
        </div>
      )}

      {/* Overlay */}
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        {/* Modal card */}
        <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-bw-border bg-bw-card shadow-2xl overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between border-b border-bw-border px-6 py-4 shrink-0">
            <div>
              <h2 className="text-base font-semibold text-bw-text">Edit Profile</h2>
              <p className="text-xs text-bw-muted mt-0.5">Changes apply to future meal plan generation</p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-lg p-1.5 text-bw-muted hover:text-bw-text hover:bg-bw-border transition"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-6">
            {fetching ? (
              <div className="flex items-center justify-center py-16 gap-3 text-bw-muted">
                <Spinner className="h-5 w-5" />
                <span className="text-sm">Loading your profile…</span>
              </div>
            ) : (
              <>
                {error && (
                  <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                  {/* First Name */}
                  <Field label="First Name">
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      placeholder="Jane"
                      className={inputCls}
                    />
                  </Field>

                  {/* Age */}
                  <Field label="Age">
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) => set("age", e.target.value)}
                      placeholder="25"
                      min={13}
                      max={100}
                      className={inputCls}
                    />
                  </Field>

                  {/* Gender */}
                  <Field label="Gender">
                    <select
                      value={form.gender}
                      onChange={(e) => set("gender", e.target.value)}
                      className={selectCls}
                    >
                      <option value="" disabled>Select…</option>
                      {GENDERS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </Field>

                  {/* Goal */}
                  <Field label="Primary Goal">
                    <select
                      value={form.goal}
                      onChange={(e) => set("goal", e.target.value)}
                      className={selectCls}
                    >
                      <option value="" disabled>Select…</option>
                      {GOALS.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                      {/* Preserve onboarding values that don't match the 3 options */}
                      {form.goal && !GOALS.includes(form.goal) && (
                        <option value={form.goal}>{form.goal}</option>
                      )}
                    </select>
                  </Field>

                  {/* Activity Level */}
                  <Field label="Activity Level">
                    <select
                      value={form.activityLevel}
                      onChange={(e) => set("activityLevel", e.target.value)}
                      className={selectCls}
                    >
                      <option value="" disabled>Select…</option>
                      {ACTIVITY_LEVELS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                      {form.activityLevel && !ACTIVITY_LEVELS.includes(form.activityLevel) && (
                        <option value={form.activityLevel}>{form.activityLevel}</option>
                      )}
                    </select>
                  </Field>

                  {/* Height */}
                  <Field label="Height">
                    <div className="flex flex-col gap-2">
                      <div className="inline-flex self-start rounded-lg border border-bw-border overflow-hidden text-xs">
                        {(["imperial", "metric"] as const).map((u, i) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => set("heightUnit", u)}
                            className={`px-3 py-1.5 font-medium transition ${
                              form.heightUnit === u
                                ? "bg-bw-purple text-white"
                                : "bg-bw-bg text-bw-muted hover:text-bw-text"
                            }`}
                          >
                            {["ft / in", "cm"][i]}
                          </button>
                        ))}
                      </div>
                      {form.heightUnit === "imperial" ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={form.heightFt}
                            onChange={(e) => set("heightFt", e.target.value)}
                            placeholder="5"
                            min={1} max={8}
                            className={`${inputCls} flex-1`}
                          />
                          <span className="text-bw-muted text-sm shrink-0">ft</span>
                          <input
                            type="number"
                            value={form.heightIn}
                            onChange={(e) => set("heightIn", e.target.value)}
                            placeholder="11"
                            min={0} max={11}
                            className={`${inputCls} flex-1`}
                          />
                          <span className="text-bw-muted text-sm shrink-0">in</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={form.heightCm}
                            onChange={(e) => set("heightCm", e.target.value)}
                            placeholder="180"
                            className={`${inputCls} flex-1`}
                          />
                          <span className="text-bw-muted text-sm shrink-0">cm</span>
                        </div>
                      )}
                    </div>
                  </Field>

                  {/* Current Weight */}
                  <Field label="Current Weight">
                    <div className="flex flex-col gap-2">
                      <div className="inline-flex self-start rounded-lg border border-bw-border overflow-hidden text-xs">
                        {(["lbs", "kg"] as const).map((u) => (
                          <button
                            key={u}
                            type="button"
                            onClick={() => set("weightUnit", u)}
                            className={`px-3 py-1.5 font-medium transition ${
                              form.weightUnit === u
                                ? "bg-bw-purple text-white"
                                : "bg-bw-bg text-bw-muted hover:text-bw-text"
                            }`}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={form.weight}
                          onChange={(e) => set("weight", e.target.value)}
                          placeholder={form.weightUnit === "lbs" ? "160" : "73"}
                          min={0}
                          className={`${inputCls} flex-1`}
                        />
                        <span className="text-bw-muted text-sm shrink-0">{form.weightUnit}</span>
                      </div>
                    </div>
                  </Field>

                  {/* Target Weight */}
                  <Field label="Target Weight">
                    <div className="flex items-center gap-2 mt-7">
                      <input
                        type="number"
                        value={form.goalWeight}
                        onChange={(e) => set("goalWeight", e.target.value)}
                        placeholder={form.weightUnit === "lbs" ? "140" : "64"}
                        min={0}
                        className={`${inputCls} flex-1`}
                      />
                      <span className="text-bw-muted text-sm shrink-0">{form.weightUnit}</span>
                    </div>
                  </Field>

                  {/* Dietary Restrictions — full width */}
                  <div className="sm:col-span-2">
                    <Field label="Dietary Restrictions">
                      <div className="flex flex-wrap gap-2 mt-1">
                        {DIET_OPTIONS.map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => toggleDiet(d)}
                            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                              form.dietTypes.includes(d)
                                ? "border-bw-purple bg-bw-purple/15 text-bw-text"
                                : "border-bw-border bg-bw-bg text-bw-muted hover:border-bw-purple/40"
                            }`}
                          >
                            {form.dietTypes.includes(d) && (
                              <span className="mr-1">✓</span>
                            )}
                            {d}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>

                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 border-t border-bw-border px-6 py-4 shrink-0">
            <button
              onClick={handleClose}
              className="rounded-xl border border-bw-border px-5 py-2.5 text-sm font-medium text-bw-muted hover:text-bw-text hover:border-bw-purple/40 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading || fetching}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-bw-purple to-bw-blue px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading && <Spinner className="h-3.5 w-3.5" />}
              {loading ? "Saving…" : "Save Changes"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl bg-bw-bg border border-bw-border px-4 py-2.5 text-sm text-bw-text placeholder:text-bw-muted focus:outline-none focus:ring-2 focus:ring-bw-purple/50 transition";

const selectCls =
  "w-full rounded-xl bg-bw-bg border border-bw-border px-4 py-2.5 text-sm text-bw-text focus:outline-none focus:ring-2 focus:ring-bw-purple/50 transition appearance-none cursor-pointer";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-bw-muted uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
