"use client";

import { motion } from "framer-motion";

export default function SectionHeader({
  kicker,
  title,
  accent,
  desc,
  align = "left",
}: {
  kicker: string;
  title: string;
  accent?: string;
  desc?: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "text-center" : ""}>
      <motion.div
        className={`flex items-center gap-3 ${align === "center" ? "justify-center" : ""}`}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="h-px w-10 bg-volt-400/70" />
        <span className="font-mono text-[11px] tracking-[0.3em] text-volt-300">
          {kicker}
        </span>
      </motion.div>
      <motion.h2
        className="font-display mt-4 text-4xl font-bold tracking-tight text-white md:text-6xl"
        initial={{ opacity: 0, y: 26 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
      >
        {title}
        {accent && <span className="text-volt-400"> {accent}</span>}
      </motion.h2>
      {desc && (
        <motion.p
          className={`mt-5 max-w-2xl text-sm leading-relaxed text-steel-400 md:text-base ${
            align === "center" ? "mx-auto" : ""
          }`}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          {desc}
        </motion.p>
      )}
    </div>
  );
}
