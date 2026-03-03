"use client";

export type OutfitTier = "rookie" | "warrior" | "elite" | "legend";
export type HairStyle = "short" | "medium" | "long" | "bun";
export type Gender = "male" | "female" | "neutral";

export interface BodySilhouetteProps {
  gender: Gender;
  bodyFatPct: number;    // 5–45
  muscleLevel: number;   // 1–5
  postureLevel: number;  // 1–5
  skinTone: string;      // hex
  hairStyle: HairStyle;
  outfitTier: OutfitTier;
  effects: {
    glowRing: boolean;
    dimmed: boolean;
    shimmer: boolean;
  };
  label: string;
}

const OUTFIT_COLORS: Record<OutfitTier, { shirt: string; pants: string; accent: string }> = {
  rookie:  { shirt: "#374151", pants: "#1f2937", accent: "#6b7280" },
  warrior: { shirt: "#1e40af", pants: "#1e3a8a", accent: "#3b82f6" },
  elite:   { shirt: "#6d28d9", pants: "#4c1d95", accent: "#a78bfa" },
  legend:  { shirt: "#b45309", pants: "#78350f", accent: "#fbbf24" },
};

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function buildBodyPath(
  bodyFatPct: number,
  muscleLevel: number,
  postureLevel: number,
  gender: Gender
): string {
  const bf = clamp(bodyFatPct, 5, 45);
  const ml = clamp(muscleLevel, 1, 5);
  const pl = clamp(postureLevel, 1, 5);

  // Center X
  const cx = 60;

  // Shoulder width — broader with muscle, slightly narrower at low BF
  const shoulderW = 22 + ml * 4 + (gender === "male" ? 4 : 0);

  // Hip width — wider with body fat, wider for female
  const hipW = 18 + bf * 0.38 + (gender === "female" ? 6 : 0);

  // Waist — narrower with muscle, wider with BF
  const waistW = Math.max(12, 16 + bf * 0.18 - ml * 1.5);

  // Belly bulge (only above ~18% BF)
  const belly = Math.max(0, (bf - 18) * 0.55);

  // Vertical positions (posture: higher pl = more upright = neck higher, chest out)
  const neckY = 68 - pl * 1.5;
  const shoulderY = neckY + 6;
  const chestY = shoulderY + 16;
  const waistY = chestY + 22;
  const hipY = waistY + 14;
  const kneeY = hipY + 38;
  const footY = kneeY + 42;

  // Arm positions
  const armOutX = cx + shoulderW + 5 + (bf > 25 ? (bf - 25) * 0.3 : 0);
  const elbowX = cx + shoulderW + 2 + (bf > 20 ? (bf - 20) * 0.2 : 0);
  const elbowY = waistY - 4;
  const wristX = cx + shoulderW - 2;
  const wristY = hipY + 2;

  // Left arm mirror
  const lArmOutX = cx - shoulderW - 5 - (bf > 25 ? (bf - 25) * 0.3 : 0);
  const lElbowX = cx - shoulderW - 2 - (bf > 20 ? (bf - 20) * 0.2 : 0);
  const lWristX = cx - shoulderW + 2;

  // Leg width
  const thighW = 9 + bf * 0.22 + (gender === "female" ? 2 : 0);
  const calfW = 5 + bf * 0.1;

  // Build path — clockwise from top of right shoulder
  return [
    // Neck top-right
    `M ${cx + 5} ${neckY}`,
    // Right shoulder curve
    `C ${cx + 10} ${neckY - 2}, ${cx + shoulderW - 4} ${shoulderY - 4}, ${cx + shoulderW} ${shoulderY}`,
    // Right outer arm down to elbow
    `C ${armOutX} ${shoulderY + 10}, ${elbowX + 2} ${elbowY - 8}, ${elbowX} ${elbowY}`,
    // Elbow to wrist
    `C ${elbowX - 1} ${elbowY + 12}, ${wristX + 2} ${wristY - 6}, ${wristX} ${wristY}`,
    // Right side of body down — chest with slight belly bulge
    `C ${cx + shoulderW - 2} ${chestY}, ${cx + waistW + belly + 2} ${waistY - 4}, ${cx + waistW + belly} ${waistY}`,
    // Waist to hip right
    `C ${cx + waistW + belly} ${waistY + 6}, ${cx + hipW} ${hipY - 4}, ${cx + hipW} ${hipY}`,
    // Right leg outer
    `C ${cx + thighW + (bf > 20 ? 3 : 1)} ${hipY + 14}, ${cx + thighW + 1} ${kneeY - 8}, ${cx + thighW} ${kneeY}`,
    `C ${cx + calfW + 2} ${kneeY + 12}, ${cx + calfW + 1} ${footY - 8}, ${cx + calfW} ${footY}`,
    // Foot bottom
    `L ${cx - calfW} ${footY}`,
    // Left leg outer
    `C ${cx - calfW - 1} ${footY - 8}, ${cx - calfW - 2} ${kneeY + 12}, ${cx - thighW} ${kneeY}`,
    `C ${cx - thighW - 1} ${kneeY - 8}, ${cx - thighW - (bf > 20 ? 3 : 1)} ${hipY + 14}, ${cx - hipW} ${hipY}`,
    // Hip to waist left
    `C ${cx - hipW} ${hipY - 4}, ${cx - waistW - belly} ${waistY + 6}, ${cx - waistW - belly} ${waistY}`,
    // Left body up to shoulder
    `C ${cx - waistW - belly - 2} ${waistY - 4}, ${cx - shoulderW + 2} ${chestY}, ${lWristX} ${wristY}`,
    // Left wrist to elbow
    `C ${lWristX - 2} ${wristY - 6}, ${lElbowX + 1} ${elbowY + 12}, ${lElbowX} ${elbowY}`,
    // Left elbow to shoulder
    `C ${lElbowX - 2} ${elbowY - 8}, ${lArmOutX} ${shoulderY + 10}, ${cx - shoulderW} ${shoulderY}`,
    // Left shoulder to neck
    `C ${cx - shoulderW + 4} ${shoulderY - 4}, ${cx - 10} ${neckY - 2}, ${cx - 5} ${neckY}`,
    `Z`,
  ].join(" ");
}

