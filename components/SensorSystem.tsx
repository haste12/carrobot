"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Radar, ArrowUp, ArrowLeft, ArrowRight, TriangleAlert } from "lucide-react";
import SectionHeader from "./SectionHeader";
import Reveal from "./Reveal";

const THRESHOLD = 50; // cm — matches firmware OBSTACLE_THRESHOLD

interface SensorChannel {
  id: string;
  label: string;
  icon: typeof ArrowUp;
  angle: number; // pointing direction in radians (SVG coords: 0 = +x, CCW+)
  origin: [number, number];
  spread: number; // half-angle of the detection wedge
  desc: string;
}

const CHANNELS: SensorChannel[] = [
  {
    id: "front",
    label: "FRONT",
    icon: ArrowUp,
    angle: -Math.PI / 2,
    origin: [300, 168],
    spread: Math.PI / 6,
    desc: "Primary forward ranger — drives the collision-avoid decision every loop cycle.",
  },
  {
    id: "left",
    label: "LEFT",
    icon: ArrowLeft,
    angle: Math.PI,
    origin: [212, 320],
    spread: Math.PI / 7,
    desc: "Port-side sweep — queried by the firmware when the front path is blocked.",
  },
  {
    id: "right",
    label: "RIGHT",
    icon: ArrowRight,
    angle: 0,
    origin: [388, 320],
    spread: Math.PI / 7,
    desc: "Starboard sweep — compared against the left reading to pick the widest exit.",
  },
];

/* deterministic-ish pseudo random walk for live feel */
function useDistances(active: boolean) {
  const [d, setD] = useState({ front: 148, left: 122, right: 136 });
  useEffect(() => {
    if (!active) return;
    const iv = setInterval(() => {
      setD((p) => {
        const walk = (v: number, min: number, max: number) =>
          Math.max(min, Math.min(max, v + (Math.random() - 0.5) * 46));
        const next = {
          front: walk(p.front, 18, 240),
          left: walk(p.left, 30, 240),
          right: walk(p.right, 30, 240),
        };
        // bias back toward open space
        if (Math.random() < 0.25) {
          const k = (["front", "left", "right"] as const)[Math.floor(Math.random() * 3)];
          next[k] = 90 + Math.random() * 150;
        }
        return next;
      });
    }, 900);
    return () => clearInterval(iv);
  }, [active]);
  return d;
}

