"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Radar,
  Rotate3d,
  MousePointer2,
  ZoomIn,
  ChevronDown,
  Loader2,
} from "lucide-react";

const VehicleCanvas = dynamic(() => import("@/components/three/VehicleCanvas"), {
  ssr: false,
  loading: () => <CanvasFallback />,
});

function CanvasFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-carbon-950">
      <Loader2 className="h-6 w-6 animate-spin text-volt-400" />
    </div>
  );
}

export default function Hero() {
  const wrap = useRef<HTMLDivElement>(null);
  const [modelReady, setModelReady] = useState(false);
  const [sensorsOn, setSensorsOn] = useState(true);
  const [interactive, setInteractive] = useState(true);
  const [heroVisible, setHeroVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const [hintDismissed, setHintDismissed] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      wrap.current?.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // pause the WebGL render loop once the hero leaves the viewport
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setHeroVisible(e.isIntersecting), {
      threshold: 0.02,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!hintDismissed) {
      const t = setTimeout(() => setHintDismissed(true), 7000);
      return () => clearTimeout(t);
    }
  }, [hintDismissed]);

  return (
    <section id="vehicle" className="relative h-[100svh] min-h-[560px] w-full">
      <div
        ref={wrap}
        className="absolute inset-0 isolate overflow-hidden bg-carbon-950"
        onDoubleClick={() => setResetSignal((n) => n + 1)}
      >
        <div className="absolute inset-0 z-0">
          <VehicleCanvas
            sensorsOn={sensorsOn}
            interactive={interactive}
            active={heroVisible}
            onReady={() => setModelReady(true)}
            resetSignal={resetSignal}
          />
        </div>

        {/* atmosphere gradients */}
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_top,transparent_45%,rgba(5,7,10,0.72)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-40 bg-gradient-to-t from-carbon-950 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-28 bg-gradient-to-b from-carbon-950/80 to-transparent" />

        {/* ---------- title block ---------- */}
        <div className="pointer-events-none absolute left-6 top-24 z-20 md:left-12 md:top-28 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-10 bg-volt-400/70" />
              <span className="font-mono text-[11px] tracking-[0.3em] text-volt-300">
                AUTONOMOUS PATROL UNIT · 4×4
              </span>
            </div>
            <h1 className="font-display text-[13vw] leading-[0.9] font-bold tracking-tight text-white md:text-[6.2rem]">
              TAHOE
              <span className="block text-outline font-display">PATROL</span>
            </h1>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-steel-300 md:text-base">
              A full-size police pursuit SUV reimagined as an autonomous smart
              robot — triple ultrasonic perception and a five-state avoidance
              brain, all orchestrated by Arduino.
            </p>
          </motion.div>

          <motion.div
            className="pointer-events-auto mt-8 flex flex-wrap items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            <a
              href="#sensors"
              className="group flex items-center gap-2 rounded-full bg-volt-500 px-5 py-2.5 text-sm font-semibold text-carbon-950 transition hover:bg-volt-400"
            >
              Explore Systems
              <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
            </a>
            <a
              href="#code"
              className="glass rounded-full px-5 py-2.5 text-sm font-medium text-steel-200 transition hover:border-volt-400/40 hover:text-white"
            >
              View Firmware
            </a>
          </motion.div>
        </div>

        {/* ---------- spec ticker ---------- */}
        <div className="pointer-events-none absolute left-0 right-0 top-[70px] z-20 hidden overflow-hidden border-y border-white/5 bg-carbon-950/40 py-2 md:block">
          <div className="flex w-max animate-ticker gap-14 whitespace-nowrap font-mono text-[11px] tracking-[0.25em] text-steel-500">
            {[...Array(2)].map((_, k) => (
              <div key={k} className="flex gap-14">
                {[
                  "CHEVROLET TAHOE PLATFORM",
                  "3× HC-SR04 EYES",
                  "ARDUINO UNO CORE",
                  "L298N DUAL CHANNEL",
                  "5-STATE AVOIDANCE",
                  "PWM SPEED FADE",
                  "STEER-BY-MOTOR",
                  "50 CM COLLISION THRESHOLD",
                ].map((s) => (
                  <span key={s} className="flex items-center gap-14">
                    {s}
                    <span className="text-volt-500">◆</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ---------- right-side controls ---------- */}
        <motion.div
          className="absolute right-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2 md:right-8"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <ControlButton
            icon={isFullscreen ? Minimize2 : Maximize2}
            label={isFullscreen ? "Exit fullscreen" : "Fullscreen inspection"}
            onClick={toggleFullscreen}
          />
          <ControlButton
            icon={RotateCcw}
            label="Reset camera"
            onClick={() => setResetSignal((n) => n + 1)}
          />
          <ControlButton
            icon={Radar}
            label="Ultrasonic field"
            active={sensorsOn}
            onClick={() => setSensorsOn((v) => !v)}
          />
          <ControlButton
            icon={Rotate3d}
            label={interactive ? "3D interaction on — tap to scroll page" : "Page scroll on — tap to control car"}
            active={interactive}
            onClick={() => setInteractive((v) => !v)}
          />
        </motion.div>

        {/* ---------- interaction hints ---------- */}
        <AnimatePresence>
          {!hintDismissed && modelReady && (
            <motion.div
              className="pointer-events-none absolute bottom-24 left-1/2 z-30 flex -translate-x-1/2 items-center gap-5 rounded-full glass px-5 py-2.5 md:bottom-10"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.6 }}
            >
              <Hint icon={MousePointer2} text="Drag to orbit" />
              <span className="h-3 w-px bg-white/10" />
              <Hint icon={ZoomIn} text="Scroll to zoom" />
              <span className="h-3 w-px bg-white/10" />
              <span className="font-mono text-[10px] tracking-widest text-steel-400">
                DOUBLE-CLICK TO RESET
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---------- loading veil ---------- */}
        <AnimatePresence>
          {!modelReady && (
            <motion.div
              className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-carbon-950"
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Loader2 className="h-6 w-6 animate-spin text-volt-400" />
              <span className="font-mono text-[11px] tracking-[0.3em] text-steel-500">
                LOADING PATROL UNIT
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* scroll cue */}
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 md:block">
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center gap-1.5"
          >
            <span className="font-mono text-[9px] tracking-[0.35em] text-steel-500">
              SCROLL
            </span>
            <span className="h-6 w-px bg-gradient-to-b from-volt-400/70 to-transparent" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ControlButton({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: typeof Maximize2;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`glass group relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${
        active === undefined
          ? "text-steel-300 hover:text-white hover:border-volt-400/40"
          : active
            ? "border-volt-400/50 text-volt-300 shadow-[0_0_18px_rgba(76,195,255,0.18)]"
            : "text-steel-500 hover:text-steel-200"
      }`}
    >
      <Icon className="h-[18px] w-[18px]" />
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-md bg-carbon-800 px-2.5 py-1 font-mono text-[10px] tracking-wider text-steel-200 opacity-0 transition-opacity group-hover:opacity-100 md:block">
        {label}
      </span>
    </button>
  );
}

function Hint({ icon: Icon, text }: { icon: typeof MousePointer2; text: string }) {
  return (
    <span className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-volt-400" />
      <span className="text-[11px] text-steel-300">{text}</span>
    </span>
  );
}
