"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function KineticDivider({
  text,
  reverse = false,
}: {
  text: string;
  reverse?: boolean;
}) {
  const track = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (!track.current || !section.current) return;
    const tween = gsap.to(track.current, {
      xPercent: reverse ? 12 : -12,
      ease: "none",
      scrollTrigger: {
        trigger: section.current,
        start: "top bottom",
        end: "bottom top",
        scrub: 1.2,
      },
    });
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [reverse]);

  return (
    <div ref={section} className="relative overflow-hidden py-10 md:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px shine-line" />
      <div
        ref={track}
        className="flex w-max whitespace-nowrap will-change-transform"
        style={{ transform: `translateX(${reverse ? "-12%" : "0%"})` }}
      >
        {[...Array(4)].map((_, i) => (
          <span
            key={i}
            className="font-display flex items-center text-[11vw] font-bold tracking-tight md:text-[7vw]"
          >
            <span className="text-outline px-6">{text}</span>
            <span className="px-6 text-volt-500/80">◆</span>
            <span className="px-6 text-white/90">{text}</span>
            <span className="px-6 text-volt-500/80">◆</span>
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px shine-line" />
    </div>
  );
}
