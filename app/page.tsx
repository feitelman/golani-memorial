"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Nav from "@/components/Nav";

gsap.registerPlugin(useGSAP);

export default function Home() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      // Reduced motion → reveal everything instantly.
      if (reduce) {
        gsap.set(
          ".intro-reticle, .intro-eyebrow, .intro-title-line, .intro-lede, .intro-cta, .intro-foot",
          { opacity: 1, clipPath: "inset(0 0% 0 0)", x: 0, y: 0 },
        );
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 1 — corner reticles draw in
      tl.from(".intro-reticle", {
        opacity: 0,
        scale: 0.4,
        duration: 0.8,
        stagger: 0.08,
        ease: "power2.out",
      })
        // 2 — coordinate readout types in
        .from(
          ".intro-eyebrow",
          { opacity: 0, y: 10, filter: "blur(6px)", duration: 0.7 },
          "-=0.3",
        )
        // 3 — title: signature clip-path wipe upward, line by line
        .from(
          ".intro-title-line",
          {
            clipPath: "inset(0 0 100% 0)",
            y: 40,
            duration: 1.1,
            stagger: 0.14,
            ease: "power4.out",
          },
          "-=0.2",
        )
        // 4 — supporting copy
        .from(".intro-lede", { opacity: 0, y: 16, duration: 0.7 }, "-=0.5")
        // 5 — CTA row + the live red dot
        .from(".intro-cta", { opacity: 0, y: 18, duration: 0.6 }, "-=0.4")
        .from(
          ".intro-foot",
          { opacity: 0, duration: 0.8 },
          "-=0.2",
        );

      // ambient light drift behind the title (loops, gentle)
      gsap.to(".intro-glow", {
        xPercent: 12,
        yPercent: -8,
        scale: 1.12,
        duration: 9,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
      });
    },
    { scope: root },
  );

  return (
    <main ref={root} className="relative min-h-dvh overflow-hidden bg-void">
      <Nav floating />

      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <div className="intro-glow pointer-events-none absolute -bottom-1/3 left-1/2 h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-blood/10 blur-[120px]" />

      <Reticles />

      <section className="relative mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="intro-eyebrow eyebrow">
          <span className="tnum">31.36°N 34.40°E</span> · עוטף עזה
        </p>

        <h1 className="mt-8 text-balance text-5xl font-black leading-[0.95] tracking-tight text-bone sm:text-7xl md:text-8xl">
          <span className="intro-title-line block">קרבות גדוד 13</span>
          <span className="intro-title-line mt-3 block text-2xl font-light text-muted sm:text-3xl">
            חטיבת גולני · 7 באוקטובר 2023
          </span>
        </h1>

        <p className="intro-lede mx-auto mt-10 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
          מפה טקטית אינטראקטיבית המתחקה אחר ההיתקלויות, המארבים, ההגנה והחילוץ
          לאורך גזרת הגדוד באותו בוקר — ואתר הנצחה ללוחמים שנפלו.
        </p>

        <div className="intro-cta mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/map"
            className="group relative inline-flex items-center gap-3 border border-line-strong bg-bone px-8 py-4 text-sm font-bold tracking-wide text-void transition-all hover:bg-white"
          >
            <span className="h-2 w-2 animate-pulse-blood rounded-full bg-blood-bright" />
            כניסה למפה הטקטית
            <span className="transition-transform group-hover:-translate-x-1">←</span>
          </Link>
          <Link
            href="/memorial"
            className="px-6 py-4 text-sm text-muted underline-offset-8 transition-colors hover:text-bone hover:underline"
          >
            לקיר ההנצחה
          </Link>
        </div>

        <div className="intro-foot absolute bottom-8 left-1/2 -translate-x-1/2">
          <p className="eyebrow text-center text-faint">לזכרם · יהי זכרם ברוך</p>
        </div>
      </section>
    </main>
  );
}

function Reticles() {
  const corner = "intro-reticle pointer-events-none absolute h-8 w-8 border-line-strong";
  return (
    <>
      <span className={`${corner} left-6 top-6 border-l border-t`} />
      <span className={`${corner} right-6 top-6 border-r border-t`} />
      <span className={`${corner} bottom-6 left-6 border-b border-l`} />
      <span className={`${corner} bottom-6 right-6 border-b border-r`} />
    </>
  );
}
