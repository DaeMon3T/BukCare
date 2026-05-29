import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useTour } from "@/context/TourContext";

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const SPOTLIGHT_PADDING = 8;
const TOOLTIP_WIDTH = 340;
const GAP = 14;

const rectsEqual = (a: Rect | null, b: Rect | null): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.top - b.top) < 1 &&
    Math.abs(a.left - b.left) < 1 &&
    Math.abs(a.width - b.width) < 1 &&
    Math.abs(a.height - b.height) < 1
  );
};

const findVisibleTarget = (selector?: string): HTMLElement | null => {
  if (!selector) return null;
  const els = Array.from(document.querySelectorAll<HTMLElement>(selector));
  for (const el of els) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
};

const TourOverlay: React.FC = () => {
  const { isRunning, currentStep, steps, next, prev, endTour } = useTour();
  const step = steps[currentStep];

  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const measure = useCallback(() => {
    const el = findVisibleTarget(step?.target);
    if (!el) {
      setRect((prev) => (prev === null ? prev : null));
      return;
    }
    const r = el.getBoundingClientRect();
    const nextRect: Rect = { top: r.top, left: r.left, width: r.width, height: r.height };
    setRect((prev) => (rectsEqual(prev, nextRect) ? prev : nextRect));
  }, [step?.target]);

  // On step change: scroll the target into view, then measure.
  useEffect(() => {
    if (!isRunning) return;
    const el = findVisibleTarget(step?.target);
    if (el) {
      el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    }
    // Measure shortly after to account for the smooth scroll / layout.
    measure();
    const t = window.setTimeout(measure, 350);
    return () => window.clearTimeout(t);
  }, [isRunning, currentStep, step?.target, measure]);

  // Keep the spotlight glued to the target as the page resizes/scrolls/reflows.
  useEffect(() => {
    if (!isRunning) return;
    const handler = () => measure();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    const interval = window.setInterval(measure, 250);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
      window.clearInterval(interval);
    };
  }, [isRunning, measure]);

  // Position the tooltip relative to the target (or center it when there's none).
  useLayoutEffect(() => {
    if (!isRunning) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(TOOLTIP_WIDTH, vw - 32);
    const tipH = tooltipRef.current?.offsetHeight ?? 180;

    if (!rect) {
      setTooltipPos({
        top: Math.max(16, vh / 2 - tipH / 2),
        left: Math.max(16, vw / 2 - width / 2),
      });
      return;
    }

    const placement = step?.placement ?? "bottom";
    let top: number;
    let left = rect.left + rect.width / 2 - width / 2;

    const fitsBelow = rect.top + rect.height + GAP + tipH < vh;
    const useTop = placement === "top" || (placement === "bottom" && !fitsBelow);

    if (useTop) {
      top = rect.top - tipH - GAP;
    } else {
      top = rect.top + rect.height + GAP;
    }

    // Clamp into the viewport with a 16px margin.
    left = Math.min(Math.max(16, left), vw - width - 16);
    top = Math.min(Math.max(16, top), vh - tipH - 16);

    setTooltipPos({ top, left });
  }, [rect, isRunning, currentStep, step?.placement]);

  // Keyboard controls.
  useEffect(() => {
    if (!isRunning) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") endTour(true);
      else if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isRunning, next, prev, endTour]);

  if (!isRunning || !step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const tooltipWidth = Math.min(TOOLTIP_WIDTH, window.innerWidth - 32);

  return createPortal(
    <div className="fixed inset-0 z-[2000]" role="dialog" aria-modal="true" aria-label="Feature tour">
      {/* Click blocker. Dark when there is no spotlight target. */}
      <div className={`absolute inset-0 ${rect ? "" : "bg-slate-900/60"}`} />

      {/* Spotlight cutout via a large box-shadow. */}
      {rect && (
        <motion.div
          className="absolute rounded-2xl pointer-events-none"
          initial={false}
          animate={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            boxShadow: "0 0 0 9999px rgba(15,23,42,0.6)",
            border: "2px solid rgba(59,130,246,0.95)",
          }}
        >
          <span className="absolute inset-0 rounded-2xl ring-2 ring-blue-400/60 animate-pulse" />
        </motion.div>
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          ref={tooltipRef}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          className="absolute bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          style={{ top: tooltipPos.top, left: tooltipPos.left, width: tooltipWidth }}
        >
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-bold text-slate-900 text-base leading-tight">{step.title}</h3>
              </div>
              <button
                onClick={() => endTour(true)}
                className="p-1 -mt-1 -mr-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                aria-label="Close tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">{step.content}</p>

            {/* Progress */}
            <div className="mt-5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {!isFirst && (
                <button
                  onClick={prev}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
              <button
                onClick={next}
                className="flex-1 flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors"
              >
                {isLast ? "Finish" : "Next"}
                {!isLast && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {!isLast && (
            <button
              onClick={() => endTour(true)}
              className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-t border-slate-100 transition-colors"
            >
              Skip tour
            </button>
          )}
        </motion.div>
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default TourOverlay;