export default function SensorSystem() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-20% 0px", once: false });
  const distances = useDistances(inView);

  return (
    <section id="sensors" className="relative overflow-hidden py-28 md:py-36">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 shine-line" />

      <div ref={ref} className="relative mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader
          kicker="PERCEPTION ARRAY · 02"
          title="Tri-Vector"
          accent="Ultrasonic"
          desc="Three ultrasonic channels cover the vehicle's front, front-left and front-right sectors. Echo return times become centimetre-accurate ranges — the raw perception feeding every autonomous decision."
        />

        <div className="mt-16 grid items-center gap-12 lg:grid-cols-5 lg:gap-8">
          {/* ------- channel readouts ------- */}
          <div className="order-2 space-y-4 lg:order-1 lg:col-span-2">
            {CHANNELS.map((c, i) => {
              const dist = Math.round(distances[c.id as keyof typeof distances]);
              const alert = dist < THRESHOLD;
              const pct = Math.min(100, (dist / 250) * 100);
              return (
                <Reveal key={c.id} delay={i * 0.1}>
                  <div
                    className={`group relative overflow-hidden rounded-xl border p-5 transition-all duration-500 ${
                      alert
                        ? "border-flare-red/40 bg-flare-red/[0.04]"
                        : "border-white/8 bg-carbon-900/60 hover:border-volt-400/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                            alert
                              ? "border-flare-red/50 bg-flare-red/10 text-flare-red"
                              : "border-volt-400/30 bg-volt-400/8 text-volt-300"
                          }`}
                        >
                          <c.icon className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="font-mono text-[10px] tracking-[0.25em] text-steel-500">
                            US-{c.label}
                          </div>
                          <div className="font-display text-sm font-semibold text-white">
                            {c.label} SENSOR
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-display text-2xl font-bold tabular-nums transition-colors ${
                            alert ? "text-flare-red" : "text-volt-300"
                          }`}
                        >
                          {dist}
                          <span className="ml-1 text-xs font-normal text-steel-500">cm</span>
                        </div>
                        <div
                          className={`font-mono text-[9px] tracking-[0.2em] ${
                            alert ? "text-flare-red" : "text-steel-500"
                          }`}
                        >
                          {alert ? "⚠ OBSTACLE" : "CLEAR"}
                        </div>
                      </div>
                    </div>
                    <p className="mt-3 text-[12.5px] leading-relaxed text-steel-400">
                      {c.desc}
                    </p>
                    {/* range bar */}
                    <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/6">
                      <motion.div
                        className={`h-full rounded-full ${alert ? "bg-flare-red" : "bg-volt-400"}`}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: "easeOut" }}
                      />
                    </div>
                    {/* threshold marker */}
                    <div className="relative -mt-1 h-0">
                      <div
                        className="absolute top-[-3px] h-[7px] w-px bg-white/30"
                        style={{ left: `${(THRESHOLD / 250) * 100}%` }}
                      />
                    </div>
                  </div>
                </Reveal>
              );
            })}

            <Reveal delay={0.35}>
              <div className="flex items-center gap-3 rounded-xl border border-white/8 bg-carbon-900/40 px-5 py-4">
                <TriangleAlert className="h-4 w-4 shrink-0 text-volt-400" />
                <p className="font-mono text-[10.5px] leading-relaxed tracking-wide text-steel-400">
                  FIRMWARE THRESHOLD — <span className="text-volt-300">50 CM</span>.
                  ANY ECHO CLOSER TRIGGERS THE AVOIDANCE ROUTINE.
                </p>
              </div>
            </Reveal>
          </div>

          {/* ------- radar diagram ------- */}
          <Reveal className="order-1 lg:order-2 lg:col-span-3" delay={0.15}>
            <div className="relative mx-auto max-w-[560px]">
              <RadarDiagram distances={distances} live={inView} />
              <div className="pointer-events-none absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-steel-500">
                <Radar className="h-3 w-3 text-volt-400" />
                LIVE ECHO SIMULATION · TOP VIEW
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------- SVG radar ------------------------- */

const CX = 300;
const WEDGE_RANGE = 235;

function polar(cx: number, cy: number, r: number, a: number): [number, number] {
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function wedgePath(cx: number, cy: number, r: number, a: number, half: number) {
  const [x0, y0] = polar(cx, cy, r, a - half);
  const [x1, y1] = polar(cx, cy, r, a + half);
  return `M ${cx} ${cy} L ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)} Z`;
}

function arcPath(cx: number, cy: number, r: number, a: number, half: number) {
  const [x0, y0] = polar(cx, cy, r, a - half);
  const [x1, y1] = polar(cx, cy, r, a + half);
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} A ${r} ${r} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

function RadarDiagram({
  distances,
  live,
}: {
  distances: { front: number; left: number; right: number };
  live: boolean;
}) {
  const [t, setT] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (!live) return;
    const start = performance.now();
    const loop = () => {
      setT((performance.now() - start) / 1000);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [live]);

  return (
    <svg
      viewBox="0 0 600 640"
      className="w-full"
      role="img"
      aria-label="Top-down ultrasonic detection diagram"
    >
      <defs>
        <radialGradient id="fanGrad" cx="0" cy="0" r="1">
          <stop offset="0%" stopColor="#4cc3ff" stopOpacity="0.30" />
          <stop offset="60%" stopColor="#1da8f2" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#1da8f2" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1c2530" />
          <stop offset="55%" stopColor="#141a22" />
          <stop offset="100%" stopColor="#0d1218" />
        </linearGradient>
        <filter id="glowF" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* backdrop rings */}
      {[120, 200, 280].map((r) => (
        <circle
          key={r}
          cx={CX}
          cy={330}
          r={r}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.045"
          strokeDasharray="3 7"
        />
      ))}

      {/* detection wedges */}
      {CHANNELS.map((c) => {
        const dist = distances[c.id as keyof typeof distances];
        const alert = dist < THRESHOLD;
        return (
          <g key={c.id}>
            <path
              d={wedgePath(c.origin[0], c.origin[1], WEDGE_RANGE, c.angle, c.spread)}
              fill="url(#fanGrad)"
              stroke={alert ? "#ff3d55" : "#4cc3ff"}
              strokeOpacity={alert ? 0.5 : 0.22}
              strokeWidth="1"
            />
            {/* expanding echo rings */}
            {[0, 1, 2].map((i) => {
              const cycle = (((t * 0.5 + i * 0.333) % 1) + 1) % 1;
              const r = 26 + cycle * (WEDGE_RANGE - 30);
              return (
                <path
                  key={i}
                  d={arcPath(c.origin[0], c.origin[1], r, c.angle, c.spread * 0.92)}
                  fill="none"
                  stroke={alert ? "#ff3d55" : "#4cc3ff"}
                  strokeOpacity={(1 - cycle) * 0.65}
                  strokeWidth={1.6 - cycle}
                  strokeLinecap="round"
                />
              );
            })}
            {/* range rings inside wedge */}
            {[80, 150].map((r) => (
              <path
                key={r}
                d={arcPath(c.origin[0], c.origin[1], r, c.angle, c.spread)}
                fill="none"
                stroke="#4cc3ff"
                strokeOpacity="0.1"
                strokeDasharray="2 6"
              />
            ))}
            {/* obstacle blip at measured distance */}
            {alert &&
              (() => {
                const rr = Math.max(30, (dist / 250) * WEDGE_RANGE);
                const [bx, by] = polar(c.origin[0], c.origin[1], rr, c.angle);
                return (
                  <g filter="url(#glowF)">
                    <circle cx={bx} cy={by} r="5" fill="#ff3d55" />
                    <circle
                      cx={bx}
                      cy={by}
                      r={5 + ((t * 8) % 10)}
                      fill="none"
                      stroke="#ff3d55"
                      strokeOpacity={1 - ((t * 8) % 10) / 10}
                    />
                  </g>
                );
              })()}
            {/* emitter dot */}
            <circle
              cx={c.origin[0]}
              cy={c.origin[1]}
              r="4"
              fill="#7fdcff"
              filter="url(#glowF)"
            />
          </g>
        );
      })}

      {/* vehicle silhouette — top view */}
      <g>
        <path
          d="M 238 175
             Q 226 185 224 205
             L 220 250 Q 218 268 222 285
             L 224 430 Q 224 470 250 482
             L 265 488 Q 300 496 335 488
             L 350 482 Q 376 470 376 430
             L 378 285 Q 382 268 380 250
             L 376 205 Q 374 185 362 175
             Q 340 160 300 160 Q 260 160 238 175 Z"
          fill="url(#carBody)"
          stroke="#3d4a5c"
          strokeWidth="1.4"
        />
        {/* cabin glass */}
        <path
          d="M 248 235 L 352 235 Q 356 235 356 245 L 354 268 Q 354 276 346 276 L 254 276 Q 246 276 246 268 L 244 245 Q 244 235 248 235 Z"
          fill="#0a0f16"
          stroke="#2c3947"
          strokeWidth="1"
        />
        <path
          d="M 252 380 L 348 380 Q 352 380 352 390 L 352 420 Q 352 432 340 432 L 260 432 Q 248 432 248 420 L 248 390 Q 248 380 252 380 Z"
          fill="#0a0f16"
          stroke="#2c3947"
          strokeWidth="1"
        />
        {/* light bar */}
        <rect x="256" y="208" width="88" height="10" rx="5" fill="#101820" stroke="#2c3947" />
        <rect x="258" y="210" width="42" height="6" rx="3" fill="#ff3d55" opacity="0.75" />
        <rect x="300" y="210" width="42" height="6" rx="3" fill="#3d8bff" opacity="0.75" />
        {/* wheels */}
        {[
          [228, 300],
          [372, 300],
          [228, 428],
          [372, 428],
        ].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x - 7} y={y - 16} width="14" height="32" rx="6" fill="#05070a" stroke="#242c38" />
        ))}
        {/* direction arrow */}
        <path d={`M ${CX} 148 l 7 12 h -14 Z`} fill="#4cc3ff" opacity="0.8" />
      </g>

      {/* sensor labels */}
      {CHANNELS.map((c) => {
        const [lx, ly] = polar(c.origin[0], c.origin[1], WEDGE_RANGE + 24, c.angle);
        return (
          <text
            key={c.id}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-steel-400"
            style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.25em" }}
          >
            US-{c.label[0]}
          </text>
        );
      })}
    </svg>
  );
}
