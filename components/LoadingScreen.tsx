"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProgress } from "@react-three/drei";
import { Shield } from "lucide-react";

export default function LoadingScreen() {
  const { progress } = useProgress();
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);
  const start = useRef(performance.now());
  const raf = useRef(0);

  useEffect(() => {
    const tick = () => {
      const elapsed = performance.now() - start.current;
      const timeFloor = Math.min(1, elapsed / 900) * 100;
      const target = Math.max(progress, timeFloor);
      setDisplay((d) => {
        const next = d + (target - d) * 0.12;
        return next > 99.2 ? 100 : next;
      });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [progress]);

  useEffect(() => {
    if (display >= 100) {
      const t = setTimeout(() => setDone(true), 450);
      return () => clearTimeout(t);
    }
  }, [display]);

  // stop the animation loop once the screen is dismissed
  useEffect(() => {
    if (done) cancelAnimationFrame(raf.current);
  }, [done]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-carbon-950"
          exit={{ opacity: 0, filter: "blur(6px)" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="relative mb-6 flex h-16 w-16 items-center justify-center">
              <span className="absolute inset-0 rounded-2xl border border-volt-400/30 bg-volt-400/5" />
              <span className="absolute inset-0 rounded-2xl border border-volt-400/20 animate-ping-ring" />
              <Shield className="h-7 w-7 text-volt-300" />
            </div>
            <div className="font-display text-xl font-bold tracking-[0.3em] text-white">
              TAHOE<span className="text-volt-400">PATROL</span>
            </div>
            <div className="mt-1 font-mono text-[10px] tracking-[0.4em] text-steel-500">
              AUTONOMOUS SYSTEMS BOOT
            </div>

            <div className="mt-8 h-px w-56 overflow-hidden bg-white/10">
              <motion.div
                className="h-full bg-gradient-to-r from-volt-600 to-volt-300"
                style={{ width: `${display}%` }}
              />
            </div>
            <div className="mt-3 flex w-56 items-center justify-between font-mono text-[10px] tracking-widest text-steel-500">
              <span>{display < 100 ? "INITIALIZING" : "READY"}</span>
              <span className="text-volt-400">{Math.round(display)}%</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
