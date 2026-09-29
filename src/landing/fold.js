/* Hero console fold.
   The console arrives flat. Once the reader has seen all of it and keeps
   scrolling, it folds back on its top edge until it is edge on, shrinking
   and blurring as it goes. Same motion as the Brut job card.

   The fold is the point, so the console stays opaque for most of it and
   only fades in the last stretch. It also trails the scroll a little, so the
   fold plays out in view instead of under the sticky header. The transform
   lives on a wrapper, so the console's own entrance reveal is left alone.
   Under reduced motion nothing moves and no scroll listener is attached. */
import { reducedMotion } from "../lib/motion.js";

const clamp = (n, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, n));
const mix = (a, b, t) => a + (b - a) * t;
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/**
 * c is how far the console has closed: 0 flat and facing, 1 edge on and gone.
 * trail is how far, in px, it lags behind the page by the end of the fold.
 */
export function drawFold(el, c, trail = 0) {
  const t = easeInOut(clamp(c));
  el.style.opacity = (1 - clamp((c - 0.62) / 0.38)).toFixed(3);
  el.style.filter = t > 0.001 ? `blur(${(t * 10).toFixed(2)}px)` : "";
  el.style.transform = t > 0
    ? `translateY(${mix(0, trail, t).toFixed(2)}px) rotateX(${mix(0, 88, t).toFixed(3)}deg) scale(${mix(1, 0.5, t).toFixed(4)})`
    : "";
  el.style.pointerEvents = c > 0.5 ? "none" : "";
}

/**
 * How far the reader has scrolled past the console, 0 to 1.
 * The fold holds until the console's bottom edge has been on screen, then
 * about two thirds of a screen of scrolling closes it.
 */
export function departure(bottom, scrollY = window.scrollY, vh = window.innerHeight) {
  const hold = Math.max(vh * 0.04, bottom - vh + 40);
  return clamp((scrollY - hold) / (vh * 0.65));
}

export function initFold(el) {
  if (!el || reducedMotion()) return;

  /* Measured with the fold cleared, so a reload mid page reads the flat spot. */
  let bottom = 0;
  const measure = () => {
    const kept = el.style.transform;
    el.style.transform = "";
    bottom = el.getBoundingClientRect().bottom + window.scrollY;
    el.style.transform = kept;
  };

  let queued = false;
  const frame = () => {
    queued = false;
    drawFold(el, departure(bottom), window.innerHeight * 0.34);
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(frame);
  };

  measure();
  frame();
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", () => (measure(), onScroll()), { passive: true });
  /* Fonts and the hero graph can change the console height after load. */
  if ("ResizeObserver" in window) new ResizeObserver(() => (measure(), onScroll())).observe(el);
}
