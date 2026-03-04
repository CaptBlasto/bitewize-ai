"use client";

export type OutfitTier = "rookie" | "warrior" | "elite" | "legend";
export type HairStyle  = "short" | "medium" | "long" | "bun";
export type Gender     = "male" | "female" | "neutral";
export type AvatarState = "today" | "30days" | "90days";
export type AvatarGoal  = "muscle_gain" | "fat_loss" | "recomp" | "maintain";

export interface BodySilhouetteProps {
  gender: Gender;
  bodyFatPct: number;
  muscleLevel: number;
  postureLevel: number;
  skinTone: string;
  hairStyle: HairStyle;
  outfitTier: OutfitTier;
  effects: { glowRing: boolean; dimmed: boolean; shimmer: boolean };
  label: string;
  state?: AvatarState;
  goal?:  AvatarGoal;
}

// ─── Morph tables ─────────────────────────────────────────────────────────────
// All scales are horizontal (X-axis only), pivoting about the body centre x=60.
// Torso controls chest/waist/hip width; arm controls arm width + outward shift.

const TORSO_SCALE: Record<AvatarGoal, Record<AvatarState, number>> = {
  muscle_gain: { today: 1.00, "30days": 1.05, "90days": 1.12 },
  fat_loss:    { today: 1.00, "30days": 0.92, "90days": 0.82 },
  recomp:      { today: 1.00, "30days": 0.98, "90days": 0.95 },
  maintain:    { today: 1.00, "30days": 1.00, "90days": 1.00 },
};

const ARM_SCALE: Record<AvatarGoal, Record<AvatarState, number>> = {
  muscle_gain: { today: 1.00, "30days": 1.08, "90days": 1.18 },
  fat_loss:    { today: 1.00, "30days": 0.95, "90days": 0.88 },
  recomp:      { today: 1.00, "30days": 1.01, "90days": 1.03 },
  maintain:    { today: 1.00, "30days": 1.00, "90days": 1.00 },
};

// ─── Glow + label per state ───────────────────────────────────────────────────

const GLOW = {
  today:    { color: "#22c55e", opacity: 0.50, blur: 4.0 },
  "30days": { color: "#60a5fa", opacity: 0.45, blur: 3.5 },
  "90days": { color: "#818cf8", opacity: 0.72, blur: 5.5 },
} satisfies Record<AvatarState, { color: string; opacity: number; blur: number }>;

const STATE_LABEL = {
  today:    { text: "CURRENT", color: "#22c55e" },
  "30days": { text: "30 DAYS", color: "#60a5fa" },
  "90days": { text: "90 DAYS", color: "#818cf8" },
} satisfies Record<AvatarState, { text: string; color: string }>;

// ─── Muscle-line style per goal × state ──────────────────────────────────────

function muscleStyle(goal: AvatarGoal, state: AvatarState) {
  if (goal === "muscle_gain") {
    if (state === "30days") return { sw: 1.0, op: 0.58 };
    if (state === "90days") return { sw: 1.4, op: 0.78 };
  }
  if (goal === "fat_loss" && state === "90days") return { sw: 1.1, op: 0.64 };
  return { sw: 0.85, op: 0.42 };
}

// ─── SVG helpers ─────────────────────────────────────────────────────────────

