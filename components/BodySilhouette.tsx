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
  skinTone:     string;
  hairStyle:    HairStyle;
  outfitTier:   OutfitTier;
  effects:      { glowRing: boolean; dimmed: boolean; shimmer: boolean };
  label:        string;
  state?:       AvatarState;
  goal?:        AvatarGoal;
}

// ─── Body morph tables ────────────────────────────────────────────────────────

const TORSO_SCALE: Record<AvatarGoal, Record<AvatarState, number>> = {
  muscle_gain: { today: 1.00, "30days": 1.08, "90days": 1.20 },
  fat_loss:    { today: 1.00, "30days": 0.91, "90days": 0.78 },
  recomp:      { today: 1.00, "30days": 0.96, "90days": 0.90 },
  maintain:    { today: 1.00, "30days": 1.00, "90days": 1.00 },
};

const SHOULDER_SCALE: Record<AvatarGoal, Record<AvatarState, number>> = {
  muscle_gain: { today: 1.00, "30days": 1.11, "90days": 1.26 },
  fat_loss:    { today: 1.00, "30days": 0.94, "90days": 0.86 },
  recomp:      { today: 1.00, "30days": 0.97, "90days": 0.92 },
  maintain:    { today: 1.00, "30days": 1.00, "90days": 1.00 },
};

// ─── Palettes ─────────────────────────────────────────────────────────────────

const GLOW = {
  today:    { color: "#22c55e", opacity: 0.55, blur: 5 },
  "30days": { color: "#60a5fa", opacity: 0.44, blur: 4 },
  "90days": { color: "#818cf8", opacity: 0.75, blur: 7 },
} as const;

const STATE_LABEL = {
  today:    { text: "CURRENT", color: "#22c55e" },
  "30days": { text: "30 DAYS", color: "#60a5fa" },
  "90days": { text: "90 DAYS", color: "#818cf8" },
} as const;

const HAIR: Record<HairStyle, { base: string; shadow: string; hi: string }> = {
  short:  { base: "#4A2E1A", shadow: "#1A0D06", hi: "#9A6040" },
  medium: { base: "#2C1A0E", shadow: "#110A04", hi: "#7A4A28" },
  long:   { base: "#1C1208", shadow: "#0A0804", hi: "#5C3520" },
  bun:    { base: "#1A1A1A", shadow: "#060606", hi: "#545454" },
};

