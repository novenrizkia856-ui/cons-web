/* Pointer light for the landing panels.
   Panels marked below read --mx and --my, so their spotlight and glowing
   edge follow the cursor. One delegated listener, one write per frame. */

const SPOT = ".fvis, .trio-vis, .dev-grid li, .steps-list li, .prims-grid li, .emblem, .code-card, .console";

export function initPointerLight() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  let pending = null;
  let frame = 0;
  document.addEventListener(
    "pointermove",
    (event) => {
      pending = event;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = pending.target instanceof Element ? pending.target.closest(SPOT) : null;
        if (!el) return;
        const box = el.getBoundingClientRect();
        el.style.setProperty("--mx", `${pending.clientX - box.left}px`);
        el.style.setProperty("--my", `${pending.clientY - box.top}px`);
      });
    },
    { passive: true },
  );
}

/* Scroll progress: the gold hairline under the nav tracks the page. */
export function initProgress() {
  const bar = document.querySelector(".nav-progress");
  if (!bar) return;
  let frame = 0;
  const paint = () => {
    frame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty("--progress", max > 0 ? String(Math.min(1, scrollY / max)) : "0");
  };
  addEventListener("scroll", () => (frame ||= requestAnimationFrame(paint)), { passive: true });
  paint();
}

/* Magnetic calls to action: large buttons lean toward the cursor. */
export function initMagnetic() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.querySelectorAll(".btn-lg").forEach((btn) => {
    btn.addEventListener("pointermove", (event) => {
      const box = btn.getBoundingClientRect();
      const x = (event.clientX - box.left - box.width / 2) * 0.22;
      const y = (event.clientY - box.top - box.height / 2) * 0.3;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener("pointerleave", () => (btn.style.transform = ""));
  });
}