/** Horizontal scale about a pivot X, returns SVG transform string or undefined. */
function hScale(pivotX: number, s: number): string | undefined {
  if (s === 1) return undefined;
  return `translate(${pivotX} 0) scale(${s} 1) translate(${-pivotX} 0)`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BodySilhouette({
  label,
  state = "today",
  goal  = "recomp",
}: BodySilhouetteProps) {
  const uid    = `${label.replace(/\s+/g, "-")}-${state}`;
  const glow   = GLOW[state];
  const lbl    = STATE_LABEL[state];
  const ml     = muscleStyle(goal, state);

  const torsoXf = hScale(60, TORSO_SCALE[goal][state]);
  const armXf   = hScale(60, ARM_SCALE[goal][state]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 120 262"
        width={130}
        height={284}
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Body fill — cool highlight fading to deep indigo */}
          <radialGradient id={`fill-${uid}`} cx="38%" cy="28%" r="70%">
            <stop offset="0%"   stopColor="#c7d2fe" />
            <stop offset="40%"  stopColor="#818cf8" />
            <stop offset="100%" stopColor="#3730a3" />
          </radialGradient>

          {/* State-specific coloured glow */}
          <filter id={`glow-${uid}`} x="-40%" y="-15%" width="180%" height="130%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={glow.blur} result="blur" />
            <feFlood floodColor={glow.color} floodOpacity={glow.opacity} result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── TODAY: animated green pulse ring ── */}
        {state === "today" && (
          <ellipse
            cx="60" cy="131" rx="52" ry="112"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2.5"
            opacity="0.35"
            className="animate-pulse"
          />
        )}

        {/* ── BODY SHAPES ─────────────────────────────────────────────── */}
        <g
          fill={`url(#fill-${uid})`}
          filter={`url(#glow-${uid})`}
          stroke="#6366f1"
          strokeWidth="0.6"
          strokeLinejoin="round"
        >
          {/* HEAD — no morph */}
          <ellipse cx="60" cy="20" rx="13" ry="14" />

          {/* NECK — no morph */}
          <rect x="55" y="32" width="10" height="14" rx="3" />

          {/*
            TORSO + LEGS
            One closed path.  Clockwise from right collar:
              → right chest → waist → hip → crotch outer
              → right leg outer → right foot
              → right inner leg UP (leg gap created here)
              → across crotch gap
              → left inner leg DOWN
              → left foot → left outer leg UP
              → left chest → left collar → neck → close
          */}
          <g transform={torsoXf}>
            <path d="
              M 67 44
              C 78 46, 86 50, 87 57
              C 87 73, 85 90, 83 108
              C 82 118, 83 127, 85 135
              C 86 139, 84 142, 77 143
              C 80 147, 80 163, 79 180
              C 78 194, 75 212, 73 228
              C 71 236, 70 243, 70 248
              C 70 252, 73 255, 82 255
              L 89 255
              C 91 252, 90 249, 85 248
              C 78 248, 70 248, 65 247
              C 65 242, 66 231, 67 217
              C 68 200, 67 184, 66 169
              C 65 154, 65 148, 65 144
              C 63 143, 57 143, 55 144
              C 55 148, 55 154, 54 169
              C 53 184, 52 200, 53 217
              C 54 231, 55 242, 55 247
              C 50 248, 42 248, 35 248
              C 30 249, 29 252, 31 255
              L 38 255
              C 47 255, 50 252, 50 248
              C 50 243, 49 236, 47 228
              C 45 212, 42 194, 41 180
              C 40 163, 40 147, 43 143
              C 36 142, 35 139, 35 135
              C 37 127, 38 118, 37 108
              C 35 90, 33 73, 33 57
              C 34 50, 42 46, 53 44
              C 56 43, 60 42, 64 43
              C 65 43, 66 44, 67 44
              Z
            " />
          </g>

          {/*
            RIGHT ARM
            Clockwise: inner shoulder → across shoulder top → outer arm down
            → hand → inner arm up → close.
          */}
          <g transform={armXf}>
            <path d="
              M 87 57
              C 91 53, 96 52, 99 56
              C 105 62, 111 79, 111 104
              C 111 122, 108 141, 104 154
              C 101 163, 98 171, 96 177
              C 93 181, 90 181, 89 177
              C 89 171, 89 158, 89 145
              C 89 127, 91 109, 91 94
              C 91 76, 89 62, 87 57
              Z
            " />
          </g>

          {/*
            LEFT ARM (mirror of right)
            Clockwise: inner shoulder → inner arm down → hand → outer arm up → close.
          */}
          <g transform={armXf}>
            <path d="
              M 33 57
              C 29 62, 29 76, 29 94
              C 29 109, 31 127, 31 145
              C 31 158, 31 171, 31 177
              C 30 181, 27 181, 24 177
              C 22 171, 19 163, 16 154
              C 12 141,  9 122,  9 104
              C  9  79, 15  62, 21  56
              C 24  52, 29  53, 33  57
              Z
            " />
          </g>
        </g>

        {/* ── MUSCLE DEFINITION ─────────────────────────────────────────── */}
        {/* Drawn in original coordinate space — strokeWidth/opacity vary by state */}
        <g fill="none" stroke="#3730a3" strokeLinecap="round" strokeLinejoin="round">
          {/* Sternum */}
          <line x1="60" y1="52" x2="60" y2="94"
            strokeWidth={ml.sw} opacity={ml.op * 1.25} />
          {/* Pec fold */}
          <path d="M 42 68 C 50 75, 60 76, 70 75 C 76 73, 82 69, 85 65"
            strokeWidth={ml.sw} opacity={ml.op} />
          {/* Upper abs */}
          <path d="M 49 95 C 55 99, 65 99, 71 95"
            strokeWidth={ml.sw} opacity={ml.op} />
          {/* Lower abs */}
          <path d="M 50 107 C 56 111, 64 111, 70 107"
            strokeWidth={ml.sw} opacity={ml.op * 0.88} />
          {/* Obliques */}
          <path d="M 39 108 C 42 117, 44 126, 42 134"
            strokeWidth={ml.sw * 0.85} opacity={ml.op * 0.72} />
          <path d="M 81 108 C 78 117, 76 126, 78 134"
            strokeWidth={ml.sw * 0.85} opacity={ml.op * 0.72} />
          {/* Quad highlights */}
          <path d="M 73 150 C 74 165, 75 178, 74 190"
            strokeWidth={ml.sw * 0.78} opacity={ml.op * 0.65} />
          <path d="M 47 150 C 46 165, 45 178, 46 190"
            strokeWidth={ml.sw * 0.78} opacity={ml.op * 0.65} />
        </g>

        {/* ── COLLARBONE HIGHLIGHTS ─────────────────────────────────────── */}
        <g fill="none" stroke="#c7d2fe" strokeWidth="0.9" strokeLinecap="round" opacity="0.45">
          <path d="M 44 53 C 52 49, 60 49, 60 49" />
          <path d="M 76 53 C 68 49, 60 49, 60 49" />
        </g>

        {/* ── FACE ──────────────────────────────────────────────────────── */}
        <ellipse cx="56" cy="20" rx="1.5" ry="1.8" fill="#1e1b4b" />
        <ellipse cx="64" cy="20" rx="1.5" ry="1.8" fill="#1e1b4b" />
        <path
          d="M 57 27 Q 60 30 63 27"
          fill="none" stroke="#312e81" strokeWidth="1" strokeLinecap="round"
        />
      </svg>

      {/* ── STATE LABEL ── */}
      <span
        style={{
          color: lbl.color,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {lbl.text}
      </span>
    </div>
  );
}
