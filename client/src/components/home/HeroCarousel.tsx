"use client";

import Image from "next/image";
import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/Button";

export interface HeroSlide {
  id: string;
  brand: string;
  headline: string;
  support: string;
  ctaLabel: string;
  ctaHref: string;
  imageSrc: string;
  imageAlt: string;
}

interface HeroCarouselProps {
  slides: HeroSlide[];
  compact?: boolean;
}

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroCarousel({ slides, compact = false }: HeroCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const slide = slides[index];

  const goTo = useCallback(
    (next: number) => {
      setIndex((next + slides.length) % slides.length);
    },
    [slides.length]
  );

  useEffect(() => {
    if (paused || reduceMotion || slides.length <= 1) return;
    const id = window.setInterval(() => goTo(index + 1), 7000);
    return () => window.clearInterval(id);
  }, [goTo, index, paused, reduceMotion, slides.length]);

  if (!slide) return null;

  return (
    <section
      className={`relative isolate overflow-hidden bg-cocoa-dark ${
        compact ? "h-full min-h-0" : "min-h-[min(88vh,820px)]"
      }`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured promotions"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={slide.id}
          className="absolute inset-0"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={{ duration: 1, ease }}
        >
          <motion.div
            className="absolute inset-0"
            initial={reduceMotion ? false : { scale: 1.06 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: "linear" }}
          >
            <Image
              src={slide.imageSrc}
              alt={slide.imageAlt}
              fill
              priority={index === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
          <div
            className="absolute inset-0 bg-gradient-to-r from-cocoa-dark/92 via-cocoa-dark/55 to-cocoa-dark/20"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-cocoa-dark/80 via-transparent to-cocoa-dark/35"
            aria-hidden
          />
          <div
            className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
            aria-hidden
          />
        </motion.div>
      </AnimatePresence>

      {/* Floating atmosphere */}
      <div
        className="pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-caramel/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-10 bottom-10 h-48 w-48 rounded-full bg-honey/20 blur-3xl"
        aria-hidden
      />

      <div
        className={`relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-end px-6 ${
          compact
            ? "pb-8 pt-24 sm:justify-center sm:pb-10 sm:pt-20"
            : "min-h-[min(88vh,820px)] pb-14 pt-28 sm:justify-center sm:pb-20 sm:pt-24"
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={slide.id + "-copy"}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
            transition={{ duration: 0.65, ease }}
            className="max-w-6xl"
          >
            <BrandLogo size={compact ? "md" : "lg"} href={null} />
            <h1
              className={`mt-5 font-display font-medium leading-[1.08] tracking-tight text-cream text-balance ${
                compact
                  ? "text-[2.1rem] sm:text-4xl lg:text-7xl"
                  : "text-[2.65rem] sm:text-5xl lg:text-[3.75rem]"
              }`}
            >
              {slide.headline}
            </h1>
            <p
              className={`mt-4 max-w-md leading-relaxed text-honey-light/85 ${
                compact ? "text-sm sm:text-[15px]" : "text-[15px] sm:text-base"
              }`}
            >
              {slide.support}
            </p>
            <div className={`flex flex-wrap items-center gap-4 ${compact ? "mt-6" : "mt-9"}`}>
              <Link href={slide.ctaHref}>
                <Button className="px-7 py-3 text-[13px] tracking-[0.06em]">
                  {slide.ctaLabel}
                </Button>
              </Link>
              <Link
                href="/about"
                className="group inline-flex items-center gap-2 border-b border-cream/25 pb-0.5 text-[13px] tracking-[0.06em] text-cream/90 transition-colors duration-300 hover:border-honey hover:text-honey"
              >
                Our story
                <span
                  aria-hidden
                  className="transition-transform duration-300 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {slides.length > 1 && (
          <div className={`flex items-end gap-6 ${compact ? "mt-8" : "mt-14 sm:mt-16"}`}>
            <div className="flex gap-2.5" role="tablist" aria-label="Slides">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  className="group relative h-8 w-10"
                >
                  <span className="absolute bottom-0 left-0 h-px w-full bg-cream/20 transition-colors duration-300 group-hover:bg-cream/40" />
                  {i === index && (
                    <motion.span
                      className="absolute bottom-0 left-0 h-px bg-honey"
                      initial={reduceMotion ? { width: "100%" } : { width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { duration: 7, ease: "linear" }
                      }
                    />
                  )}
                  <span
                    className={`absolute bottom-2 left-0 font-display text-[10px] tracking-[0.2em] ${
                      i === index ? "text-honey" : "text-cream/40"
                    }`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </button>
              ))}
            </div>
            <div className="ml-auto hidden gap-2 sm:flex">
              <HeroNavButton
                label="Previous slide"
                onClick={() => goTo(index - 1)}
              >
                <path d="M15 18l-6-6 6-6" />
              </HeroNavButton>
              <HeroNavButton
                label="Next slide"
                onClick={() => goTo(index + 1)}
              >
                <path d="M9 18l6-6-6-6" />
              </HeroNavButton>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function HeroNavButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-cream/20 text-cream/80 transition-all duration-300 hover:border-honey/60 hover:text-honey"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {children}
      </svg>
    </button>
  );
}