function HairPath({ style, cx, headTopY, skinTone }: {
  style: HairStyle;
  cx: number;
  headTopY: number;
  skinTone: string;
}) {
  const hairColor = "#2d1b0e";

  if (style === "short") {
    return (
      <ellipse
        cx={cx}
        cy={headTopY + 6}
        rx={11}
        ry={8}
        fill={hairColor}
      />
    );
  }
  if (style === "medium") {
    return (
      <g fill={hairColor}>
        <ellipse cx={cx} cy={headTopY + 5} rx={11} ry={7} />
        <rect x={cx - 10} y={headTopY + 8} width={4} height={14} rx={2} />
        <rect x={cx + 6} y={headTopY + 8} width={4} height={14} rx={2} />
      </g>
    );
  }
  if (style === "long") {
    return (
      <g fill={hairColor}>
        <ellipse cx={cx} cy={headTopY + 5} rx={11} ry={7} />
        <rect x={cx - 11} y={headTopY + 8} width={5} height={28} rx={2} />
        <rect x={cx + 6} y={headTopY + 8} width={5} height={28} rx={2} />
        <rect x={cx - 4} y={headTopY + 10} width={8} height={22} rx={2} />
      </g>
    );
  }
  // bun
  return (
    <g fill={hairColor}>
      <ellipse cx={cx} cy={headTopY + 8} rx={10} ry={6} />
      <circle cx={cx} cy={headTopY - 2} r={5} />
    </g>
  );
}

