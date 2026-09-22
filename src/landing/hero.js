/* Hero routing console.
   One loop: the request is created, Cons evaluates each provider in turn, the
   selected route brightens, a packet travels it, and the lifecycle completes.
   Every figure comes from the preview data layer and is labeled illustrative. */
import { candidateRoutes } from "../data/preview.js";
import { stateLabel } from "../data/lifecycle.js";
import { PREFERENCES, formatEta, formatUsd, rankRoutes } from "../services/scoring.js";
import { createLoop, reducedMotion, whenVisible } from "../lib/motion.js";

const NS = "http://www.w3.org/2000/svg";
const PREF_ORDER = ["best", "cost", "speed", "security"];

const SCENARIOS = {
  token: {
    title: "New token route",
    request: { kind: "token", source: "solana", destination: "base", amount: 100 },
    from: "Solana",
    to: "Base",
    fields: [["From", "Solana"], ["To", "Base"], ["Asset", "USDC"], ["Amount", "100.00"]],
  },
  message: {
    title: "New message route",
    request: { kind: "message", source: "base", destination: "solana", payloadBytes: 96 },
    from: "Base",
    to: "Solana",
    fields: [["From", "Base"], ["To", "Solana"], ["Target", "Program"], ["Payload", "96 bytes"]],
  },
};

const el = (name, attrs = {}, parent) => {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  parent?.append(node);
  return node;
};

