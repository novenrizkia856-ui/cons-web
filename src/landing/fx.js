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
