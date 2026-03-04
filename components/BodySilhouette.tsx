"use client";

export type OutfitTier  = "rookie" | "warrior" | "elite" | "legend";
export type HairStyle   = "short" | "medium" | "long" | "bun";
export type Gender      = "male" | "female" | "neutral";
export type AvatarState = "today" | "30days" | "90days";
export type AvatarGoal  = "muscle_gain" | "fat_loss" | "recomp" | "maintain";

export interface BodySilhouetteProps {
  gender:       Gender;
  bodyFatPct:   number;
  muscleLevel:  number;
  postureLevel: number;
  skinTone:     string;   // hex, e.g. "#F5C6A0"
  hairStyle:    HairStyle;
  outfitTier:   OutfitTier;
  effects:      { glowRing: boolean; dimmed: boolean; shimmer: boolean };
  label:        string;
  state?:       AvatarState;
  goal?:        AvatarGoal;
}

// ─── Body morph tables ────────────────────────────────────────────────────────

const TORSO_SCALE: Record<AvatarGoal, Record<AvatarState, number>> = {
  muscle_gain: { today: 1.00, "30days": 1.10, "90days": 1.24 },
  fat_loss:    { today: 1.00, "30days": 0.88, "90days": 0.72 },
  recomp:      { today: 1.00, "30days": 0.96, "90days": 0.90 },
  maintain:    { today: 1.00, "30days": 1.00, "90days": 1.00 },
};

const ARM_SCALE: Record<AvatarGoal, Record<AvatarState, number>> = {
  muscle_gain: { today: 1.00, "30days": 1.14, "90days": 1.30 },
  fat_loss:    { today: 1.00, "30days": 0.90, "90days": 0.78 },
  recomp:      { today: 1.00, "30days": 0.98, "90days": 0.94 },
  maintain:    { today: 1.00, "30days": 1.00, "90days": 1.00 },
};

// ─── Glow / label per state ───────────────────────────────────────────────────

const GLOW = {
  today:    { color: "#22c55e", opacity: 0.45, blur: 4.0 },
  "30days": { color: "#60a5fa", opacity: 0.40, blur: 3.5 },
  "90days": { color: "#818cf8", opacity: 0.70, blur: 6.0 },
} as const;

const STATE_LABEL = {
  today:    { text: "CURRENT", color: "#22c55e" },
  "30days": { text: "30 DAYS", color: "#60a5fa" },
  "90days": { text: "90 DAYS", color: "#818cf8" },
} as const;

// ─── Hair presets ─────────────────────────────────────────────────────────────

const HAIR: Record<HairStyle, { base: string; shadow: string; hi: string }> = {
  short:  { base: "#3D2B1F", shadow: "#251510", hi: "#6B4C35" },
  medium: { base: "#4A3728", shadow: "#2E2018", hi: "#7A5C45" },
  long:   { base: "#2C1F14", shadow: "#180E08", hi: "#5C3D28" },
  bun:    { base: "#1C1C1C", shadow: "#0D0D0D", hi: "#4A4A4A" },
};

// ─── Outfit presets ───────────────────────────────────────────────────────────

