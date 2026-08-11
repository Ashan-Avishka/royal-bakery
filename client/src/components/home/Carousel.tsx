"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface CarouselProps {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
  ariaLabel: string;
}

export function Carousel({
  children,
  className = "",
  itemClassName = "",
  ariaLabel,
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateArrows = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanPrev(scrollLeft > 8);
    setCanNext(scrollLeft + clientWidth < scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [updateArrows, children]);

  const scrollByPage = (direction: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const amount = Math.max(el.clientWidth * 0.72, 260);
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollByPage(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollByPage(1);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div
        ref={trackRef}
        role="region"
        aria-label={`${ariaLabel} carousel. Use the left and right arrow keys to browse.`}
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-3 outline-none focus-visible:ring-2 focus-visible:ring-caramel/30 sm:gap-6"
      >
        {Array.isArray(children) ? (
          children.map((child, i) => (
            <div key={i} className={`shrink-0 snap-start ${itemClassName}`}>
              {child}
            </div>
          ))
        ) : (
          <div className={`shrink-0 snap-start ${itemClassName}`}>
            {children}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-10 hidden sm:block">
        <CarouselArrow
          direction="prev"
          disabled={!canPrev}
          onClick={() => scrollByPage(-1)}
        />
        <CarouselArrow
          direction="next"
          disabled={!canNext}
          onClick={() => scrollByPage(1)}
        />
      </div>
    </div>
  );
}

function CarouselArrow({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={direction === "prev" ? "Previous" : "Next"}
      disabled={disabled}
      onClick={onClick}
        className={`pointer-events-auto absolute top-[38%] z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-border-warm/80 bg-cream-alt/90 text-cocoa backdrop-blur-md transition-colors duration-300 hover:border-caramel/50 hover:text-caramel motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-0 ${
          direction === "prev" ? "left-2" : "right-2"
        }`}
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
