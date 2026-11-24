"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Cpu } from "lucide-react";
import SectionHeader from "./SectionHeader";
import Reveal from "./Reveal";
import { MATERIALS } from "@/lib/data";

export default function Materials() {
  const [idx, setIdx] = useState(0);
  const item = MATERIALS[idx];

  return (
    <section id="materials" className="relative overflow-hidden py-28 md:py-36">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 shine-line" />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader
          kicker="HARDWARE BILL OF MATERIALS · 04"
          title="Every Component,"
          accent="On Record."
          desc="The actual parts powering the build — photographed in the lab, documented with the role each plays in the system."
        />

        <div className="mt-16 grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* ---------- stage ---------- */}
          <Reveal className="order-1">
            <div className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-carbon-900">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={item.id}
                    className="absolute inset-0"
                    initial={{ opacity: 0, scale: 1.06 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-carbon-950/85 via-transparent to-transparent" />

                {/* scan beam accent */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 animate-scan-beam bg-gradient-to-b from-transparent via-volt-400/10 to-transparent" />

                {/* index + role overlay */}
                <div className="absolute left-5 top-5 font-mono text-[10px] tracking-[0.3em] text-volt-300/90">
                  PART {item.index} / {String(MATERIALS.length).padStart(2, "0")}
                </div>
                <div className="absolute bottom-5 left-5 right-5">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="font-mono text-[10px] tracking-[0.28em] text-volt-400">
                        {item.role.toUpperCase()}
                      </div>
                      <div className="font-display mt-1 text-2xl font-bold text-white md:text-3xl">
                        {item.name}
                      </div>
                      <p className="mt-2 max-w-md text-[13px] leading-relaxed text-steel-300">
                        {item.desc}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* stage controls */}
              <div className="mt-5 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setIdx((idx - 1 + MATERIALS.length) % MATERIALS.length)}
                    className="glass flex h-10 w-10 items-center justify-center rounded-lg text-steel-300 transition hover:border-volt-400/40 hover:text-white"
                    aria-label="Previous component"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setIdx((idx + 1) % MATERIALS.length)}
                    className="glass flex h-10 w-10 items-center justify-center rounded-lg text-steel-300 transition hover:border-volt-400/40 hover:text-white"
                    aria-label="Next component"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 font-mono text-[10px] tracking-widest text-steel-500">
                  <Cpu className="h-3.5 w-3.5 text-volt-400" />
                  COMPONENTS BY KURD ELECTRONICS
                </div>
              </div>
            </div>
          </Reveal>

          {/* ---------- index list ---------- */}
          <Reveal className="order-2" delay={0.1}>
            <div className="flex h-full flex-col justify-center">
              {MATERIALS.map((m, i) => {
                const selected = i === idx;
                return (
                  <button
                    key={m.id}
                    onClick={() => setIdx(i)}
                    className={`group flex items-center gap-4 border-b border-white/6 px-3 py-3.5 text-left transition-all duration-300 md:px-4 ${
                      selected ? "bg-volt-400/[0.05]" : "hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`font-mono text-[11px] tracking-widest transition-colors ${
                        selected ? "text-volt-300" : "text-steel-600 group-hover:text-steel-400"
                      }`}
                    >
                      {m.index}
                    </span>
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        selected ? "bg-volt-400 scale-125" : "bg-steel-600 group-hover:bg-steel-400"
                      }`}
                    />
                    <span
                      className={`flex-1 font-display text-[15px] font-medium transition-colors ${
                        selected ? "text-white" : "text-steel-400 group-hover:text-steel-200"
                      }`}
                    >
                      {m.name}
                    </span>
                    <span
                      className={`font-mono text-[9.5px] tracking-[0.2em] transition-all ${
                        selected ? "text-volt-400 opacity-100" : "text-steel-600 opacity-0 group-hover:opacity-70"
                      }`}
                    >
                      {m.role.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