function node(parent, { x, y, w, h, label, sub, cls = "" }) {
  const g = el("g", { class: `node ${cls}`, transform: `translate(${x} ${y})` }, parent);
  el("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: 10 }, g);
  const t = el("text", { y: sub ? -1 : 4.5 }, g);
  t.textContent = label;
  if (sub) {
    const s = el("text", { y: 13, class: "sub" }, g);
    s.textContent = sub;
  }
  return g;
}

export function initHero(root) {
  const q = (key) => root.querySelector(`[data-h="${key}"]`);
  const svg = q("svg");
  const rowsHost = q("rows");
  const tabs = [...document.querySelectorAll(".hero-tabs [role=tab]")];
  const tabBar = document.querySelector(".hero-tabs");

  let mode = "token";
  let cycle = 0;
  let parts = null;

  function build() {
    const scenario = SCENARIOS[mode];
    const routes = candidateRoutes(scenario.request);
    svg.replaceChildren();
    const edges = el("g", {}, svg);
    const nodes = el("g", {}, svg);

    const ys = routes.length === 4 ? [52, 124, 196, 268] : routes.map((_, i) => 60 + i * (200 / Math.max(1, routes.length - 1)));
    const srcHub = el("path", { class: "edge", d: "M106 160 L162 160" }, edges);
    const legs = routes.map((route, i) => {
      const y = ys[i];
      return {
        route,
        a: el("path", { class: "edge", d: `M238 160 C290 160 285 ${y} 325 ${y}` }, edges),
        b: el("path", { class: "edge", d: `M435 ${y} C470 ${y} 468 160 490 160` }, edges),
        node: node(nodes, { x: 380, y, w: 110, h: 38, label: route.provider }),
      };
    });
    const src = node(nodes, { x: 58, y: 160, w: 96, h: 46, label: scenario.from, sub: "source" });
    const hub = node(nodes, { x: 200, y: 160, w: 76, h: 46, label: "Cons", sub: "router", cls: "hub" });
    const dst = node(nodes, { x: 538, y: 160, w: 96, h: 46, label: scenario.to, sub: "destination" });
    const ring = el("rect", { class: "ring", x: 490, y: 137, width: 96, height: 46, rx: 12, style: "transform-origin: 538px 160px" }, svg);
    const packet = el("circle", { class: "packet", r: 4.5, cx: 106, cy: 160 }, svg);

    rowsHost.replaceChildren(
      ...routes.map((route) => {
        const row = document.createElement("div");
        row.className = "row";
        row.setAttribute("role", "row");
        row.dataset.id = route.providerId;
        row.innerHTML = `<span class="name" role="cell">${route.provider}<em class="best">Selected</em></span>
          <span class="num" role="cell">${formatUsd(route.costUsd)}</span>
          <span class="num" role="cell">${formatEta(route.etaSeconds)}</span>
          <span role="cell">${route.security}</span>
          <span role="cell"><span class="tag ${route.availability === "active" ? "ok" : route.availability === "degraded" ? "warn" : ""}">${route.availability === "active" ? "Active" : route.availability === "degraded" ? "Degraded" : "Paused"}</span></span>
          <span role="cell"><span class="sc"><b></b></span></span>`;
        return row;
      }),
    );

    q("title").textContent = scenario.title;
    q("fields").innerHTML = scenario.fields.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
    q("r-src").textContent = scenario.from;
    parts = { scenario, routes, srcHub, legs, src, hub, dst, ring, packet };
  }

  function setPref(pref) {
    q("pref").textContent = PREFERENCES[pref].label;
    q("prio").querySelectorAll("span").forEach((s) => s.classList.toggle("on", s.dataset.p === pref));
  }

  let t0 = 0;
  function setStatus(status) {
    const order = ["CREATED", "SUBMITTED", "IN_TRANSIT", "DESTINATION_RECEIVED", "CONFIRMED"];
    const idx = order.indexOf(status);
    q("life").querySelectorAll("li").forEach((li, i) => {
      li.classList.toggle("done", i < idx || (status === "CONFIRMED" && i === idx));
      li.classList.toggle("now", i === idx && status !== "CONFIRMED");
      const time = li.querySelector("time");
      if (i === idx) time.textContent = `${((performance.now() - t0) / 1000).toFixed(1)}s`;
      if (i > idx) time.textContent = "";
    });
    q("r-status").textContent = stateLabel(status);
  }

  function reset() {
    const { srcHub, legs, src, hub, dst, packet, ring } = parts;
    [srcHub, ...legs.flatMap((l) => [l.a, l.b])].forEach((p) => p.setAttribute("class", "edge"));
    legs.forEach((l) => l.node.setAttribute("class", "node"));
    src.setAttribute("class", "node");
    hub.setAttribute("class", "node hub");
    dst.setAttribute("class", "node");
    packet.style.opacity = "0";
    ring.classList.remove("go");
    rowsHost.querySelectorAll(".row").forEach((row) => {
      row.className = "row";
      row.querySelector(".sc b").style.setProperty("--s", "0%");
    });
    q("r-route").textContent = "Pending";
    q("note").textContent = "Discovering routes";
    t0 = performance.now();
    setStatus("CREATED");
  }

  const travel = (path, ms) =>
    new Promise((resolve) => {
      const { packet } = parts;
      const length = path.getTotalLength();
      const start = performance.now();
      packet.style.opacity = "1";
      const frame = (now) => {
        const t = Math.min(1, (now - start) / ms);
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const point = path.getPointAtLength(eased * length);
        packet.setAttribute("cx", point.x);
        packet.setAttribute("cy", point.y);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

  function applyRanking(ranked, reveal = true) {
    const byId = new Map(ranked.map((r) => [r.providerId, r]));
    const top = ranked.find((r) => r.best);
    parts.legs.forEach((leg) => {
      const r = byId.get(leg.route.providerId);
      const row = rowsHost.querySelector(`[data-id="${leg.route.providerId}"]`);
      if (!r.eligible) {
        leg.a.setAttribute("class", "edge blocked");
        leg.b.setAttribute("class", "edge blocked");
        leg.node.setAttribute("class", "node blocked");
        row.className = "row blocked";
        return;
      }
      if (reveal) row.querySelector(".sc b").style.setProperty("--s", `${Math.round(r.score * 100)}%`);
    });
    return top;
  }

  function select(top) {
    parts.srcHub.setAttribute("class", "edge sel");
    parts.legs.forEach((leg) => {
      const row = rowsHost.querySelector(`[data-id="${leg.route.providerId}"]`);
      if (leg.node.classList.contains("blocked")) return;
      const chosen = leg.route.providerId === top.providerId;
      leg.a.setAttribute("class", `edge ${chosen ? "sel" : "dim"}`);
      leg.b.setAttribute("class", `edge ${chosen ? "sel" : "dim"}`);
      leg.node.setAttribute("class", `node ${chosen ? "sel" : "dim"}`);
      row.classList.toggle("sel", chosen);
    });
    q("r-route").textContent = top.provider;
  }

  async function run(step) {
    const pref = PREF_ORDER[cycle % PREF_ORDER.length];
    setPref(pref);
    reset();
    const ranked = rankRoutes(parts.routes, pref);
    parts.src.classList.add("on");
    await step(700);

    setStatus("SUBMITTED");
    await travel(parts.srcHub, 650);
    await step(0);
    parts.packet.style.opacity = "0";
    q("note").textContent = "Comparing providers";

    for (const leg of parts.legs) {
      const r = ranked.find((x) => x.providerId === leg.route.providerId);
      const row = rowsHost.querySelector(`[data-id="${leg.route.providerId}"]`);
      leg.a.setAttribute("class", "edge scan");
      leg.node.setAttribute("class", "node on");
      row.classList.add("scan");
      if (r.eligible) row.querySelector(".sc b").style.setProperty("--s", `${Math.round(r.score * 100)}%`);
      await step(300);
      leg.a.setAttribute("class", "edge");
      leg.node.setAttribute("class", "node");
      row.classList.remove("scan");
    }
    const top = applyRanking(ranked);
    await step(250);

    select(top);
    q("note").textContent = `${top.provider} · ${PREFERENCES[pref].label}`;
    await step(700);

    setStatus("IN_TRANSIT");
    const leg = parts.legs.find((l) => l.route.providerId === top.providerId);
    await travel(leg.a, 750);
    await travel(leg.b, 750);
    await step(0);
    parts.packet.style.opacity = "0";

    setStatus("DESTINATION_RECEIVED");
    parts.ring.classList.add("go");
    parts.dst.classList.add("sel");
    await step(800);

    setStatus("CONFIRMED");
    parts.dst.setAttribute("class", "node done");
    q("note").textContent = "Receipt ready";
    await step(2400);
    cycle++;
  }

  function renderStatic() {
    reset();
    setPref("best");
    const ranked = rankRoutes(parts.routes, "best");
    const top = applyRanking(ranked);
    select(top);
    parts.dst.setAttribute("class", "node done");
    setStatus("CONFIRMED");
    q("note").textContent = `${top.provider} · Best Route`;
  }

  const loop = createLoop(run);
  let visible = false;

  function setMode(next) {
    mode = next;
    cycle = 0;
    tabBar.dataset.active = next;
    tabs.forEach((tab) => {
      const on = tab.dataset.mode === next;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on) root.setAttribute("aria-labelledby", tab.id);
    });
    loop.stop();
    build();
    if (reducedMotion()) renderStatic();
    else {
      reset();
      if (visible) setTimeout(() => loop.start(), 0);
    }
  }

  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => setMode(tab.dataset.mode));
    tab.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
      const next = tabs[(i + (event.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
      next.focus();
      setMode(next.dataset.mode);
    });
  });

  setMode("token");
  if (!reducedMotion()) {
    whenVisible(root, (isVisible) => {
      visible = isVisible;
      if (isVisible) loop.start();
      else loop.stop();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) loop.stop();
      else if (visible) loop.start();
    });
  }
}
