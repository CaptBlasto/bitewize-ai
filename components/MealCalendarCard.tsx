"use client";

import { useEffect, useState } from "react";

interface HistoryEntry {
  id: string;
  plan_date: string;
  macros: { total_calories: number };
  generated_at: string;
}

interface Props {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

export default function MealCalendarCard({ selectedDate, onSelectDate }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [savedDates, setSavedDates] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/meal-history")
      .then((r) => r.json())
      .then((data: HistoryEntry[]) => {
        if (Array.isArray(data)) {
          setHistory(data);
          setSavedDates(new Set(data.map((d) => d.plan_date)));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Re-fetch whenever selectedDate changes (a new plan may have been generated)
  useEffect(() => {
    fetch("/api/meal-history")
      .then((r) => r.json())
      .then((data: HistoryEntry[]) => {
        if (Array.isArray(data)) {
          setHistory(data);
          setSavedDates(new Set(data.map((d) => d.plan_date)));
        }
      })
      .catch(() => {});
  }, [selectedDate]);

  const { year, month } = viewDate;

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Build calendar grid cells: null = empty prefix cell
  const cells: (number | null)[] = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function cellDate(day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function prevMonth() {
    setViewDate((v) =>
      v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }
    );
  }

  function nextMonth() {
    const now = new Date();
    // Don't navigate past current month
    if (year === now.getFullYear() && month === now.getMonth()) return;
    setViewDate((v) =>
      v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }
    );
  }

  const recentDates = history.slice(0, 5);
  const currentMonth = new Date();
  const isCurrentMonth =
    year === currentMonth.getFullYear() && month === currentMonth.getMonth();

  return (
    <div className="rounded-2xl border border-bw-border bg-bw-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Meal Calendar</h2>
        {!loading && (
          <span className="rounded-full bg-bw-purple/15 px-3 py-1 text-xs font-semibold text-bw-purple">
            {savedDates.size} plan{savedDates.size !== 1 ? "s" : ""} saved
          </span>
        )}
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="rounded-lg border border-bw-border p-1.5 text-bw-muted hover:text-bw-text hover:border-bw-purple/40 transition"
        >
          <ChevronLeft />
        </button>
        <span className="text-sm font-semibold">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentMonth}
          className="rounded-lg border border-bw-border p-1.5 text-bw-muted hover:text-bw-text hover:border-bw-purple/40 transition disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-bw-muted py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;

          const dateStr = cellDate(day);
          const hasPlan = savedDates.has(dateStr);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isFuture = dateStr > today;

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onSelectDate(dateStr)}
              disabled={isFuture}
              className={`relative flex flex-col items-center justify-center rounded-lg aspect-square text-xs font-medium transition
                ${isFuture ? "opacity-25 cursor-not-allowed" : "cursor-pointer"}
                ${isSelected
                  ? "bg-bw-purple text-white"
                  : isToday
                  ? "ring-2 ring-bw-purple text-bw-text bg-bw-bg"
                  : hasPlan
                  ? "bg-emerald-500/10 text-bw-text hover:bg-emerald-500/20"
                  : "text-bw-muted hover:bg-bw-border/40"
                }
              `}
            >
              {day}
              {hasPlan && !isSelected && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-emerald-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick access chips */}
      {recentDates.length > 0 && (
        <div className="mt-4 pt-4 border-t border-bw-border">
          <p className="text-xs text-bw-muted font-medium mb-2">Recent plans</p>
          <div className="flex flex-wrap gap-2">
            {recentDates.map((entry) => {
              const d = new Date(entry.plan_date + "T00:00:00");
              const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
              const isSelected = entry.plan_date === selectedDate;
              return (
                <button
                  key={entry.plan_date}
                  onClick={() => {
                    onSelectDate(entry.plan_date);
                    setViewDate({ year: d.getFullYear(), month: d.getMonth() });
                  }}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    isSelected
                      ? "border-bw-purple bg-bw-purple/15 text-bw-purple"
                      : "border-bw-border text-bw-muted hover:border-bw-purple/40 hover:text-bw-text"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
