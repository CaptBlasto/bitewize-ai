/*
 * Run this SQL in your Supabase dashboard (SQL Editor) before using this page:
 *
 * create table public.user_profiles (
 *   id uuid references auth.users(id) on delete cascade primary key,
 *   full_name text,
 *   age int,
 *   sex text,
 *   height_cm numeric,
 *   weight_kg numeric,
 *   goal_weight_kg numeric,
 *   primary_goal text,
 *   activity_level text,
 *   timeline text,
 *   diet_types text[],
 *   allergies text[],
 *   disliked_foods text,
 *   loved_foods text,
 *   meals_per_day int,
 *   meal_prep text,
 *   weekly_budget int,
 *   cooking_skill text,
 *   cook_time text,
 *   appliances text[],
 *   location_city text,
 *   location_state text,
 *   plan text default 'free',
 *   onboarding_complete boolean default false,
 *   created_at timestamp with time zone default now()
 * );
 *
 * alter table public.user_profiles enable row level security;
 *
 * create policy "Users can view own profile" on public.user_profiles
 *   for select using (auth.uid() = id);
 *
 * create policy "Users can insert own profile" on public.user_profiles
 *   for insert with check (auth.uid() = id);
 *
 * create policy "Users can update own profile" on public.user_profiles
 *   for update using (auth.uid() = id);
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  fullName: string;
  age: string;
  sex: string;
  heightUnit: "imperial" | "metric";
  heightFt: string;
  heightIn: string;
  heightCm: string;
  weightUnit: "imperial" | "metric";
  weightLbs: string;
  weightKg: string;
  goalWeightLbs: string;
  goalWeightKg: string;
  // Step 2
  primaryGoal: string;
  activityLevel: string;
  timeline: string;
  // Step 3
  dietTypes: string[];
  allergies: string[];
  dislikedFoods: string;
  lovedFoods: string;
  mealsPerDay: string;
  mealPrep: string;
  // Step 4
  weeklyBudget: number;
  cookingSkill: string;
  cookTime: string;
  appliances: string[];
  locationCity: string;
  locationState: string;
}

const INITIAL: FormData = {
  fullName: "",
  age: "",
  sex: "",
  heightUnit: "imperial",
  heightFt: "",
  heightIn: "",
  heightCm: "",
  weightUnit: "imperial",
  weightLbs: "",
  weightKg: "",
  goalWeightLbs: "",
  goalWeightKg: "",
  primaryGoal: "",
  activityLevel: "",
  timeline: "",
  dietTypes: [],
  allergies: [],
  dislikedFoods: "",
  lovedFoods: "",
  mealsPerDay: "",
  mealPrep: "",
  weeklyBudget: 100,
  cookingSkill: "",
  cookTime: "",
  appliances: [],
  locationCity: "",
  locationState: "",
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function QuestionnairePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(true);

  function setField<K extends keyof FormData>(key: K, val: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function toggleItem<K extends "dietTypes" | "allergies" | "appliances">(
    key: K,
    item: string
  ) {
    const arr = form[key] as string[];
    setField(
      key,
      (arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]) as FormData[K]
    );
  }

  async function animateTo(newStep: number) {
    setVisible(false);
    await new Promise((r) => setTimeout(r, 180));
    setStep(newStep);
    setError(null);
    setVisible(true);
  }

  function validate(): string | null {
    if (step === 1) {
      if (!form.fullName.trim()) return "Please enter your full name.";
      const age = Number(form.age);
      if (!form.age || age < 13 || age > 120) return "Please enter a valid age (13–120).";
      if (!form.sex) return "Please select a biological sex.";
      if (form.heightUnit === "imperial" && (!form.heightFt || !form.heightIn))
        return "Please enter your height.";
      if (form.heightUnit === "metric" && !form.heightCm)
        return "Please enter your height.";
      if (form.weightUnit === "imperial" && !form.weightLbs)
        return "Please enter your current weight.";
      if (form.weightUnit === "metric" && !form.weightKg)
        return "Please enter your current weight.";
      if (form.weightUnit === "imperial" && !form.goalWeightLbs)
        return "Please enter your goal weight.";
      if (form.weightUnit === "metric" && !form.goalWeightKg)
        return "Please enter your goal weight.";
    }
    if (step === 2) {
      if (!form.primaryGoal) return "Please select a primary goal.";
      if (!form.activityLevel) return "Please select your activity level.";
      if (!form.timeline) return "Please select a timeline.";
    }
    if (step === 3) {
      if (form.dietTypes.length === 0) return "Please select at least one diet type.";
      if (!form.mealsPerDay) return "Please select how many meals per day.";
      if (!form.mealPrep) return "Please answer the meal prep question.";
    }
    if (step === 4) {
      if (!form.cookingSkill) return "Please select your cooking skill level.";
      if (!form.cookTime) return "Please select how much time you have to cook.";
    }
    return null;
  }

  async function handleNext() {
    const err = validate();
    if (err) { setError(err); return; }
    await animateTo(step + 1);
  }

  async function handleBack() {
    await animateTo(step - 1);
  }

  async function handleSubmit() {
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const plan = localStorage.getItem("bw_selected_plan") ?? "free";

    // Convert height to cm
    const heightCm =
      form.heightUnit === "imperial"
        ? (Number(form.heightFt) * 12 + Number(form.heightIn)) * 2.54
        : Number(form.heightCm);

    // Convert weight to kg
    const toKg = (lbs: string) => Number(lbs) * 0.453592;
    const weightKg =
      form.weightUnit === "imperial" ? toKg(form.weightLbs) : Number(form.weightKg);
    const goalWeightKg =
      form.weightUnit === "imperial" ? toKg(form.goalWeightLbs) : Number(form.goalWeightKg);

    const { error: dbError } = await supabase.from("user_profiles").upsert({
      id: user.id,
      full_name: form.fullName.trim(),
      age: Number(form.age),
      sex: form.sex,
      height_cm: Math.round(heightCm * 10) / 10,
      weight_kg: Math.round(weightKg * 10) / 10,
      goal_weight_kg: Math.round(goalWeightKg * 10) / 10,
      primary_goal: form.primaryGoal,
      activity_level: form.activityLevel,
      timeline: form.timeline,
      diet_types: form.dietTypes,
      allergies: form.allergies,
      disliked_foods: form.dislikedFoods,
      loved_foods: form.lovedFoods,
      meals_per_day: Number(form.mealsPerDay),
      meal_prep: form.mealPrep,
      weekly_budget: form.weeklyBudget,
      cooking_skill: form.cookingSkill,
      cook_time: form.cookTime,
      appliances: form.appliances,
      location_city: form.locationCity,
      location_state: form.locationState,
      plan,
      onboarding_complete: true,
    });

    setLoading(false);

    if (dbError) {
      setError("Failed to save your profile. Please try again.");
      return;
    }

    localStorage.removeItem("bw_selected_plan");
    router.push("/dashboard");
    router.refresh();
  }

  const STEP_LABELS = ["Basic Info", "Health Goals", "Diet & Preferences", "Lifestyle & Budget"];

  return (
    <div className="min-h-screen bg-bw-bg text-bw-text flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl">

        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent">
            Bitewize
          </span>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-bw-muted mb-2">
            <span>Step {step} of 4 — {STEP_LABELS[step - 1]}</span>
            <span>{Math.round((step / 4) * 100)}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-bw-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-bw-purple to-bw-blue transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step card */}
        <div
          className="rounded-2xl border border-bw-border bg-bw-card p-8 transition-all duration-200"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
          }}
        >
          {error && (
            <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {step === 1 && <Step1 form={form} setField={setField} />}
          {step === 2 && <Step2 form={form} setField={setField} />}
          {step === 3 && <Step3 form={form} setField={setField} toggleItem={toggleItem} />}
          {step === 4 && <Step4 form={form} setField={setField} toggleItem={toggleItem} />}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="flex-1 rounded-xl border border-bw-border bg-bw-bg py-3 font-medium text-bw-muted hover:text-bw-text transition"
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                onClick={handleNext}
                className="flex-1 rounded-xl bg-gradient-to-r from-bw-purple to-bw-blue py-3 font-semibold text-white hover:opacity-90 transition"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 rounded-xl bg-gradient-to-r from-bw-purple to-bw-blue py-3 font-semibold text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading ? <><Spinner /> Saving…</> : "Finish"}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Step 1: Basic Info ───────────────────────────────────────────────────────

function Step1({
  form,
  setField,
}: {
  form: FormData;
  setField: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold">Tell us about yourself</h2>

      {/* Full Name */}
      <Field label="Full Name">
        <input
          type="text"
          value={form.fullName}
          onChange={(e) => setField("fullName", e.target.value)}
          placeholder="Jane Doe"
          className={inputCls}
        />
      </Field>

      {/* Age */}
      <Field label="Age">
        <input
          type="number"
          value={form.age}
          onChange={(e) => setField("age", e.target.value)}
          placeholder="25"
          min={13}
          max={120}
          className={inputCls}
        />
      </Field>

      {/* Biological Sex */}
      <Field label="Biological Sex">
        <div className="flex gap-3">
          {["Male", "Female", "Prefer not to say"].map((s) => (
            <OptionChip
              key={s}
              label={s}
              selected={form.sex === s}
              onClick={() => setField("sex", s)}
            />
          ))}
        </div>
      </Field>

      {/* Height */}
      <Field label="Height">
        <UnitToggle
          unit={form.heightUnit}
          onToggle={(u) => setField("heightUnit", u as "imperial" | "metric")}
          options={["imperial", "metric"]}
          labels={["ft / in", "cm"]}
        />
        {form.heightUnit === "imperial" ? (
          <div className="flex gap-3 mt-2">
            <input
              type="number"
              value={form.heightFt}
              onChange={(e) => setField("heightFt", e.target.value)}
              placeholder="5"
              min={1}
              max={8}
              className={`${inputCls} flex-1`}
            />
            <span className="self-center text-bw-muted text-sm">ft</span>
            <input
              type="number"
              value={form.heightIn}
              onChange={(e) => setField("heightIn", e.target.value)}
              placeholder="8"
              min={0}
              max={11}
              className={`${inputCls} flex-1`}
            />
            <span className="self-center text-bw-muted text-sm">in</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="number"
              value={form.heightCm}
              onChange={(e) => setField("heightCm", e.target.value)}
              placeholder="172"
              className={`${inputCls} flex-1`}
            />
            <span className="text-bw-muted text-sm">cm</span>
          </div>
        )}
      </Field>

      {/* Weight */}
      <Field label="Current Weight">
        <UnitToggle
          unit={form.weightUnit}
          onToggle={(u) => setField("weightUnit", u as "imperial" | "metric")}
          options={["imperial", "metric"]}
          labels={["lbs", "kg"]}
        />
        <div className="flex items-center gap-2 mt-2">
          <input
            type="number"
            value={form.weightUnit === "imperial" ? form.weightLbs : form.weightKg}
            onChange={(e) =>
              setField(form.weightUnit === "imperial" ? "weightLbs" : "weightKg", e.target.value)
            }
            placeholder={form.weightUnit === "imperial" ? "160" : "72"}
            className={`${inputCls} flex-1`}
          />
          <span className="text-bw-muted text-sm">{form.weightUnit === "imperial" ? "lbs" : "kg"}</span>
        </div>
      </Field>

      {/* Goal Weight */}
      <Field label="Goal Weight">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={form.weightUnit === "imperial" ? form.goalWeightLbs : form.goalWeightKg}
            onChange={(e) =>
              setField(
                form.weightUnit === "imperial" ? "goalWeightLbs" : "goalWeightKg",
                e.target.value
              )
            }
            placeholder={form.weightUnit === "imperial" ? "140" : "64"}
            className={`${inputCls} flex-1`}
          />
          <span className="text-bw-muted text-sm">{form.weightUnit === "imperial" ? "lbs" : "kg"}</span>
        </div>
      </Field>
    </div>
  );
}

// ─── Step 2: Health Goals ─────────────────────────────────────────────────────

function Step2({
  form,
  setField,
}: {
  form: FormData;
  setField: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  const goals = [
    "Lose weight",
    "Build muscle",
    "Maintain weight",
    "Improve energy",
    "Eat healthier",
    "Manage a health condition",
  ];

  const activityLevels = [
    { label: "Sedentary", desc: "Desk job, little exercise" },
    { label: "Lightly active", desc: "1–3x/week exercise" },
    { label: "Moderately active", desc: "3–5x/week" },
    { label: "Very active", desc: "6–7x/week" },
    { label: "Athlete", desc: "2x/day training" },
  ];

  const timelines = ["Slow & steady", "Moderate", "Aggressive"];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Your health goals</h2>

      <Field label="Primary Goal">
        <div className="grid grid-cols-2 gap-2">
          {goals.map((g) => (
            <OptionChip
              key={g}
              label={g}
              selected={form.primaryGoal === g}
              onClick={() => setField("primaryGoal", g)}
            />
          ))}
        </div>
      </Field>

      <Field label="Activity Level">
        <div className="flex flex-col gap-2">
          {activityLevels.map(({ label, desc }) => (
            <button
              key={label}
              onClick={() => setField("activityLevel", label)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                form.activityLevel === label
                  ? "border-bw-purple bg-bw-purple/10 text-bw-text"
                  : "border-bw-border bg-bw-bg text-bw-muted hover:border-bw-purple/40"
              }`}
            >
              <span className="font-medium text-sm">{label}</span>
              <span className="text-xs text-bw-muted">{desc}</span>
            </button>
          ))}
        </div>
      </Field>

      <Field label="How fast do you want results?">
        <div className="flex gap-3">
          {timelines.map((t) => (
            <OptionChip
              key={t}
              label={t}
              selected={form.timeline === t}
              onClick={() => setField("timeline", t)}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}

// ─── Step 3: Dietary Preferences ─────────────────────────────────────────────

function Step3({
  form,
  setField,
  toggleItem,
}: {
  form: FormData;
  setField: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  toggleItem: <K extends "dietTypes" | "allergies" | "appliances">(k: K, item: string) => void;
}) {
  const diets = [
    "Standard", "Vegetarian", "Vegan", "Keto", "Paleo",
    "Mediterranean", "Gluten-Free", "Dairy-Free", "Halal", "Kosher",
  ];

  const allergyOptions = [
    "None", "Nuts", "Shellfish", "Eggs", "Soy", "Wheat", "Fish", "Dairy",
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Diet & preferences</h2>

      <Field label="Diet Type (select all that apply)">
        <div className="flex flex-wrap gap-2">
          {diets.map((d) => (
            <Chip
              key={d}
              label={d}
              selected={form.dietTypes.includes(d)}
              onClick={() => toggleItem("dietTypes", d)}
            />
          ))}
        </div>
      </Field>

      <Field label="Food Allergies">
        <div className="flex flex-wrap gap-2">
          {allergyOptions.map((a) => (
            <Chip
              key={a}
              label={a}
              selected={form.allergies.includes(a)}
              onClick={() => toggleItem("allergies", a)}
            />
          ))}
        </div>
      </Field>

      <Field label="Foods you dislike (comma separated)">
        <input
          type="text"
          value={form.dislikedFoods}
          onChange={(e) => setField("dislikedFoods", e.target.value)}
          placeholder="e.g. cilantro, olives, mushrooms"
          className={inputCls}
        />
      </Field>

      <Field label="Foods you love (comma separated)">
        <input
          type="text"
          value={form.lovedFoods}
          onChange={(e) => setField("lovedFoods", e.target.value)}
          placeholder="e.g. chicken, rice, broccoli"
          className={inputCls}
        />
      </Field>

      <Field label="Meals per day">
        <div className="flex gap-2">
          {["2", "3", "4", "5+"].map((n) => (
            <OptionChip
              key={n}
              label={n}
              selected={form.mealsPerDay === n}
              onClick={() => setField("mealsPerDay", n)}
            />
          ))}
        </div>
      </Field>

      <Field label="Do you meal prep?">
        <div className="flex gap-2">
          {["Yes", "No", "Sometimes"].map((o) => (
            <OptionChip
              key={o}
              label={o}
              selected={form.mealPrep === o}
              onClick={() => setField("mealPrep", o)}
            />
          ))}
        </div>
      </Field>
    </div>
  );
}

// ─── Step 4: Lifestyle & Budget ───────────────────────────────────────────────

function Step4({
  form,
  setField,
  toggleItem,
}: {
  form: FormData;
  setField: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  toggleItem: <K extends "dietTypes" | "allergies" | "appliances">(k: K, item: string) => void;
}) {
  const cookTimes = ["<15 min", "15–30 min", "30–60 min", "60+ min"];
  const applianceOptions = [
    "Oven", "Stovetop", "Microwave", "Air Fryer", "Instant Pot", "Blender",
  ];

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-xl font-bold">Lifestyle & budget</h2>

      {/* Budget slider */}
      <Field label={`Weekly Grocery Budget — $${form.weeklyBudget}`}>
        <input
          type="range"
          min={25}
          max={300}
          step={5}
          value={form.weeklyBudget}
          onChange={(e) => setField("weeklyBudget", Number(e.target.value))}
          className="w-full accent-bw-purple cursor-pointer"
        />
        <div className="flex justify-between text-xs text-bw-muted mt-1">
          <span>$25</span>
          <span>$300</span>
        </div>
      </Field>

      {/* Cooking skill */}
      <Field label="Cooking Skill Level">
        <div className="flex gap-2">
          {["Beginner", "Intermediate", "Chef-level"].map((s) => (
            <OptionChip
              key={s}
              label={s}
              selected={form.cookingSkill === s}
              onClick={() => setField("cookingSkill", s)}
            />
          ))}
        </div>
      </Field>

      {/* Cook time */}
      <Field label="Time to cook per meal">
        <div className="flex flex-wrap gap-2">
          {cookTimes.map((t) => (
            <OptionChip
              key={t}
              label={t}
              selected={form.cookTime === t}
              onClick={() => setField("cookTime", t)}
            />
          ))}
        </div>
      </Field>

      {/* Appliances */}
      <Field label="Available appliances">
        <div className="flex flex-wrap gap-2">
          {applianceOptions.map((a) => (
            <Chip
              key={a}
              label={a}
              selected={form.appliances.includes(a)}
              onClick={() => toggleItem("appliances", a)}
            />
          ))}
        </div>
      </Field>

      {/* Location */}
      <Field label="Location (for store price comparisons)">
        <div className="flex gap-3">
          <input
            type="text"
            value={form.locationCity}
            onChange={(e) => setField("locationCity", e.target.value)}
            placeholder="City"
            className={`${inputCls} flex-1`}
          />
          <input
            type="text"
            value={form.locationState}
            onChange={(e) => setField("locationState", e.target.value)}
            placeholder="State"
            maxLength={2}
            className={`${inputCls} w-20`}
          />
        </div>
      </Field>
    </div>
  );
}

// ─── Shared UI Components ─────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl bg-bw-bg border border-bw-border px-4 py-3 text-bw-text placeholder:text-bw-muted focus:outline-none focus:ring-2 focus:ring-bw-purple transition text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-bw-muted">{label}</label>
      {children}
    </div>
  );
}

function OptionChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition flex-1 min-w-fit ${
        selected
          ? "border-bw-purple bg-bw-purple/15 text-bw-text"
          : "border-bw-border bg-bw-bg text-bw-muted hover:border-bw-purple/40"
      }`}
    >
      {label}
    </button>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
        selected
          ? "border-bw-purple bg-gradient-to-r from-bw-purple/20 to-bw-blue/10 text-bw-text"
          : "border-bw-border bg-bw-bg text-bw-muted hover:border-bw-purple/40"
      }`}
    >
      {label}
    </button>
  );
}

function UnitToggle({
  unit,
  onToggle,
  options,
  labels,
}: {
  unit: string;
  onToggle: (u: string) => void;
  options: string[];
  labels: string[];
}) {
  return (
    <div className="inline-flex rounded-lg border border-bw-border overflow-hidden text-xs">
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`px-3 py-1.5 font-medium transition ${
            unit === opt
              ? "bg-bw-purple text-white"
              : "bg-bw-bg text-bw-muted hover:text-bw-text"
          }`}
        >
          {labels[i]}
        </button>
      ))}
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
