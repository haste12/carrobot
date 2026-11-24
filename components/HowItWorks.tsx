"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Radar, ScanSearch, Cpu, Zap, RotateCw, Bot } from "lucide-react";
import SectionHeader from "./SectionHeader";
import { PROCESS_STEPS } from "@/lib/data";

const ICONS = [Radar, ScanSearch, Cpu, Zap, RotateCw, Bot];

export default function HowItWorks() {
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: track,
    offset: ["start 0.82", "end 0.45"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 60, damping: 20 });
  const lineWidth = useTransform(progress, [0, 1], ["0%", "100%"]);

  return (
    <section id="system" className="relative overflow-hidden py-28 md:py-36">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 shine-line" />

      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader
          kicker="CONTROL PIPELINE · 05"
          title="From Echo"
          accent="To Action."
          desc="One closed loop runs continuously inside the UNO — sense, decide, actuate — dozens of times per second."
          align="center"
        />

        <div ref={track} className="relative mt-20">
          {/* progress rail (desktop) */}
          <div className="absolute left-0 right-0 top-[26px] hidden h-px bg-white/8 lg:block" />
          <motion.div
            className="absolute left-0 top-[26px] hidden h-px bg-gradient-to-r from-volt-600 via-volt-400 to-volt-300 shadow-[0_0_12px_rgba(76,195,255,0.5)] lg:block"
            style={{ width: lineWidth }}
          />

          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
            {PROCESS_STEPS.map((s, i) => {
              const Icon = ICONS[i];
              return (
                <Step key={s.index} step={s} Icon={Icon} index={i} />
              );
            })}
          </div>
        </div>

        {/* firmware note */}
        <motion.div
          className="glass mx-auto mt-16 flex max-w-3xl items-start gap-4 rounded-xl p-5"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <Cpu className="mt-0.5 h-5 w-5 shrink-0 text-volt-400" />
          <p className="text-[13px] leading-relaxed text-steel-300">
            <span className="font-mono text-[11px] tracking-widest text-volt-300">
              FIRMWARE NOTE ·{" "}
            </span>
            The full loop lives in <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[11px] text-volt-200">loop()</code> — a five-state machine (STARTUP → FORWARD → BRAKE → REVERSE → TURN) fed by{" "}
            <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[11px] text-volt-200">pingEye()</code> and steered through{" "}
            <code className="rounded bg-white/8 px-1.5 py-0.5 font-mono text-[11px] text-volt-200">pickEscapeDir()</code>.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Step({
  step,
  Icon,
  index,
}: {
  step: { index: string; title: string; desc: string };
  Icon: typeof Radar;
  index: number;
}) {
  return (
    <motion.div
      className="relative flex flex-col items-center text-center lg:items-start lg:text-left"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* node */}
      <div className="relative z-10 flex h-[52px] w-[52px] items-center justify-center">
        <span className="absolute inset-0 rounded-2xl border border-volt-400/30 bg-carbon-900" />
        <span className="absolute inset-0 rounded-2xl border border-volt-400/15 animate-pulse-dot" />
        <Icon className="relative h-5 w-5 text-volt-300" strokeWidth={1.7} />
      </div>

      <div className="mt-5 font-mono text-[10px] tracking-[0.3em] text-volt-500">
        {step.index}
      </div>
      <h3 className="font-display mt-1.5 text-[15px] font-semibold text-white">
        {step.title}
      </h3>
      <p className="mt-2 text-[12px] leading-relaxed text-steel-400">
        {step.desc}
      </p>
    </motion.div>
  );
}
