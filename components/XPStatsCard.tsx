"use client";

import { useEffect, useState } from "react";

interface XPStats {
  xp: number;
  level: number;
  streak: number;
  tierName: string;
  xpInLevel: number;
  xpToNextLevel: number;
  xpPct: number;
}

interface HistoryEntry {
  plan_date: string;
}

const TIER_COLORS: Record<string, string> = {
  Rookie:   "bg-bw-border text-bw-muted border border-bw-border",
  Warrior:  "bg-bw-blue/20 text-bw-blue border border-bw-blue/30",
  Elite:    "bg-bw-purple/20 text-bw-purple border border-bw-purple/30",
  Legend:   "bg-amber-500/20 text-amber-400 border border-amber-500/30",
};

function StatBar({
  label,
  value,
  colorClass,
}: {
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-bw-muted">{label}</span>
        <span className="text-xs font-semibold text-bw-text">{value}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-bw-border overflow-hidden">
        <div
          className={`h-full rounded-full ${colorClass} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export default function XPStatsCard({ refreshKey }: { refreshKey?: number }) {
  const [stats, setStats] = useState<XPStats | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      fetch("/api/award-xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "login" }),
      }).then((r) => r.json()),
      fetch("/api/meal-history").then((r) => r.json()),
    ])
      .then(([xpData, historyData]) => {
        if (cancelled) return;
        if (xpData && !xpData.error) setStats(xpData as XPStats);
        if (Array.isArray(historyData)) setHistory(historyData);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // Compute stat bar values from history + stats
  const savedSet = new Set(history.map((h) => h.plan_date));
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .split("T")[0];
  });
  const completedDays = last7.filter((d) => savedSet.has(d)).length;
  const weeklyCompletion = completedDays / 7;

  const disciplinePct = stats ? Math.min(stats.streak * 5, 100) : 0;
  const energyPct = Math.round(weeklyCompletion * 100);
  const metabolismPct = stats ? Math.min(Math.round((stats.level / 20) * 100), 100) : 0;

  const tierColor = stats ? (TIER_COLORS[stats.tierName] ?? TIER_COLORS.Rookie) : TIER_COLORS.Rookie;

  return (
    <div className="rounded-2xl border border-bw-border bg-bw-card p-6">
      <h2 className="text-lg font-bold mb-4">Player Stats</h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Spinner />
        </div>
      ) : !stats ? (
        <p className="text-sm text-bw-muted text-center py-4">Could not load stats.</p>
      ) : (
        <>
          {/* Level + tier + streak row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <span className="text-3xl font-extrabold bg-gradient-to-r from-bw-purple to-bw-blue bg-clip-text text-transparent">
                Lv.{stats.level}
              </span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold tracking-wide ${tierColor}`}>
                {stats.tierName}
              </span>
            </div>
            {stats.streak > 0 && (
              <span className="text-sm font-semibold">
                🔥 {stats.streak} day{stats.streak !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* XP bar */}
          <div className="mb-5">
            <div className="flex justify-between text-xs text-bw-muted mb-1.5">
              <span className="font-medium text-bw-text">XP</span>
              <span>Level {stats.level + 1}</span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-bw-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-bw-purple to-bw-blue transition-all duration-500"
                style={{ width: `${stats.xpPct}%` }}
              />
            </div>
            <p className="text-xs text-bw-muted mt-1.5 text-right">
              {stats.xpInLevel} / {stats.xpToNextLevel} XP
            </p>
          </div>

          {/* Stat bars */}
          <div className="flex flex-col gap-3">
            <StatBar label="Discipline" value={disciplinePct} colorClass="bg-bw-purple" />
            <StatBar label="Energy" value={energyPct} colorClass="bg-emerald-500" />
            <StatBar label="Metabolism" value={metabolismPct} colorClass="bg-bw-blue" />
          </div>
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
