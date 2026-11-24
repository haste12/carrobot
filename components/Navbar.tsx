"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Menu, X } from "lucide-react";

const LINKS = [
  { href: "#vehicle", label: "Vehicle" },
  { href: "#sensors", label: "Sensors" },
  { href: "#materials", label: "Components" },
  { href: "#system", label: "System" },
  { href: "#team", label: "Team" },
  { href: "#code", label: "Firmware" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("vehicle");

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        setScrolled(window.scrollY > 40);
        // track active section
        let current = "vehicle";
        for (const l of LINKS) {
          const el = document.getElementById(l.href.slice(1));
          if (el && el.getBoundingClientRect().top <= 140) current = l.href.slice(1);
        }
        setActive(current);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <motion.header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
          scrolled ? "glass py-3" : "bg-transparent py-5"
        }`}
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 md:px-8">
          <a href="#vehicle" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-volt-400/40 bg-volt-400/10">
              <Shield className="h-4 w-4 text-volt-300" />
            </span>
            <span className="font-display text-sm font-bold tracking-[0.22em] text-white">
              TAHOE<span className="text-volt-400">PATROL</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 lg:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`relative font-mono text-[11px] tracking-[0.18em] transition-colors ${
                  active === l.href.slice(1)
                    ? "text-volt-300"
                    : "text-steel-400 hover:text-white"
                }`}
              >
                {l.label.toUpperCase()}
                {active === l.href.slice(1) && (
                  <motion.span
                    layoutId="nav-dot"
                    className="absolute -bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-volt-400"
                  />
                )}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#code"
              className="hidden rounded-full border border-volt-400/40 px-4 py-1.5 font-mono text-[11px] tracking-widest text-volt-300 transition hover:bg-volt-400/10 md:block"
            >
              .INO
            </a>
            <button
              className="glass flex h-9 w-9 items-center justify-center rounded-lg text-steel-200 lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-carbon-950/95 backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <nav className="flex h-full flex-col items-center justify-center gap-7">
              {LINKS.map((l, i) => (
                <motion.a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="font-display text-2xl font-semibold text-steel-200 transition hover:text-volt-300"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  {l.label}
                </motion.a>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
