"use client";

import { useState } from "react";

const SKIN_TONES = [
  { id: "fair",   hex: "#FDEBD0" },
  { id: "light",  hex: "#F1C27D" },
  { id: "medium", hex: "#E0AC69" },
  { id: "tan",    hex: "#C68642" },
  { id: "brown",  hex: "#8D5524" },
  { id: "deep",   hex: "#4A2912" },
];

const HAIR_COLOR = "#2d1b0e";

type HairStyle = "short" | "medium" | "long" | "curly";

function Hair({ style }: { style: HairStyle }) {
  if (style === "short") return (
    <ellipse cx={100} cy={45} rx={60} ry={30} fill={HAIR_COLOR} />
  );
  if (style === "medium") return (
    <g fill={HAIR_COLOR}>
      <ellipse cx={100} cy={45} rx={60} ry={30} />
      <rect x={38} y={58} width={14} height={55} rx={7} />
      <rect x={148} y={58} width={14} height={55} rx={7} />
    </g>
  );
  if (style === "long") return (
    <g fill={HAIR_COLOR}>
      <ellipse cx={100} cy={45} rx={60} ry={30} />
      <rect x={36} y={58} width={14} height={110} rx={7} />
      <rect x={150} y={58} width={14} height={110} rx={7} />
      <rect x={62} y={62} width={18} height={95} rx={8} />
      <rect x={120} y={62} width={18} height={95} rx={8} />
    </g>
  );
  // curly
  return (
    <g fill={HAIR_COLOR}>
      <ellipse cx={100} cy={42} rx={62} ry={32} />
      {[38, 58, 78, 100, 122, 142, 162].map((x, i) => (
        <circle key={i} cx={x} cy={54} r={12} />
      ))}
    </g>
  );
}

type EyeStyle = "normal" | "wide" | "sleepy" | "cool";

function Eyes({ style }: { style: EyeStyle }) {
  if (style === "normal") return (
    <g>
      <ellipse cx={78} cy={100} rx={8} ry={9} fill="#fff" />
      <ellipse cx={122} cy={100} rx={8} ry={9} fill="#fff" />
      <circle cx={80} cy={101} r={5} fill="#2d1b0e" />
      <circle cx={124} cy={101} r={5} fill="#2d1b0e" />
      <circle cx={82} cy={99} r={1.5} fill="#fff" />
      <circle cx={126} cy={99} r={1.5} fill="#fff" />
    </g>
  );
  if (style === "wide") return (
    <g>
      <ellipse cx={78} cy={100} rx={10} ry={12} fill="#fff" />
      <ellipse cx={122} cy={100} rx={10} ry={12} fill="#fff" />
      <circle cx={78} cy={101} r={6} fill="#2d1b0e" />
      <circle cx={122} cy={101} r={6} fill="#2d1b0e" />
      <circle cx={80} cy={99} r={2} fill="#fff" />
      <circle cx={124} cy={99} r={2} fill="#fff" />
    </g>
  );
  if (style === "sleepy") return (
    <g>
      <ellipse cx={78} cy={102} rx={8} ry={5} fill="#fff" />
      <ellipse cx={122} cy={102} rx={8} ry={5} fill="#fff" />
      <circle cx={78} cy={103} r={3.5} fill="#2d1b0e" />
      <circle cx={122} cy={103} r={3.5} fill="#2d1b0e" />
      <path d="M70 99 Q78 96 86 99" fill={`#2d1b0e`} stroke="none" />
      <path d="M114 99 Q122 96 130 99" fill={`#2d1b0e`} stroke="none" />
    </g>
  );
  // cool — sunglasses
  return (
    <g>
      <rect x={64} y={92} width={30} height={18} rx={9} fill="#111" />
      <rect x={106} y={92} width={30} height={18} rx={9} fill="#111" />
      <line x1={94} y1={101} x2={106} y2={101} stroke="#111" strokeWidth={3} />
      <line x1={60} y1={99} x2={64} y2={100} stroke="#111" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={136} y1={100} x2={140} y2={99} stroke="#111" strokeWidth={2.5} strokeLinecap="round" />
      <rect x={66} y={94} width={10} height={5} rx={2.5} fill="#fff" opacity={0.15} />
      <rect x={108} y={94} width={10} height={5} rx={2.5} fill="#fff" opacity={0.15} />
    </g>
  );
}

type BrowStyle = "normal" | "raised" | "angry" | "thick";

function Brows({ style }: { style: BrowStyle }) {
  if (style === "normal") return (
    <g fill="none" stroke="#2d1b0e" strokeWidth={2.5} strokeLinecap="round">
      <path d="M70 88 Q78 83 86 87" /><path d="M114 87 Q122 83 130 88" />
    </g>
  );
  if (style === "raised") return (
    <g fill="none" stroke="#2d1b0e" strokeWidth={2.5} strokeLinecap="round">
      <path d="M70 82 Q78 77 86 81" /><path d="M114 81 Q122 77 130 82" />
    </g>
  );
  if (style === "angry") return (
    <g fill="none" stroke="#2d1b0e" strokeWidth={2.5} strokeLinecap="round">
      <path d="M70 83 Q78 88 86 85" /><path d="M114 85 Q122 88 130 83" />
    </g>
  );
  // thick
  return (
    <g fill="#2d1b0e">
      <path d="M70 88 Q78 82 86 86 Q78 89 70 88 Z" />
      <path d="M114 86 Q122 82 130 88 Q122 89 114 86 Z" />
    </g>
  );
}

type MouthStyle = "smile" | "smirk" | "neutral" | "grin";