const OUTFIT: Record<OutfitTier, { main: string; dark: string; light: string }> = {
  rookie:  { main: "#4ADE80", dark: "#16A34A", light: "#86EFAC" },
  warrior: { main: "#60A5FA", dark: "#2563EB", light: "#93C5FD" },
  elite:   { main: "#A78BFA", dark: "#6D28D9", light: "#C4B5FD" },
  legend:  { main: "#FBBF24", dark: "#B45309", light: "#FDE68A" },
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function hScale(pivotX: number, s: number): string | undefined {
  if (s === 1) return undefined;
  return `translate(${pivotX} 0) scale(${s} 1) translate(${-pivotX} 0)`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function BodySilhouette({
  skinTone   = "#F5C6A0",
  hairStyle  = "medium",
  outfitTier = "rookie",
  label,
  state      = "today",
  goal       = "recomp",
}: BodySilhouetteProps) {
  const uid     = `av-${label.replace(/\s+/g, "-")}-${state}`;
  const hair    = HAIR[hairStyle];
  const outfit  = OUTFIT[outfitTier];
  const glow    = GLOW[state];
  const lbl     = STATE_LABEL[state];
  const torsoXf = hScale(60, TORSO_SCALE[goal][state]);
  const armXf   = hScale(60, ARM_SCALE[goal][state]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 120 235"
        width={130}
        height={255}
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Face lighting overlay */}
          <radialGradient id={`face-${uid}`} cx="40%" cy="32%" r="65%">
            <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.10" />
          </radialGradient>

          {/* Iris */}
          <radialGradient id={`iris-${uid}`} cx="35%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#7CB9E8" />
            <stop offset="55%"  stopColor="#2563EB" />
            <stop offset="100%" stopColor="#1A3A6A" />
          </radialGradient>

          {/* Hair */}
          <radialGradient id={`hair-${uid}`} cx="38%" cy="22%" r="72%">
            <stop offset="0%"   stopColor={hair.hi}     />
            <stop offset="55%"  stopColor={hair.base}   />
            <stop offset="100%" stopColor={hair.shadow} />
          </radialGradient>

          {/* Outfit */}
          <linearGradient id={`outfit-${uid}`} x1="0%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%"   stopColor={outfit.light} />
            <stop offset="50%"  stopColor={outfit.main}  />
            <stop offset="100%" stopColor={outfit.dark}  />
          </linearGradient>

          {/* Pants */}
          <linearGradient id={`pants-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#4A5568" />
            <stop offset="100%" stopColor="#1A202C" />
          </linearGradient>

          {/* Glow */}
          <filter id={`glow-${uid}`} x="-50%" y="-20%" width="200%" height="145%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={glow.blur} result="blur" />
            <feFlood floodColor={glow.color} floodOpacity={glow.opacity} result="col" />
            <feComposite in="col" in2="blur" operator="in" result="g" />
            <feMerge>
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Drop shadow */}
          <filter id={`ds-${uid}`} x="-20%" y="-10%" width="140%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#00000030" />
          </filter>
        </defs>

        {/* Pulse ring TODAY */}
        {state === "today" && (
          <ellipse
            cx="60" cy="130" rx="50" ry="100"
            fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.28"
            className="animate-pulse"
          />
        )}

        {/* ══ HAIR — back panels (behind head) ══ */}
        {(hairStyle === "long" || hairStyle === "medium") && (
          <g fill={`url(#hair-${uid})`}>
            <path d="M 37 50 C 30 65, 27 88, 28 112 C 30 116, 33 117, 35 113 C 35 92, 36 68, 38 54 Z" />
            <path d="M 83 50 C 90 65, 93 88, 92 112 C 90 116, 87 117, 85 113 C 84 92, 84 68, 82 54 Z" />
          </g>
        )}

        {/* ══ HEAD ══ */}
        <g filter={`url(#ds-${uid})`}>
          {/* Ears */}
          <ellipse cx="33" cy="53" rx="5.5" ry="6.5" fill={skinTone} />
          <ellipse cx="87" cy="53" rx="5.5" ry="6.5" fill={skinTone} />
          <ellipse cx="33" cy="53" rx="2.8" ry="3.8" fill="#E89080" opacity="0.42" />
          <ellipse cx="87" cy="53" rx="2.8" ry="3.8" fill="#E89080" opacity="0.42" />

          {/* Face */}
          <ellipse cx="60" cy="50" rx="27" ry="30" fill={skinTone} />
          <ellipse cx="60" cy="50" rx="27" ry="30" fill={`url(#face-${uid})`} />

          {/* Blush */}
          <ellipse cx="40" cy="62" rx="8.5" ry="5.5" fill="#F9A8A8" opacity="0.36" />
          <ellipse cx="80" cy="62" rx="8.5" ry="5.5" fill="#F9A8A8" opacity="0.36" />
        </g>

        {/* ══ HAIR — front cap ══ */}
        <g fill={`url(#hair-${uid})`}>
          {hairStyle === "short" && (
            <path d="M 35 47 C 35 22, 85 22, 85 47 C 84 34, 78 23, 60 22 C 42 23, 36 34, 35 47 Z" />
          )}
          {hairStyle === "medium" && (
            <>
              <path d="M 34 48 C 33 23, 87 23, 86 48 C 85 32, 78 21, 60 20 C 42 21, 35 32, 34 48 Z" />
              <path d="M 34 48 C 30 58, 29 72, 31 82 C 33 76, 35 62, 36 52 Z" />
              <path d="M 86 48 C 90 58, 91 72, 89 82 C 87 76, 85 62, 84 52 Z" />
            </>
          )}
          {hairStyle === "long" && (
            <>
              <path d="M 34 48 C 33 23, 87 23, 86 48 C 85 32, 78 21, 60 20 C 42 21, 35 32, 34 48 Z" />
              <path d="M 34 48 C 28 62, 26 88, 28 112 C 31 106, 33 80, 35 56 Z" />
              <path d="M 86 48 C 92 62, 94 88, 92 112 C 89 106, 87 80, 85 56 Z" />
            </>
          )}
          {hairStyle === "bun" && (
            <>
              <path d="M 36 47 C 36 26, 84 26, 84 47 C 83 33, 78 25, 60 24 C 42 25, 37 33, 36 47 Z" />
              <circle cx="60" cy="18" r="11" />
              <ellipse cx="60" cy="25" rx="10" ry="5" fill={hair.shadow} opacity="0.35" />
            </>
          )}
          {/* Hair highlight streak */}
          <path d="M 51 25 C 53 28, 55 33, 55 40" fill="none" stroke={hair.hi} strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
        </g>

        {/* ══ EYES ══ */}
        {/* Left */}
        <g>
          <ellipse cx="48" cy="51" rx="8" ry="6"   fill="white" />
          <circle  cx="48" cy="51" r="4.2"          fill={`url(#iris-${uid})`} />
          <circle  cx="48" cy="51" r="2.1"          fill="#12122A" />
          <circle  cx="50" cy="49" r="1.3"          fill="white"   opacity="0.92" />
          <path d="M 40 47 C 43.5 44, 52.5 44, 56 47"   fill="none" stroke="#12122A" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 40.5 55 C 44 57, 52 57, 55.5 55" fill="none" stroke="#7A5A4A" strokeWidth="0.6" strokeLinecap="round" opacity="0.42" />
        </g>
        {/* Right */}
        <g>
          <ellipse cx="72" cy="51" rx="8" ry="6"   fill="white" />
          <circle  cx="72" cy="51" r="4.2"          fill={`url(#iris-${uid})`} />
          <circle  cx="72" cy="51" r="2.1"          fill="#12122A" />
          <circle  cx="74" cy="49" r="1.3"          fill="white"   opacity="0.92" />
          <path d="M 64 47 C 67.5 44, 76.5 44, 80 47"   fill="none" stroke="#12122A" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 64.5 55 C 68 57, 76 57, 79.5 55" fill="none" stroke="#7A5A4A" strokeWidth="0.6" strokeLinecap="round" opacity="0.42" />
        </g>

        {/* ══ EYEBROWS ══ */}
        <path d="M 41 43 C 44 40, 52 39.5, 56 42" fill="none" stroke={hair.base} strokeWidth="2.0" strokeLinecap="round" />
        <path d="M 64 42 C 68 39.5, 76 40, 79 43" fill="none" stroke={hair.base} strokeWidth="2.0" strokeLinecap="round" />

        {/* ══ NOSE ══ */}
        <path
          d="M 57.5 61 C 56.5 65, 56 67, 57.5 68.5 C 59 70, 61 70, 62.5 68.5 C 64 67, 63.5 65, 62.5 61"
          fill="none" stroke="#C07850" strokeWidth="1.1" strokeLinecap="round" opacity="0.62"
        />

        {/* ══ MOUTH ══ */}
        <path d="M 51 73 C 55 78, 65 78, 69 73" fill="none" stroke="#C05060" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M 51 73 C 50 71.5, 50 70.5, 51.5 70.5" fill="none" stroke="#C05060" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M 69 73 C 70 71.5, 70 70.5, 68.5 70.5" fill="none" stroke="#C05060" strokeWidth="1.2" strokeLinecap="round" />

        {/* ══ NECK ══ */}
        <rect x="53" y="78" width="14" height="14" rx="4" fill={skinTone} />
        <rect x="53" y="88" width="14" height="5"  rx="2" fill="#00000015" />

        {/* ══ BODY — wrapped in glow ══ */}
        <g filter={`url(#glow-${uid})`}>

          {/* Torso + legs */}
          <g transform={torsoXf}>
            {/* Shirt */}
            <path d="
              M 40 92
              C 34 94, 31 100, 31 108
              L 31 155
              C 31 158, 34 160, 38 160
              L 82 160
              C 86 160, 89 158, 89 155
              L 89 108
              C 89 100, 86 94, 80 92
              C 73 89, 66 88, 60 88
              C 54 88, 47 89, 40 92
              Z
            " fill={`url(#outfit-${uid})`} />
            {/* Collar */}
            <path d="M 52 88 C 55 93, 65 93, 68 88" fill="none" stroke={outfit.dark} strokeWidth="1.2" opacity="0.52" />
            {/* Fold lines */}
            <path d="M 47 102 C 47 120, 47 138, 47 150" fill="none" stroke={outfit.dark} strokeWidth="0.8" opacity="0.25" />
            <path d="M 73 102 C 73 120, 73 138, 73 150" fill="none" stroke={outfit.dark} strokeWidth="0.8" opacity="0.25" />

            {/* Left leg */}
            <path d="
              M 36 158 C 34 162, 33 170, 33 180
              L 33 215 C 33 218, 36 220, 39 220
              L 54 220 C 57 220, 59 218, 59 215
              L 59 180 C 59 170, 58 162, 56 158 Z
            " fill={`url(#pants-${uid})`} />

            {/* Right leg */}
            <path d="
              M 64 158 C 62 162, 61 170, 61 180
              L 61 215 C 61 218, 63 220, 66 220
              L 81 220 C 84 220, 87 218, 87 215
              L 87 180 C 87 170, 86 162, 84 158 Z
            " fill={`url(#pants-${uid})`} />

            {/* Pant creases */}
            <line x1="46" y1="168" x2="46" y2="205" stroke="#0D131C" strokeWidth="0.8" opacity="0.38" />
            <line x1="74" y1="168" x2="74" y2="205" stroke="#0D131C" strokeWidth="0.8" opacity="0.38" />

            {/* Left shoe */}
            <path d="M 31 217 C 31 222, 34 225, 42 225 L 57 225 C 61 225, 62 222, 62 218 C 57 216, 52 215, 44 215 Z" fill="#1A1A2E" />
            <path d="M 33 222 C 38 221, 50 221, 58 222" fill="none" stroke="#4A4A6A" strokeWidth="0.8" opacity="0.45" />

            {/* Right shoe */}
            <path d="M 58 218 C 58 222, 59 225, 63 225 L 78 225 C 86 225, 89 222, 89 217 C 82 215, 73 216, 62 218 Z" fill="#1A1A2E" />
            <path d="M 62 222 C 67 221, 79 221, 86 222" fill="none" stroke="#4A4A6A" strokeWidth="0.8" opacity="0.45" />
          </g>

          {/* Arms */}
          <g transform={armXf}>
            {/* Right arm */}
            <path d="
              M 81 95 C 85 93, 91 95, 92 102
              C 93 118, 93 140, 91 157
              C 90 162, 88 163, 86 161
              C 84 159, 83 148, 83 133
              C 83 116, 83 100, 81 95 Z
            " fill={`url(#outfit-${uid})`} />
            <ellipse cx="88" cy="163" rx="5.5" ry="6.5" fill={skinTone} />
            <path d="M 84 162 C 86 165, 90 165, 92 162" fill="none" stroke="#C07850" strokeWidth="0.6" opacity="0.38" />

            {/* Left arm */}
            <path d="
              M 39 95 C 37 100, 37 116, 37 133
              C 37 148, 37 159, 34 161
              C 32 163, 30 162, 29 157
              C 27 140, 27 118, 28 102
              C 29 95, 35 93, 39 95 Z
            " fill={`url(#outfit-${uid})`} />
            <ellipse cx="32" cy="163" rx="5.5" ry="6.5" fill={skinTone} />
            <path d="M 28 162 C 30 165, 34 165, 36 162" fill="none" stroke="#C07850" strokeWidth="0.6" opacity="0.38" />
          </g>

        </g>
      </svg>

      {/* State label */}
      <span
        style={{
          color:         lbl.color,
          fontSize:      10,
          fontWeight:    700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {lbl.text}
      </span>
    </div>
  );
}