function OutfitLayer({
  tier,
  cx,
  shoulderY,
  waistY,
  hipY,
  footY,
  shoulderW,
  hipW,
}: {
  tier: OutfitTier;
  cx: number;
  shoulderY: number;
  waistY: number;
  hipY: number;
  footY: number;
  shoulderW: number;
  hipW: number;
}) {
  const colors = OUTFIT_COLORS[tier];
  const shirtBottom = waistY + 6;
  const pantsBottom = footY;

  return (
    <g opacity={0.82}>
      {/* Shirt */}
      <path
        d={`M ${cx - shoulderW + 2} ${shoulderY + 4}
            L ${cx + shoulderW - 2} ${shoulderY + 4}
            L ${cx + shoulderW - 4} ${shirtBottom}
            L ${cx - shoulderW + 4} ${shirtBottom} Z`}
        fill={colors.shirt}
      />
      {/* Pants */}
      <path
        d={`M ${cx - hipW + 2} ${hipY}
            L ${cx + hipW - 2} ${hipY}
            L ${cx + hipW - 2} ${pantsBottom}
            L ${cx - hipW + 2} ${pantsBottom} Z`}
        fill={colors.pants}
      />
      {/* Collar accent */}
      <line
        x1={cx - 4} y1={shoulderY + 4}
        x2={cx + 4} y2={shoulderY + 4}
        stroke={colors.accent} strokeWidth={1.5} strokeLinecap="round"
      />
      {/* Belt line */}
      <line
        x1={cx - shoulderW + 4} y1={shirtBottom}
        x2={cx + shoulderW - 4} y2={shirtBottom}
        stroke={colors.accent} strokeWidth={1} opacity={0.7}
      />
    </g>
  );
}

