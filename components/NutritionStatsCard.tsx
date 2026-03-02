"use client";

import { useEffect, useState } from "react";

interface HistoryEntry {
  plan_date: string;
  macros: {
    total_calories: number;
    total_protein: number;
    total_carbs: number;
    total_fat: number;
  };
}

const SHORT_DAYS = ["M", "T", "W", "T", "F", "S", "S"];

function getLast7Dates(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });
}

export default function NutritionStatsCard() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meal-history")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const last7Dates = getLast7Dates();
  const dataMap = new Map(history.map((h) => [h.plan_date, h.macros]));

  // Week 1 = last 7 days, Week 2 = 7–14 days ago (for trend)
  const week1 = last7Dates
    .map((d) => dataMap.get(d))
    .filter(Boolean) as HistoryEntry["macros"][];

  const week2Dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split("T")[0];
  });
  const week2 = week2Dates
    .map((d) => dataMap.get(d))
    .filter(Boolean) as HistoryEntry["macros"][];

  function avg(arr: HistoryEntry["macros"][], key: keyof HistoryEntry["macros"]): number {
    if (!arr.length) return 0;
    return Math.round(arr.reduce((s, m) => s + (m[key] as number), 0) / arr.length);
  }

  const avgs = {
    calories: avg(week1, "total_calories"),
    protein:  avg(week1, "total_protein"),
    carbs:    avg(week1, "total_carbs"),
    fat:      avg(week1, "total_fat"),
  };

  const prev = {
    calories: avg(week2, "total_calories"),
    protein:  avg(week2, "total_protein"),
    carbs:    avg(week2, "total_carbs"),
    fat:      avg(week2, "total_fat"),
  };

  // Daily calorie bars for last 7 days
  const dailyCalories = last7Dates.map((d) => dataMap.get(d)?.total_calories ?? 0);
  const maxCal = Math.max(...dailyCalories, 1);

  function trend(curr: number, prev: number): { dir: "up" | "down" | "same"; pct: number } {
    if (!prev || !curr) return { dir: "same", pct: 0 };
    const pct = Math.round(((curr - prev) / prev) * 100);
    return { dir: pct > 1 ? "up" : pct < -1 ? "down" : "same", pct: Math.abs(pct) };
  }

  const hasTrend = week2.length >= 1;
  const hasData = week1.length >= 2;

  return (
    <div className="rounded-2xl border border-bw-border bg-bw-card p-6">
      <h2 className="text-lg font-bold mb-4">7-Day Averages</h2>

      {loading ? (
        <div className="flex items-center justify-center py-8"><Spinner /></div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
          <span className="text-3xl">📊</span>
          <p className="text-sm text-bw-muted">
            Keep generating meal plans to see your nutrition trends
          </p>
        </div>
      ) : (
        <>
          {/* 2x2 stat grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <StatBox
              label="Avg Calories"
              value={avgs.calories}
              unit="cal"
              color="text-bw-purple"
              bg="bg-bw-purple/10"
              trend={hasTrend ? trend(avgs.calories, prev.calories) : undefined}
            />
            <StatBox
              label="Avg Protein"
              value={avgs.protein}
              unit="g"
              color="text-bw-blue"
              bg="bg-bw-blue/10"
              trend={hasTrend ? trend(avgs.protein, prev.protein) : undefined}
            />
            <StatBox
              label="Avg Carbs"
              value={avgs.carbs}
              unit="g"
              color="text-emerald-400"
              bg="bg-emerald-500/10"
              trend={hasTrend ? trend(avgs.carbs, prev.carbs) : undefined}
            />
            <StatBox
              label="Avg Fat"
              value={avgs.fat}
              unit="g"
              color="text-orange-400"
              bg="bg-orange-500/10"
              trend={hasTrend ? trend(avgs.fat, prev.fat) : undefined}
            />
          </div>

          {/* CSS bar chart */}
          <div>
            <p className="text-xs text-bw-muted font-medium mb-2">Daily Calories (last 7 days)</p>
            <div className="flex items-end gap-1.5 h-20">
              {dailyCalories.map((cal, i) => (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className="w-full flex items-end justify-center" style={{ height: "60px" }}>
                    <div
                      className="w-full rounded-t bg-bw-purple/60 transition-all duration-500 min-h-0"
                      style={{ height: cal > 0 ? `${Math.round((cal / maxCal) * 60)}px` : "2px", opacity: cal > 0 ? 1 : 0.2 }}
                    />
                  </div>
                  <span className="text-xs text-bw-muted">{SHORT_DAYS[i]}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatBox({
  label, value, unit, color, bg, trend,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  bg: string;
  trend?: { dir: "up" | "down" | "same"; pct: number };
}) {
  return (
    <div className={`rounded-xl border border-bw-border ${bg} p-3`}>
      <p className="text-xs text-bw-muted mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>
        {value}<span className="text-sm font-normal ml-0.5">{unit}</span>
      </p>
      {trend && trend.dir !== "same" && (
        <p className={`text-xs mt-0.5 ${trend.dir === "up" ? "text-emerald-400" : "text-red-400"}`}>
          {trend.dir === "up" ? "↑" : "↓"} {trend.pct}% vs prev week
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-bw-muted" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
