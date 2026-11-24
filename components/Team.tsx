"use client";

import { GraduationCap } from "lucide-react";
import SectionHeader from "./SectionHeader";
import Reveal from "./Reveal";
import { TEAM } from "@/lib/data";

export default function Team() {
  const supervisor = TEAM.find((t) => t.role === "Supervisor")!;
  const students = TEAM.filter((t) => t.role === "Student");

  return (
    <section id="team" className="relative py-28 md:py-36">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 shine-line" />
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader
          kicker="THE UNIT · 03"
          title="Built By"
          accent="Engineers."
          desc="A collaborative engineering project designed, wired and programmed by the team — under faculty supervision."
          align="center"
        />

        {/* supervisor */}
        <Reveal className="mx-auto mt-16 max-w-md">
          <div className="group relative overflow-hidden rounded-2xl border border-volt-400/25 bg-gradient-to-b from-carbon-850 to-carbon-900 p-8 text-center transition-all duration-500 hover:border-volt-400/50 hover:shadow-[0_0_50px_rgba(76,195,255,0.08)]">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-volt-400/60 to-transparent" />
            <Monogram initials={supervisor.initials} large />
            <div className="mt-5 font-mono text-[10px] tracking-[0.35em] text-volt-400">
              PROJECT SUPERVISOR
            </div>
            <h3 className="font-display mt-2 text-2xl font-bold text-white">
              {supervisor.name}
            </h3>
            <div className="mx-auto mt-3 flex w-max items-center gap-2 rounded-full border border-volt-400/25 bg-volt-400/8 px-3 py-1">
              <GraduationCap className="h-3.5 w-3.5 text-volt-300" />
              <span className="font-mono text-[10px] tracking-widest text-volt-200">
                FACULTY LEAD
              </span>
            </div>
          </div>
        </Reveal>

        {/* students */}
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          {students.map((s, i) => (
            <Reveal key={s.name} delay={i * 0.07}>
              <div className="group relative overflow-hidden rounded-xl border border-white/8 bg-carbon-900/70 p-6 text-center transition-all duration-500 hover:-translate-y-1 hover:border-volt-400/35">
                <Monogram initials={s.initials} />
                <h3 className="font-display mt-4 text-[15px] font-semibold leading-snug text-white">
                  {s.name}
                </h3>
                <div className="mt-1.5 font-mono text-[9.5px] tracking-[0.3em] text-steel-500">
                  STUDENT ENGINEER
                </div>
                <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-volt-400 to-transparent transition-all duration-500 group-hover:w-full" />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Monogram({ initials, large }: { initials: string; large?: boolean }) {
  return (
    <div
      className={`relative mx-auto flex items-center justify-center rounded-full ${
        large ? "h-20 w-20" : "h-14 w-14"
      }`}
    >
      <span className="absolute inset-0 rounded-full border border-volt-400/40 bg-gradient-to-br from-volt-400/15 to-transparent" />
      <span className="absolute inset-[3px] rounded-full border border-white/8 bg-carbon-800" />
      <span
        className={`font-display relative font-bold tracking-wider text-volt-200 ${
          large ? "text-2xl" : "text-lg"
        }`}
      >
        {initials}
      </span>
    </div>
  );
}