export default function BodySilhouette({
  gender,
  bodyFatPct,
  muscleLevel,
  postureLevel,
  skinTone,
  hairStyle,
  outfitTier,
  effects,
  label,
}: BodySilhouetteProps) {
  const bf = clamp(bodyFatPct, 5, 45);
  const ml = clamp(muscleLevel, 1, 5);
  const pl = clamp(postureLevel, 1, 5);

  const cx = 60;

  // Recompute key Y positions for overlay layers (must match buildBodyPath)
  const neckY = 68 - pl * 1.5;
  const shoulderY = neckY + 6;
  const chestY = shoulderY + 16;
  const waistY = chestY + 22;
  const hipY = waistY + 14;
  const kneeY = hipY + 38;
  const footY = kneeY + 42;

  const shoulderW = 22 + ml * 4 + (gender === "male" ? 4 : 0);
  const hipW = 18 + bf * 0.38 + (gender === "female" ? 6 : 0);
  const belly = Math.max(0, (bf - 18) * 0.55);

  // Head
  const headR = 11;
  const headCY = neckY - headR - 1;
  const headTopY = headCY - headR;

  const bodyPath = buildBodyPath(bf, ml, pl, gender);

  // Skin shadow (slightly darker)
  const skinShadow = skinTone + "cc";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg
          viewBox="0 0 120 240"
          width={130}
          height={260}
          style={{
            filter: effects.dimmed
              ? "brightness(0.6) saturate(0.4)"
              : undefined,
            transition: "filter 0.4s ease",
          }}
        >
          <defs>
            {effects.glowRing && (
              <filter id="glow-green" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feFlood floodColor="#22c55e" floodOpacity="0.7" result="color" />
                <feComposite in="color" in2="blur" operator="in" result="glow" />
                <feMerge>
                  <feMergeNode in="glow" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            )}
            {effects.shimmer && (
              <linearGradient id="shimmer-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0" />
                <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                <animateTransform
                  attributeName="gradientTransform"
                  type="translate"
                  from="-1 0"
                  to="1 0"
                  dur="1.8s"
                  repeatCount="indefinite"
                />
              </linearGradient>
            )}
            <radialGradient id={`skin-grad-${label}`} cx="40%" cy="35%" r="60%">
              <stop offset="0%" stopColor={skinTone} />
              <stop offset="100%" stopColor={skinShadow} />
            </radialGradient>
          </defs>

          {/* Glow ring behind body */}
          {effects.glowRing && (
            <ellipse
              cx={cx}
              cy={(headCY + footY) / 2}
              rx={shoulderW + 14}
              ry={(footY - headCY) / 2 + 10}
              fill="none"
              stroke="#22c55e"
              strokeWidth={3}
              opacity={0.45}
              filter="url(#glow-green)"
            />
          )}

          {/* Body */}
          <path
            d={bodyPath}
            fill={`url(#skin-grad-${label})`}
            stroke={skinShadow}
            strokeWidth={0.5}
          />

          {/* Outfit */}
          <OutfitLayer
            tier={outfitTier}
            cx={cx}
            shoulderY={shoulderY}
            waistY={waistY}
            hipY={hipY}
            footY={footY}
            shoulderW={shoulderW - 2}
            hipW={hipW - 2}
          />

          {/* Neck */}
          <rect
            x={cx - 4}
            y={neckY}
            width={8}
            height={headR}
            rx={3}
            fill={`url(#skin-grad-${label})`}
          />

          {/* Head */}
          <ellipse
            cx={cx}
            cy={headCY}
            rx={headR}
            ry={headR + 1}
            fill={`url(#skin-grad-${label})`}
            stroke={skinShadow}
            strokeWidth={0.5}
          />

          {/* Hair (renders on top of head) */}
          <HairPath
            style={hairStyle}
            cx={cx}
            headTopY={headTopY}
            skinTone={skinTone}
          />

          {/* Face details */}
          {/* Eyes */}
          <ellipse cx={cx - 3.5} cy={headCY - 1} rx={1.5} ry={1.8} fill="#1a1a2e" />
          <ellipse cx={cx + 3.5} cy={headCY - 1} rx={1.5} ry={1.8} fill="#1a1a2e" />
          {/* Mouth — slight smile */}
          <path
            d={`M ${cx - 3} ${headCY + 4} Q ${cx} ${headCY + 6} ${cx + 3} ${headCY + 4}`}
            fill="none"
            stroke="#7c3149"
            strokeWidth={1}
            strokeLinecap="round"
          />

          {/* Belly definition line (only if low BF + high muscle) */}
          {bf < 15 && ml >= 3 && (
            <path
              d={`M ${cx - 4} ${waistY - 8} Q ${cx} ${waistY - 5} ${cx + 4} ${waistY - 8}`}
              fill="none"
              stroke={skinShadow}
              strokeWidth={0.8}
              opacity={0.6}
            />
          )}

          {/* Shimmer overlay */}
          {effects.shimmer && (
            <rect
              x={0}
              y={0}
              width={120}
              height={240}
              fill="url(#shimmer-grad)"
              opacity={0.6}
            />
          )}

          {/* Dimmed tired overlay */}
          {effects.dimmed && (
            <>
              <rect x={0} y={0} width={120} height={240} fill="rgba(0,0,0,0.2)" />
              {/* Tired eyes — slightly drooped */}
              <path
                d={`M ${cx - 5} ${headCY - 2.5} L ${cx - 2} ${headCY - 2.5}`}
                stroke="#1a1a2e"
                strokeWidth={1.8}
                strokeLinecap="round"
              />
              <path
                d={`M ${cx + 2} ${headCY - 2.5} L ${cx + 5} ${headCY - 2.5}`}
                stroke="#1a1a2e"
                strokeWidth={1.8}
                strokeLinecap="round"
              />
            </>
          )}
        </svg>

        {/* Legend badge */}
        {outfitTier === "legend" && (
          <div className="absolute -top-1 -right-1 text-xs">⚡</div>
        )}
      </div>

      {/* Label */}
      <span className="text-xs font-semibold text-bw-muted tracking-wide uppercase">
        {label}
      </span>
    </div>
  );
}
