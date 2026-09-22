/* Motion primitives.
   Reveal: elements marked data-reveal fade up with a blur, once, as they enter.
   Live: elements marked data-live get .is-live only while visible, so looping
   animations never run offscreen. */

export const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initReveal(root = document) {
  const items = [...root.querySelectorAll("[data-reveal]:not(.in)")];
  if (!("IntersectionObserver" in window) || reducedMotion()) {
    items.forEach((el) => el.classList.add("in"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
  );
  items.forEach((el) => io.observe(el));
}

/** Calls onChange(visible) whenever the element enters or leaves the viewport. */
export function whenVisible(el, onChange, margin = "80px") {
  if (!("IntersectionObserver" in window)) {
    onChange(true);
    return () => {};
  }
  const io = new IntersectionObserver(([entry]) => onChange(entry.isIntersecting), { rootMargin: margin });
  io.observe(el);
  return () => io.disconnect();
}

export function initLive(root = document) {
  root.querySelectorAll("[data-live]").forEach((el) => {
    whenVisible(el, (visible) => el.classList.toggle("is-live", visible && !reducedMotion()));
  });
}

/**
 * A cancellable looping timeline. `run(step)` receives a `step(ms)` helper
 * that resolves after ms, or rejects once the loop is stopped, so a sequence
 * written with await halts cleanly when its section scrolls out of view.
 */
export function createLoop(run) {
  let token = 0;
  let running = false;
  const start = async () => {
    if (running) return;
    running = true;
    const mine = ++token;
    const step = (ms) =>
      new Promise((resolve, reject) => setTimeout(() => (mine === token ? resolve() : reject(new Error("stopped"))), ms));
    try {
      while (mine === token) await run(step);
    } catch {
      /* stopped */
    }
  };
  const stop = () => {
    token++;
    running = false;
  };
  return { start, stop };
}

/** Run a loop only while `el` is on screen and motion is allowed. */
export function loopWhileVisible(el, run, onStatic) {
  const loop = createLoop(run);
  if (reducedMotion()) {
    onStatic?.();
    return loop;
  }
  whenVisible(el, (visible) => (visible ? loop.start() : loop.stop()));
  document.addEventListener("visibilitychange", () => (document.hidden ? loop.stop() : null));
  return loop;
}
