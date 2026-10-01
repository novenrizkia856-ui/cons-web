/* Hero route field. A canvas behind the hero copy: routes stream in from the
   left, converge on the Cons hub and fan out to destination chains, with
   packets riding every path. The hub leans toward the pointer.
   Draws only while the hero is on screen; reduced motion gets one still frame. */
import { reducedMotion, whenVisible } from "../lib/motion.js";

const GOLD = "171, 143, 100";
const INK = "20, 20, 20";
const DESTS = [
  { label: "ETH", y: 0.14 },
  { label: "BASE", y: 0.38 },
  { label: "SOL", y: 0.62 },
  { label: "+", y: 0.86 },
];
const SOURCES = [0.08, 0.3, 0.52, 0.74, 0.94];

const bez = (p0, p1, p2, p3, t) => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};

export function initField(host) {
  if (!host) return;
  const canvas = document.createElement("canvas");
  canvas.className = "hero-field";
  canvas.setAttribute("aria-hidden", "true");
  host.prepend(canvas);
  const ctx = canvas.getContext("2d");

  const mark = new Image();
  mark.src = "/brand/cons-mark-black.png";

  let w = 0;
  let h = 0;
  let dpr = 1;
  let paths = [];
  let hub = [0, 0];
  let lean = [0, 0];
  let target = [0, 0];
  let pulse = 0;
  const packets = [];

  function layout() {
    const box = host.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = box.width;
    h = box.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    const narrow = w < 760;
    // On a phone the copy fills the top, so the hub sits beside the calls to action.
    hub = narrow ? [w * 0.84, h - 76] : [w * 0.74, h * 0.34];
    const [hx, hy] = hub;
    paths = [];
    // Inbound: from the left edge, through the copy, into the hub.
    SOURCES.forEach((sy) => {
      const p0 = [-20, h * sy];
      paths.push({ kind: "in", pts: [p0, [w * 0.38, h * sy], [hx - w * 0.16, hy], [hx, hy]] });
    });
    // Outbound: from the hub to each destination chain on the right edge.
    DESTS.forEach((d) => {
      const end = [w + 20, h * d.y];
      paths.push({ kind: "out", label: d.label, pts: [[hx, hy], [hx + w * 0.08, hy], [w * 0.9, h * d.y], end] });
    });
  }

  function spawn() {
    // Paths are rebuilt on resize, so packets hold indexes, not path objects.
    const pick = (n) => (Math.random() * n) | 0;
    packets.push({ pi: pick(SOURCES.length), t: 0, speed: 0.0028 + Math.random() * 0.0024, next: SOURCES.length + pick(DESTS.length) });
  }

  function strokePath(p, alpha) {
    const [a, b, c, d] = p.pts;
    const grad = ctx.createLinearGradient(a[0], 0, d[0], 0);
    if (p.kind === "in") {
      grad.addColorStop(0, `rgba(${INK}, 0)`);
      grad.addColorStop(0.45, `rgba(${INK}, ${alpha * 0.35})`);
      grad.addColorStop(1, `rgba(${GOLD}, ${alpha})`);
    } else {
      grad.addColorStop(0, `rgba(${GOLD}, ${alpha})`);
      grad.addColorStop(1, `rgba(${INK}, ${alpha * 0.25})`);
    }
    ctx.strokeStyle = grad;
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.bezierCurveTo(b[0], b[1], c[0], c[1], d[0], d[1]);
    ctx.stroke();
  }

  function shifted(p) {
    // Paths follow the leaning hub so the whole field bends toward the pointer.
    const pts = p.pts.map((pt) => pt.slice());
    const i = p.kind === "in" ? 3 : 0;
    const j = p.kind === "in" ? 2 : 1;
    pts[i][0] += lean[0];
    pts[i][1] += lean[1];
    pts[j][0] += lean[0] * 0.6;
    pts[j][1] += lean[1] * 0.6;
    return { ...p, pts };
  }

  function draw(time) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    lean[0] += (target[0] - lean[0]) * 0.06;
    lean[1] += (target[1] - lean[1]) * 0.06;
    const live = paths.map(shifted);
    const hx = hub[0] + lean[0];
    const hy = hub[1] + lean[1];

    ctx.lineWidth = 1;
    live.forEach((p) => strokePath(p, 0.32));

    // Packets with short comet tails.
    for (let k = packets.length - 1; k >= 0; k--) {
      const pk = packets[k];
      pk.t += pk.speed;
      if (pk.t >= 1) {
        if (pk.pi < SOURCES.length) {
          pulse = 1;
          pk.pi = pk.next;
          pk.t = 0;
        } else {
          packets.splice(k, 1);
          continue;
        }
      }
      const lp = live[pk.pi];
      const [a, b, c, d] = lp.pts;
      for (let s = 6; s >= 0; s--) {
        const tt = Math.max(0, pk.t - s * 0.012);
        const [x, y] = bez(a, b, c, d, tt);
        ctx.fillStyle = `rgba(${GOLD}, ${(1 - s / 7) * 0.55})`;
        ctx.beginPath();
        ctx.arc(x, y, s === 0 ? 2.6 : 1.8 - s * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }
      const [x, y] = bez(a, b, c, d, pk.t);
      const glow = ctx.createRadialGradient(x, y, 0, x, y, 12);
      glow.addColorStop(0, `rgba(232, 194, 137, 0.75)`);
      glow.addColorStop(1, `rgba(232, 194, 137, 0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Destination labels on the right edge.
    ctx.font = "500 10.5px 'Geist Mono', ui-monospace, monospace";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    live.filter((p) => p.kind === "out").forEach((p) => {
      const [x, y] = bez(...p.pts, 0.86);
      ctx.fillStyle = `rgba(${INK}, 0.38)`;
      ctx.fillText(p.label, x - 8, y - 12);
      ctx.fillStyle = `rgba(${GOLD}, 0.9)`;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Hub: halo, rotating dashed rings, the mark.
    pulse *= 0.94;
    const halo = ctx.createRadialGradient(hx, hy, 0, hx, hy, 120);
    halo.addColorStop(0, `rgba(232, 194, 137, ${0.3 + pulse * 0.25})`);
    halo.addColorStop(1, "rgba(232, 194, 137, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(hx, hy, 120, 0, Math.PI * 2);
    ctx.fill();

    const spin = time * 0.00025;
    [[52, 0.22, [2, 7], spin], [70, 0.14, [1, 10], -spin * 0.7]].forEach(([r, a, dash, rot]) => {
      ctx.save();
      ctx.translate(hx, hy);
      ctx.rotate(rot);
      ctx.setLineDash(dash);
      ctx.strokeStyle = `rgba(${GOLD}, ${a + pulse * 0.2})`;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    // A bright arc riding the inner ring.
    ctx.strokeStyle = `rgba(${GOLD}, 0.85)`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(hx, hy, 52, spin * 3, spin * 3 + 0.7);
    ctx.stroke();
    ctx.lineWidth = 1;

    const r = 30 + pulse * 3;
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = `rgba(${GOLD}, 0.55)`;
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(hx, hy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(${GOLD}, 0.6)`;
    ctx.stroke();
    if (mark.complete && mark.naturalWidth) {
      const mw = 26;
      const mh = (mw * mark.naturalHeight) / mark.naturalWidth;
      ctx.drawImage(mark, hx - mw / 2, hy - mh / 2, mw, mh);
    }
  }

  layout();
  new ResizeObserver(layout).observe(host);

  if (reducedMotion()) {
    mark.onload = () => draw(0);
    draw(0);
    return;
  }

  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    host.addEventListener("pointermove", (event) => {
      const box = host.getBoundingClientRect();
      target = [((event.clientX - box.left) / box.width - 0.5) * 40, ((event.clientY - box.top) / box.height - 0.5) * 30];
    });
    host.addEventListener("pointerleave", () => (target = [0, 0]));
  }

  let frame = 0;
  let last = 0;
  const loop = (time) => {
    if (time - last > 520 && packets.length < 14) {
      spawn();
      last = time;
    }
    draw(time);
    frame = requestAnimationFrame(loop);
  };
  whenVisible(host, (visible) => {
    cancelAnimationFrame(frame);
    if (visible) frame = requestAnimationFrame(loop);
  }, "0px");
  for (let i = 0; i < 5; i++) {
    spawn();
    packets[packets.length - 1].t = Math.random();
  }
}
