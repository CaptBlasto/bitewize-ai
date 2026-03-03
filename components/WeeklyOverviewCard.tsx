"use client";

import { useEffect, useState } from "react";

interface HistoryEntry {
  plan_date: string;
  macros: { total_calories: number };
}

function localDateStr(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
}

function getWeekDates(): string[] {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  // Start from Monday
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return localDateStr(d);
  });
}

function calcStreak(savedSet: Set<string>): number {
  const d = new Date();
  let streak = 0;
  while (savedSet.has(localDateStr(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

const SHORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function WeeklyOverviewCard({ refreshKey }: { refreshKey?: number }) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const today = localDateStr(new Date());
  const weekDates = getWeekDates();

  function fetchHistory() {
    setLoading(true);
    fetch("/api/meal-history")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHistory(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchHistory();
  }, [refreshKey]);

  const savedSet = new Set(history.map((h) => h.plan_date));
  const planned = weekDates.filter((d) => savedSet.has(d)).length;
  const streak = calcStreak(savedSet);
  const pct = Math.round((planned / 7) * 100);

  return (
    <div className="rounded-2xl border border-bw-border bg-bw-card p-6">
      <h2 className="text-lg font-bold mb-4">This Week</h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Day pills */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekDates.map((date, i) => {
              const hasPlan = savedSet.has(date);
              const isToday = date === today;
              return (
                <div key={`${date}-${i}`} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-bw-muted">{SHORT_DAYS[i]}</span>
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition
                      ${isToday ? "ring-2 ring-bw-purple" : ""}
                      ${hasPlan
                        ? "bg-emerald-500 text-white"
                        : "border border-bw-border text-bw-muted bg-bw-bg"
                      }
                    `}
                  >
                    {hasPlan ? "✓" : new Date(date + "T00:00:00").getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-bw-muted">
              <span className="font-bold text-bw-text">{planned}</span>/7 days planned
            </span>
            {streak > 0 && (
              <span className="text-sm font-semibold">
                🔥 {streak} day{streak !== 1 ? "s" : ""} streak
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div className="h-2 w-full rounded-full bg-bw-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-bw-purple to-bw-blue transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-xs text-bw-muted mt-1.5 text-right">{pct}% complete</p>

          {planned === 0 && (
            <p className="mt-4 text-center text-xs text-bw-muted">
              Generate your first meal plan to start tracking 📅
            </p>
          )}
        </>
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
