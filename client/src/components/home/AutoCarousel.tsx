"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useReducedMotion } from "framer-motion";

interface AutoCarouselProps {
  children: ReactNode[];
  ariaLabel: string;
  intervalMs?: number;
}

function useItemsPerView() {
  const [count, setCount] = useState(1);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024) setCount(3);
      else if (w >= 640) setCount(2);
      else setCount(1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

export function AutoCarousel({
  children,
  ariaLabel,
  intervalMs = 4200,
}: AutoCarouselProps) {
  const items = children;
  const itemsPerView = useItemsPerView();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [itemWidth, setItemWidth] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const gap = 24;

  const maxIndex = Math.max(0, items.length - itemsPerView);
  const stepPx = itemWidth > 0 ? itemWidth + gap : 0;

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const measure = () => {
      const available = viewport.clientWidth;
      const width = (available - (itemsPerView - 1) * gap) / itemsPerView;
      // Floor to avoid sub-pixel overflow that peeks the next card
      setItemWidth(Math.max(0, Math.floor(width)));
    };

    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const ro = new ResizeObserver(measure);
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [items.length, itemsPerView, gap]);

  const go = useCallback(
    (next: number) => {
      if (maxIndex === 0) {
        setIndex(0);
        return;
      }
      const wrapped =
        ((next % (maxIndex + 1)) + (maxIndex + 1)) % (maxIndex + 1);
      setIndex(wrapped);
    },
    [maxIndex]
  );

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    }
  };

  useEffect(() => {
    if (paused || reduceMotion || items.length <= itemsPerView) return;
    const id = window.setInterval(() => go(index + 1), intervalMs);
    return () => window.clearInterval(id);
  }, [
    go,
    index,
    intervalMs,
    items.length,
    itemsPerView,
    paused,
    reduceMotion,
  ]);

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Top gap (header → cards) + clip + bottom gap (cards → dots) */}
      <div className="pt-2 sm:pt-4 md:-mt-20 md:-mb-10">
        <div
          ref={viewportRef}
          role="region"
          aria-label={`${ariaLabel} carousel. Use the left and right arrow keys to browse product groups.`}
          aria-roledescription="carousel"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          className="overflow-hidden py-10 outline-none focus-visible:ring-2 focus-visible:ring-caramel/40 sm:py-12"
        >
          <div
            className="flex will-change-transform transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              gap,
              width: itemWidth > 0 ? itemWidth * items.length + gap * (items.length - 1) : "100%",
              transform:
                stepPx > 0
                  ? `translateX(-${Math.min(index, maxIndex) * stepPx}px)`
                  : undefined,
            }}
          >
            {items.map((child, i) => (
              <div
                key={i}
                className="min-w-0 shrink-0 grow-0"
                style={{
                  width: itemWidth || undefined,
                  flex: itemWidth ? `0 0 ${itemWidth}px` : `0 0 calc((100% - ${(itemsPerView - 1) * gap}px) / ${itemsPerView})`,
                }}
              >
                {child}
              </div>
            ))}
          </div>
        </div>
      </div>

      {items.length > itemsPerView && (
        <div className="mt-4 flex items-center justify-between gap-4 sm:mt-6">
          <div className="flex gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to slide group ${i + 1}`}
                aria-current={i === Math.min(index, maxIndex)}
                onClick={() => setIndex(i)}
                className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-caramel"
              >
                <span
                  className={`h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${
                    i === Math.min(index, maxIndex)
                      ? "w-8 bg-caramel"
                      : "w-1.5 bg-border-warm"
                  }`}
                />
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <CarouselNav
              label="Previous"
              onClick={() => go(index - 1)}
              direction="prev"
            />
            <CarouselNav
              label="Next"
              onClick={() => go(index + 1)}
              direction="next"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function CarouselNav({
  label,
  onClick,
  direction,
}: {
  label: string;
  onClick: () => void;
  direction: "prev" | "next";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-border-warm bg-cream-alt text-cocoa transition-colors duration-300 hover:border-caramel hover:text-caramel motion-reduce:transition-none"
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
        {direction === "prev" ? (
          <path d="M15 18l-6-6 6-6" />
        ) : (
          <path d="M9 18l6-6-6-6" />
        )}
      </svg>
    </button>
  );
}
