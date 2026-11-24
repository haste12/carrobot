"use client";

import { useMemo, useState } from "react";
import { Copy, Check, Download, FileCode2, Info } from "lucide-react";
import SectionHeader from "./SectionHeader";
import Reveal from "./Reveal";
import { ARDUINO_CODE, ARDUINO_FILENAME } from "@/lib/arduino";
import { highlightLine, TOKEN_COLORS } from "@/lib/highlight";

export default function CodeSection() {
  const [copied, setCopied] = useState(false);

  const lines = useMemo(() => ARDUINO_CODE.split("\n"), []);
  const highlighted = useMemo(() => lines.map(highlightLine), [lines]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ARDUINO_CODE);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = ARDUINO_CODE;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="code" className="relative py-28 md:py-36">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-30" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 shine-line" />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader
          kicker="FIRMWARE · 07"
          title="The Brain,"
          accent="In C++."
          desc="The complete Arduino firmware driving the patrol unit — pin maps, mode logic, the avoidance state machine and every motor primitive. This is the exact code running on the robot."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-3">
          {/* ------- explanation ------- */}
          <Reveal className="lg:col-span-1">
            <div className="space-y-5">
              <ExplPoint
                title="Pin Architecture"
                body="L298N dual channel — rear drive motor on ENA/IN1/IN2 (pins 5/7/8), spring-return steering motor on ENB/IN3/IN4 (pins 6/9/4). All six HC-SR04 trig/echo lines live on A0–A5 used as digital pins."
              />
              <ExplPoint
                title="Five-State Machine"
                body="STARTUP waits for a clear front, then cycles FORWARD → BRAKE → REVERSE → TURN. A reverse kick and hard brake stop the car before pickEscapeDir() compares the side eyes and commits to the wider exit."
              />
              <ExplPoint
                title="Smart Ranging"
                body="The front eye pings every loop while side eyes alternate behind a 5 ms anti-crosstalk gap — and a missed echo must repeat twice before open space is trusted. Speed fades smoothly from cruise between 100 cm and 50 cm."
              />
              <div className="flex items-start gap-3 rounded-xl border border-white/8 bg-carbon-900/50 p-4">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-volt-400" />
                <p className="font-mono text-[10.5px] leading-relaxed tracking-wide text-steel-400">
                  {lines.length} LINES · C++ / ARDUINO · SERIAL @ 115200 BAUD
                </p>
              </div>
            </div>
          </Reveal>

          {/* ------- editor ------- */}
          <Reveal className="lg:col-span-2" delay={0.12}>
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#070a0f] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]">
              {/* titlebar */}
              <div className="flex items-center justify-between border-b border-white/8 bg-carbon-900/80 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="ml-2 flex items-center gap-2">
                    <FileCode2 className="h-3.5 w-3.5 text-volt-400" />
                    <span className="font-mono text-[11px] text-steel-300">
                      {ARDUINO_FILENAME}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden rounded border border-white/10 px-2 py-0.5 font-mono text-[9px] tracking-widest text-steel-500 sm:block">
                    C++ / ARDUINO
                  </span>
                  <button
                    onClick={copy}
                    className="flex items-center gap-1.5 rounded-lg border border-volt-400/30 bg-volt-400/10 px-3 py-1.5 font-mono text-[10.5px] tracking-wider text-volt-200 transition hover:bg-volt-400/20"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3" /> COPIED
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" /> COPY
                      </>
                    )}
                  </button>
                  <a
                    href={`/firmware/${ARDUINO_FILENAME}`}
                    download={ARDUINO_FILENAME}
                    className="flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-1.5 font-mono text-[10.5px] tracking-wider text-steel-300 transition hover:border-volt-400/40 hover:text-white"
                  >
                    <Download className="h-3 w-3" /> .INO
                  </a>
                </div>
              </div>

              {/* code body */}
              <div className="max-h-[560px] overflow-auto">
                <pre className="flex min-w-max px-0 py-4 text-[12.5px] leading-[1.7]">
                  <div
                    aria-hidden
                    className="sticky left-0 select-none border-r border-white/6 bg-[#070a0f] px-4 text-right font-mono text-steel-600"
                  >
                    {lines.map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  <code className="block flex-1 px-5 font-mono">
                    {highlighted.map((tokens, i) => (
                      <div key={i} className="whitespace-pre">
                        {tokens.length === 0
                          ? " "
                          : tokens.map((t, j) => (
                              <span key={j} style={{ color: TOKEN_COLORS[t.cls] }}>
                                {t.text}
                              </span>
                            ))}
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ExplPoint({ title, body }: { title: string; body: string }) {
  return (
    <div className="border-l-2 border-volt-400/40 pl-4">
      <h3 className="font-display text-[15px] font-semibold text-white">{title}</h3>
      <p className="mt-1.5 text-[13px] leading-relaxed text-steel-400">{body}</p>
    </div>
  );
}