const OUTFIT: Record<OutfitTier, { main: string; dark: string; light: string }> = {
  rookie:  { main: "#4ADE80", dark: "#15803D", light: "#DCFCE7" },
  warrior: { main: "#60A5FA", dark: "#1D4ED8", light: "#DBEAFE" },
  elite:   { main: "#A78BFA", dark: "#5B21B6", light: "#EDE9FE" },
  legend:  { main: "#FBBF24", dark: "#92400E", light: "#FEF9C3" },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function BodySilhouette({
  skinTone    = "#E0AC69",
  hairStyle   = "medium",
  outfitTier  = "rookie",
  label       = "",
  state       = "today",
  goal        = "recomp",
  bodyFatPct  = 20,
  muscleLevel = 2.5,
}: BodySilhouetteProps) {
  const uid    = `bm-${label.replace(/\W+/g, "-")}-${state}`;
  const hair   = HAIR[hairStyle];
  const outfit = OUTFIT[outfitTier];
  const glow   = GLOW[state];
  const lbl    = STATE_LABEL[state];

  const torsoS    = TORSO_SCALE[goal][state];
  const shoulderS = SHOULDER_SCALE[goal][state];

  // ── Body metric helpers ──
  const cx      = 80;
  const fatAdj  = Math.min(1.0, Math.max(-0.65, (bodyFatPct - 20) / 25));
  const muscAdj = (muscleLevel - 2.5) / 2;           // –0.75 → +1.0

  const shW  = (34 + muscAdj * 4) * shoulderS;       // shoulder half-width
  const waW  = (26 + fatAdj * 10) * torsoS;          // waist half-width
  const hiW  = (28 + fatAdj * 10) * torsoS;          // hip half-width
  const lgW  = 13 + fatAdj * 4;                      // leg half-width from hip edge to center gap

  // Key x positions
  const ShL  = cx - shW;
  const ShR  = cx + shW;
  const HiL  = cx - hiW;
  const HiR  = cx + hiW;

  // Leg columns (split at center with 5px gap)
  const LL1  = HiL;         // left leg — outer left
  const LL2  = cx - 3;      // left leg — inner right
  const RL1  = cx + 3;      // right leg — inner left
  const RL2  = HiR;         // right leg — outer right

  // Shoe centers
  const lsCX = (LL1 + LL2) / 2;
  const rsCX = (RL1 + RL2) / 2;
  const shoeW = Math.max(16, (LL2 - LL1) / 2 + 6);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        viewBox="0 0 160 282"
        width={138}
        height={244}
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Face — spherical 3D lighting (key to Bitmoji look) */}
          <radialGradient id={`fL-${uid}`} cx="36%" cy="26%" r="72%">
            <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.40" />
            <stop offset="60%"  stopColor="#FFFFFF" stopOpacity="0.00" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.14" />
          </radialGradient>

          {/* Face — chin shadow */}
          <radialGradient id={`fS-${uid}`} cx="50%" cy="92%" r="50%">
            <stop offset="0%"   stopColor="#000" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#000" stopOpacity="0.00" />
          </radialGradient>

          {/* Iris gradient */}
          <radialGradient id={`ir-${uid}`} cx="32%" cy="26%" r="68%">
            <stop offset="0%"   stopColor="#90CAF9" />
            <stop offset="42%"  stopColor="#1565C0" />
            <stop offset="100%" stopColor="#0A2A6E" />
          </radialGradient>

          {/* Hair gradient */}
          <radialGradient id={`hr-${uid}`} cx="33%" cy="14%" r="80%">
            <stop offset="0%"   stopColor={hair.hi}     />
            <stop offset="50%"  stopColor={hair.base}   />
            <stop offset="100%" stopColor={hair.shadow} />
          </radialGradient>

          {/* Outfit gradient */}
          <linearGradient id={`ot-${uid}`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%"   stopColor={outfit.light} />
            <stop offset="42%"  stopColor={outfit.main}  />
            <stop offset="100%" stopColor={outfit.dark}  />
          </linearGradient>

          {/* Sleeve / arm — slightly darker */}
          <linearGradient id={`sl-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={outfit.main}  />
            <stop offset="100%" stopColor={outfit.dark}  />
          </linearGradient>

          {/* Pants gradient */}
          <linearGradient id={`pt-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#3D4B5E" />
            <stop offset="100%" stopColor="#18202E" />
          </linearGradient>

          {/* Skin — arm / hand shading */}
          <linearGradient id={`sk-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor={skinTone} stopOpacity="0.82" />
            <stop offset="50%"  stopColor={skinTone} />
            <stop offset="100%" stopColor={skinTone} stopOpacity="0.78" />
          </linearGradient>

          {/* Glow filter */}
          <filter id={`gw-${uid}`} x="-45%" y="-15%" width="190%" height="132%">
            <feGaussianBlur in="SourceGraphic" stdDeviation={glow.blur} result="b" />
            <feFlood floodColor={glow.color} floodOpacity={glow.opacity} result="c" />
            <feComposite in="c" in2="b" operator="in" result="g" />
            <feMerge>
              <feMergeNode in="g" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Soft drop-shadow for head */}
          <filter id={`ds-${uid}`} x="-30%" y="-10%" width="160%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#00000020" />
          </filter>
        </defs>

        {/* ── Pulse ring (today) ── */}
        {state === "today" && (
          <ellipse
            cx={cx} cy={165} rx={56} ry={110}
            fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.18"
            className="animate-pulse"
          />
        )}

        {/* ══ HAIR — back panels (behind head) ══ */}
        {(hairStyle === "long" || hairStyle === "medium") && (
          <g fill={`url(#hr-${uid})`}>
            <path d={`M${cx-31} 57 C${cx-40} 80 ${cx-40} 110 ${cx-38} 134 C${cx-36} 140 ${cx-32} 140 ${cx-30} 134 C${cx-30} 110 ${cx-30} 78 ${cx-28} 61Z`} />
            <path d={`M${cx+31} 57 C${cx+40} 80 ${cx+40} 110 ${cx+38} 134 C${cx+36} 140 ${cx+32} 140 ${cx+30} 134 C${cx+30} 110 ${cx+30} 78 ${cx+28} 61Z`} />
            {hairStyle === "long" && (
              <>
                <path d={`M${cx-28} 61 C${cx-38} 88 ${cx-38} 132 ${cx-36} 170 C${cx-34} 176 ${cx-30} 176 ${cx-28} 170 C${cx-27} 132 ${cx-27} 88 ${cx-25} 65Z`} />
                <path d={`M${cx+28} 61 C${cx+38} 88 ${cx+38} 132 ${cx+36} 170 C${cx+34} 176 ${cx+30} 176 ${cx+28} 170 C${cx+27} 132 ${cx+27} 88 ${cx+25} 65Z`} />
              </>
            )}
          </g>
        )}

        {/* ══ HEAD ══ */}
        <g filter={`url(#ds-${uid})`}>
          {/* Ears */}
          <ellipse cx={cx-44} cy={68} rx="8.5" ry="12" fill={skinTone} />
          <ellipse cx={cx+44} cy={68} rx="8.5" ry="12" fill={skinTone} />
          <ellipse cx={cx-44} cy={68} rx="4.5"  ry="7"  fill="#D47050" opacity="0.35" />
          <ellipse cx={cx+44} cy={68} rx="4.5"  ry="7"  fill="#D47050" opacity="0.35" />

          {/* Face base */}
          <ellipse cx={cx} cy={68} rx="43" ry="52" fill={skinTone} />
          {/* 3D spherical lighting — makes it look like Bitmoji/Meta */}
          <ellipse cx={cx} cy={68} rx="43" ry="52" fill={`url(#fL-${uid})`} />
          {/* Chin shadow */}
          <ellipse cx={cx} cy={68} rx="43" ry="52" fill={`url(#fS-${uid})`} />

          {/* Cheek blush — Bitmoji signature touch */}
          <ellipse cx={cx-24} cy={85} rx="13" ry="8" fill="#FF8898" opacity="0.26" />
          <ellipse cx={cx+24} cy={85} rx="13" ry="8" fill="#FF8898" opacity="0.26" />
        </g>

        {/* ══ HAIR — front cap ══ */}
        <g fill={`url(#hr-${uid})`}>
          {hairStyle === "short" && (
            <>
              <path d={`M${cx-37} 52 C${cx-40} 21 ${cx+40} 21 ${cx+37} 52 C${cx+35} 33 ${cx+19} 19 ${cx} 18 C${cx-19} 19 ${cx-35} 33 ${cx-37} 52Z`} />
              <path d={`M${cx-37} 52 C${cx-44} 60 ${cx-44} 74 ${cx-40} 79 C${cx-38} 72 ${cx-37} 61 ${cx-35} 55Z`} />
              <path d={`M${cx+37} 52 C${cx+44} 60 ${cx+44} 74 ${cx+40} 79 C${cx+38} 72 ${cx+37} 61 ${cx+35} 55Z`} />
            </>
          )}
          {hairStyle === "medium" && (
            <>
              <path d={`M${cx-38} 54 C${cx-41} 21 ${cx+41} 21 ${cx+38} 54 C${cx+36} 33 ${cx+20} 19 ${cx} 18 C${cx-20} 19 ${cx-36} 33 ${cx-38} 54Z`} />
              <path d={`M${cx-38} 54 C${cx-46} 66 ${cx-46} 88 ${cx-43} 106 C${cx-40} 99 ${cx-38} 77 ${cx-37} 58Z`} />
              <path d={`M${cx+38} 54 C${cx+46} 66 ${cx+46} 88 ${cx+43} 106 C${cx+40} 99 ${cx+38} 77 ${cx+37} 58Z`} />
            </>
          )}
          {hairStyle === "long" && (
            <>
              <path d={`M${cx-38} 54 C${cx-41} 21 ${cx+41} 21 ${cx+38} 54 C${cx+36} 33 ${cx+20} 19 ${cx} 18 C${cx-20} 19 ${cx-36} 33 ${cx-38} 54Z`} />
              <path d={`M${cx-38} 54 C${cx-48} 72 ${cx-48} 104 ${cx-45} 148 C${cx-42} 142 ${cx-39} 106 ${cx-37} 60Z`} />
              <path d={`M${cx+38} 54 C${cx+48} 72 ${cx+48} 104 ${cx+45} 148 C${cx+42} 142 ${cx+39} 106 ${cx+37} 60Z`} />
            </>
          )}
          {hairStyle === "bun" && (
            <>
              <path d={`M${cx-36} 54 C${cx-38} 25 ${cx+38} 25 ${cx+36} 54 C${cx+34} 36 ${cx+18} 23 ${cx} 22 C${cx-18} 23 ${cx-34} 36 ${cx-36} 54Z`} />
              {/* Bun */}
              <circle cx={cx} cy={15} r="18" />
              <ellipse cx={cx} cy={27} rx="16" ry="7" fill={hair.shadow} opacity="0.40" />
              {/* Bun shine */}
              <ellipse cx={cx-4} cy={10} rx="6" ry="3.5" fill={hair.hi} opacity="0.52" />
            </>
          )}
          {/* Hair shine streak */}
          <path
            d={`M${cx-8} 25 C${cx-6} 32 ${cx-5} 42 ${cx-6} 53`}
            fill="none" stroke={hair.hi} strokeWidth="3" strokeLinecap="round" opacity="0.46"
          />
        </g>

        {/* ══ EYES (large — Bitmoji/Meta style) ══ */}

        {/* Left eye */}
        <g>
          {/* White sclera */}
          <ellipse cx={cx-16} cy={67} rx="13.5" ry="14.5" fill="white" />
          {/* Iris */}
          <circle  cx={cx-16} cy={68} r="10" fill={`url(#ir-${uid})`} />
          {/* Pupil */}
          <circle  cx={cx-16} cy={68} r="5.5" fill="#060618" />
          {/* Primary catchlight */}
          <circle  cx={cx-11} cy={63} r="3.4" fill="white" opacity="0.96" />
          {/* Secondary catchlight */}
          <circle  cx={cx-20} cy={72} r="1.5" fill="white" opacity="0.52" />
          {/* Upper eyelid stroke */}
          <path d={`M${cx-30} 57 Q${cx-16} 50 ${cx-2} 57`}
            fill="none" stroke="#08081E" strokeWidth="2.6" strokeLinecap="round" />
          {/* Lower lash shadow */}
          <path d={`M${cx-29} 78 Q${cx-16} 82 ${cx-3} 78`}
            fill="none" stroke="#A06858" strokeWidth="0.7" strokeLinecap="round" opacity="0.32" />
        </g>

        {/* Right eye */}
        <g>
          <ellipse cx={cx+16} cy={67} rx="13.5" ry="14.5" fill="white" />
          <circle  cx={cx+16} cy={68} r="10" fill={`url(#ir-${uid})`} />
          <circle  cx={cx+16} cy={68} r="5.5" fill="#060618" />
          <circle  cx={cx+21} cy={63} r="3.4" fill="white" opacity="0.96" />
          <circle  cx={cx+12} cy={72} r="1.5" fill="white" opacity="0.52" />
          <path d={`M${cx+2} 57 Q${cx+16} 50 ${cx+30} 57`}
            fill="none" stroke="#08081E" strokeWidth="2.6" strokeLinecap="round" />
          <path d={`M${cx+3} 78 Q${cx+16} 82 ${cx+29} 78`}
            fill="none" stroke="#A06858" strokeWidth="0.7" strokeLinecap="round" opacity="0.32" />
        </g>

        {/* ══ EYEBROWS ══ */}
        <path
          d={`M${cx-31} 51 C${cx-22} 45 ${cx-10} 45 ${cx-4} 50`}
          fill="none" stroke={hair.base} strokeWidth="3.4" strokeLinecap="round"
        />
        <path
          d={`M${cx+4} 50 C${cx+10} 45 ${cx+22} 45 ${cx+31} 51`}
          fill="none" stroke={hair.base} strokeWidth="3.4" strokeLinecap="round"
        />

        {/* ══ NOSE ══ */}
        <path
          d={`M${cx-3} 90 C${cx-5} 96 ${cx-7} 100 ${cx-3} 102 Q${cx} 103.5 ${cx+3} 102 C${cx+7} 100 ${cx+5} 96 ${cx+3} 90`}
          fill="none" stroke="#BF7050" strokeWidth="1.5" strokeLinecap="round" opacity="0.60"
        />

        {/* ══ MOUTH ══ */}
        {/* Cupid's bow upper lip */}
        <path
          d={`M${cx-14} 110 C${cx-8} 106 ${cx-3} 105 ${cx} 107 C${cx+3} 105 ${cx+8} 106 ${cx+14} 110`}
          fill="none" stroke="#C85070" strokeWidth="1.6" strokeLinecap="round"
        />
        {/* Lower lip smile curve */}
        <path
          d={`M${cx-15} 110 Q${cx} 122 ${cx+15} 110`}
          fill="none" stroke="#C85070" strokeWidth="2.3" strokeLinecap="round"
        />

        {/* ══ NECK ══ */}
        <rect x={cx-9} y="118" width="18" height="18" rx="6" fill={skinTone} />
        <rect x={cx-9} y="128" width="18" height="9"  rx="3" fill="#00000010" />

        {/* ══ BODY (wrapped in glow) ══ */}
        <g filter={`url(#gw-${uid})`}>

          {/* ─── Shirt torso ─── */}
          <path d={`
            M${cx} 134
            C${cx-22} 133 ${cx-36} 135 ${ShL} 147
            C${ShL-9} 155 ${ShL-11} 170 ${ShL-9} 186
            L${ShL-9} 220
            L${ShR+9} 220
            L${ShR+9} 186
            C${ShR+11} 170 ${ShR+9} 155 ${ShR} 147
            C${cx+36} 135 ${cx+22} 133 ${cx} 134
            Z
          `} fill={`url(#ot-${uid})`} />

          {/* Collar V-neck */}
          <path
            d={`M${cx-12} 134 L${cx} 147 L${cx+12} 134`}
            fill="none" stroke={outfit.dark} strokeWidth="1.6"
            strokeLinecap="round" strokeLinejoin="round" opacity="0.65"
          />

          {/* Centre seam fold */}
          <line x1={cx} y1="147" x2={cx} y2="220" stroke={outfit.dark} strokeWidth="0.6" opacity="0.20" />

          {/* ─── Right arm ─── */}
          <path d={`
            M${ShR} 147
            C${ShR+14} 152 ${ShR+19} 170 ${ShR+18} 188
            C${ShR+17} 204 ${ShR+13} 216 ${ShR+10} 221
            C${ShR+7}  225 ${ShR+2}  225 ${ShR-1}  221
            C${ShR-4}  217 ${ShR-4}  204 ${ShR-4}  188
            C${ShR-4}  168 ${ShR-2}  152 ${ShR}  147Z
          `} fill={`url(#sl-${uid})`} />
          {/* Right hand */}
          <ellipse cx={ShR+5}  cy={223} rx="9" ry="10" fill={skinTone} />
          <ellipse cx={ShR+5}  cy={223} rx="9" ry="10" fill={`url(#fL-${uid})`} />

          {/* ─── Left arm ─── */}
          <path d={`
            M${ShL} 147
            C${ShL-14} 152 ${ShL-19} 170 ${ShL-18} 188
            C${ShL-17} 204 ${ShL-13} 216 ${ShL-10} 221
            C${ShL-7}  225 ${ShL-2}  225 ${ShL+1}  221
            C${ShL+4}  217 ${ShL+4}  204 ${ShL+4}  188
            C${ShL+4}  168 ${ShL+2}  152 ${ShL}  147Z
          `} fill={`url(#sl-${uid})`} />
          {/* Left hand */}
          <ellipse cx={ShL-5} cy={223} rx="9" ry="10" fill={skinTone} />
          <ellipse cx={ShL-5} cy={223} rx="9" ry="10" fill={`url(#fL-${uid})`} />

          {/* ─── Left pant leg ─── */}
          <path d={`
            M${LL1} 218
            C${LL1-2} 232 ${LL1-2} 248 ${LL1} 262
            L${LL1} 267 L${LL2} 267 L${LL2} 262
            C${LL2+2} 248 ${LL2+2} 232 ${LL2} 218Z
          `} fill={`url(#pt-${uid})`} />

          {/* ─── Right pant leg ─── */}
          <path d={`
            M${RL1} 218
            C${RL1-2} 232 ${RL1-2} 248 ${RL1} 262
            L${RL1} 267 L${RL2} 267 L${RL2} 262
            C${RL2+2} 248 ${RL2+2} 232 ${RL2} 218Z
          `} fill={`url(#pt-${uid})`} />

          {/* Pant crease lines */}
          <line x1={(LL1+LL2)/2} y1="226" x2={(LL1+LL2)/2} y2="264" stroke="#0D1420" strokeWidth="1" opacity="0.35" />
          <line x1={(RL1+RL2)/2} y1="226" x2={(RL1+RL2)/2} y2="264" stroke="#0D1420" strokeWidth="1" opacity="0.35" />

          {/* ─── Left shoe ─── */}
          <path d={`
            M${lsCX - shoeW - 2} 264
            C${lsCX - shoeW - 6} 268 ${lsCX - shoeW - 4} 274 ${lsCX - shoeW + 4} 275
            L${lsCX + shoeW + 2} 275
            C${lsCX + shoeW + 6} 275 ${lsCX + shoeW + 7} 270 ${lsCX + shoeW + 4} 265
            C${lsCX + shoeW} 263 ${lsCX} 262 ${lsCX - shoeW - 2} 264Z
          `} fill="#1A1A2E" />
          <path
            d={`M${lsCX - shoeW + 2} 268 Q${lsCX} 266 ${lsCX + shoeW + 1} 268`}
            fill="none" stroke="#3A3A5E" strokeWidth="0.8" opacity="0.5"
          />

          {/* ─── Right shoe ─── */}
          <path d={`
            M${rsCX - shoeW - 4} 265
            C${rsCX - shoeW - 7} 270 ${rsCX - shoeW - 6} 275 ${rsCX - shoeW - 2} 275
            L${rsCX + shoeW + 2} 275
            C${rsCX + shoeW + 6} 274 ${rsCX + shoeW + 6} 268 ${rsCX + shoeW + 2} 264
            C${rsCX} 262 ${rsCX - shoeW} 263 ${rsCX - shoeW - 4} 265Z
          `} fill="#1A1A2E" />
          <path
            d={`M${rsCX - shoeW - 1} 268 Q${rsCX} 266 ${rsCX + shoeW + 1} 268`}
            fill="none" stroke="#3A3A5E" strokeWidth="0.8" opacity="0.5"
          />

        </g>
      </svg>

      {/* State label */}
      <span
        style={{
          color:         lbl.color,
          fontSize:      10,
          fontWeight:    700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
        }}
      >
        {lbl.text}
      </span>
    </div>
  );
}