function Mouth({ style }: { style: MouthStyle }) {
  if (style === "smile") return (
    <path d="M88 138 Q100 147 112 138" fill="none" stroke="#7c3149" strokeWidth={2} strokeLinecap="round" />
  );
  if (style === "smirk") return (
    <path d="M88 140 Q96 145 108 138" fill="none" stroke="#7c3149" strokeWidth={2} strokeLinecap="round" />
  );
  if (style === "neutral") return (
    <line x1={88} y1={140} x2={112} y2={140} stroke="#7c3149" strokeWidth={2} strokeLinecap="round" />
  );
  // grin — open mouth with teeth
  return (
    <g>
      <path d="M84 136 Q100 150 116 136 Q100 155 84 136 Z" fill="#7c3149" />
      <path d="M88 140 Q100 145 112 140" fill="#fff" />
    </g>
  );
}

const EYE_OPTIONS:  { id: EyeStyle;  label: string }[] = [{id:"normal",label:"Normal"},{id:"wide",label:"Wide"},{id:"sleepy",label:"Sleepy"},{id:"cool",label:"Cool"}];
const BROW_OPTIONS: { id: BrowStyle; label: string }[] = [{id:"normal",label:"Normal"},{id:"raised",label:"Raised"},{id:"angry",label:"Angry"},{id:"thick",label:"Thick"}];
const MOUTH_OPTIONS:{ id: MouthStyle;label: string }[] = [{id:"smile",label:"Smile"},{id:"smirk",label:"Smirk"},{id:"neutral",label:"Neutral"},{id:"grin",label:"Big Grin"}];
const HAIR_OPTIONS: { id: HairStyle; label: string }[] = [{id:"short",label:"Short"},{id:"medium",label:"Medium"},{id:"long",label:"Long"},{id:"curly",label:"Curly"}];

export interface AvatarConfig {
  skinTone: string;
  hairStyle: HairStyle;
  eyeStyle: EyeStyle;
  eyebrowStyle: BrowStyle;
  mouthStyle: MouthStyle;
}
interface Props { initialConfig?: AvatarConfig; onSave?: (c: AvatarConfig) => void; }

export default function AvatarFace({ initialConfig, onSave }: Props = {}) {
  const [skin, setSkin]   = useState(SKIN_TONES.find(t => t.id === (initialConfig?.skinTone ?? "medium"))?.hex ?? SKIN_TONES[2].hex);
  const [hair, setHair]   = useState<HairStyle>(initialConfig?.hairStyle   ?? "short");
  const [eyes, setEyes]   = useState<EyeStyle>(initialConfig?.eyeStyle     ?? "normal");
  const [brows, setBrows] = useState<BrowStyle>(initialConfig?.eyebrowStyle ?? "normal");
  const [mouth, setMouth] = useState<MouthStyle>(initialConfig?.mouthStyle  ?? "smile");
  const [toast, setToast] = useState(false);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 200" width={200} height={200}>
        {/* Head (behind hair) */}
        <ellipse cx={100} cy={110} rx={60} ry={72} fill={skin} />
        <rect x={88} y={172} width={24} height={20} rx={6} fill={skin} />
        <ellipse cx={40} cy={112} rx={8} ry={11} fill={skin} />
        <ellipse cx={160} cy={112} rx={8} ry={11} fill={skin} />
        <Eyes style={eyes} />
        <Brows style={brows} />
        <path d="M100 108 Q96 118 99 121 Q100 122 101 121 Q104 118 100 108" fill="none" stroke="#0005" strokeWidth={1.5} strokeLinecap="round" />
        <Mouth style={mouth} />
        {/* Hair on top */}
        <Hair style={hair} />
      </svg>

      {/* Skin swatches */}
      <div className="flex gap-2">
        {SKIN_TONES.map((t) => (
          <button key={t.id} type="button" onClick={() => setSkin(t.hex)}
            className={`h-8 w-8 rounded-full border-2 transition ${skin === t.hex ? "border-violet-500 ring-2 ring-violet-500 ring-offset-1" : "border-gray-600 hover:border-violet-400"}`}
            style={{ backgroundColor: t.hex }} />
        ))}
      </div>

      {/* Eye style selector */}
      <div className="flex gap-2">
        {EYE_OPTIONS.map((e) => (
          <button key={e.id} type="button" onClick={() => setEyes(e.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${eyes === e.id ? "bg-violet-500/20 border-violet-500 text-violet-400" : "border-gray-600 text-gray-400 hover:border-violet-400"}`}>
            {e.label}
          </button>
        ))}
      </div>

      {/* Eyebrow selector */}
      <div className="flex gap-2">
        {BROW_OPTIONS.map((b) => <button key={b.id} type="button" onClick={() => setBrows(b.id)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition ${brows === b.id ? "bg-violet-500/20 border-violet-500 text-violet-400" : "border-gray-600 text-gray-400 hover:border-violet-400"}`}>{b.label}</button>)}
      </div>

      {/* Mouth selector */}
      <div className="flex gap-2">
        {MOUTH_OPTIONS.map((m) => <button key={m.id} type="button" onClick={() => setMouth(m.id)}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition ${mouth === m.id ? "bg-violet-500/20 border-violet-500 text-violet-400" : "border-gray-600 text-gray-400 hover:border-violet-400"}`}>{m.label}</button>)}
      </div>

      {/* Hair style selector */}
      <div className="flex gap-2">
        {HAIR_OPTIONS.map((h) => (
          <button key={h.id} type="button" onClick={() => setHair(h.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition ${hair === h.id ? "bg-violet-500/20 border-violet-500 text-violet-400" : "border-gray-600 text-gray-400 hover:border-violet-400"}`}>
            {h.label}
          </button>
        ))}
      </div>
    </div>
  );
}
