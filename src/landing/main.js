import { consConfig } from "../config/cons.js";
import { candidateRoutes } from "../data/preview.js";
import { MAIN_PATH } from "../data/lifecycle.js";
import { initChrome } from "../lib/chrome.js";
import { copyButton } from "../lib/clipboard.js";
import { initLive, initReveal, loopWhileVisible } from "../lib/motion.js";
import { PREFERENCES, formatEta, formatUsd, rankRoutes } from "../services/scoring.js";
import { initHero } from "./hero.js";

initChrome();

/* Token CA. Shows the configured mint, or Coming Soon with an inert copy. */
function initTokenCa() {
  const mint = consConfig.tokenMintAddress;
  const value = document.getElementById("ca-value");
  value.textContent = mint || "Coming Soon";
  value.classList.toggle("pending", !mint);
  if (mint) value.title = mint;
  document.getElementById("ca-copy").replaceWith(
    copyButton(mint, { label: "Copy token contract address", unavailable: "Address not available yet" }),
  );
}

/* Route intelligence and comparison share one preference. */
function initPreferencePanels() {
  const routes = candidateRoutes({ kind: "token", source: "solana", destination: "base", amount: 100 });
  const body = document.getElementById("cmp-body");
  const factors = document.getElementById("factors");
  const groups = [...document.querySelectorAll("[data-pref-group]")];
  let selected = null;

  const rows = new Map(
    routes.map((route) => {
      const row = document.createElement("div");
      row.className = "cmp-row";
      row.setAttribute("role", "row");
      row.tabIndex = 0;
      row.dataset.id = route.providerId;
      const status = { active: ["ok", "Active"], degraded: ["warn", "Degraded"], paused: ["", "Paused"] }[route.availability];
      row.innerHTML = `<span class="p" role="cell">${route.provider}</span><span class="n" role="cell">${formatUsd(route.costUsd)}</span><span class="n" role="cell">${formatEta(route.etaSeconds)}</span><span role="cell">${route.security}</span><span role="cell"><span class="tag ${status[0]}">${status[1]}</span></span>`;
      const pick = () => {
        if (row.classList.contains("off")) return;
        selected = route.providerId;
        rows.forEach((r) => r.classList.toggle("sel", r.dataset.id === selected));
      };
      row.addEventListener("click", pick);
      row.addEventListener("keydown", (event) => (event.key === "Enter" || event.key === " ") && (event.preventDefault(), pick()));
      return [route.providerId, row];
    }),
  );

  function apply(pref) {
    const ranked = rankRoutes(routes, pref);
    // FLIP: remember positions, reorder, animate from the old spot.
    const before = new Map([...rows].map(([id, row]) => [id, row.getBoundingClientRect().top]));
    ranked.forEach((route) => {
      const row = rows.get(route.providerId);
      row.classList.toggle("top", Boolean(route.best));
      row.classList.toggle("off", !route.eligible);
      body.append(row);
    });
    selected = ranked.find((r) => r.best)?.providerId ?? null;
    rows.forEach((row, id) => {
      row.classList.toggle("sel", id === selected);
      const delta = before.get(id) - row.getBoundingClientRect().top;
      if (delta && row.animate && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        row.animate([{ transform: `translateY(${delta}px)` }, { transform: "none" }], { duration: 520, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
      }
    });

    const weights = PREFERENCES[pref].weights;
    for (const [key, weight] of Object.entries(weights)) {
      const li = factors.querySelector(`[data-f="${key}"]`);
      li.querySelector("b").style.width = `${Math.round(weight * 100)}%`;
      li.querySelector("output").textContent = `${Math.round(weight * 100)}%`;
    }

    groups.forEach((group) =>
      group.querySelectorAll("[data-pref]").forEach((button) => {
        const on = button.dataset.pref === pref;
        button.setAttribute("aria-checked", String(on));
        button.tabIndex = on ? 0 : -1;
      }),
    );
  }

  groups.forEach((group) => {
    const buttons = [...group.querySelectorAll("[data-pref]")];
    buttons.forEach((button, i) => {
      button.addEventListener("click", () => apply(button.dataset.pref));
      button.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
        event.preventDefault();
        const next = buttons[(i + (event.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length];
        next.focus();
        apply(next.dataset.pref);
      });
    });
  });

  apply("best");
}

/* Lifecycle loop, including the alternate states. */
function initLifecycle() {
  const stepper = document.getElementById("stepper");
  const alt = document.getElementById("alt-states");
  const log = document.getElementById("life-log");
  const scenarios = [
    ["CREATED", "SUBMITTED", "IN_TRANSIT", "RETRYING", "IN_TRANSIT", "DESTINATION_RECEIVED", "CONFIRMED"],
    ["CREATED", "SUBMITTED", "IN_TRANSIT", "FAILED"],
    ["CREATED", "SUBMITTED", "IN_TRANSIT", "DESTINATION_RECEIVED", "CONFIRMED"],
    ["CREATED", "EXPIRED"],
    ["CREATED", "SUBMITTED", "IN_TRANSIT", "RETRYING", "IN_TRANSIT", "DESTINATION_RECEIVED", "CONFIRMED"],
    ["CREATED", "CANCELLED"],
  ];

  let reached = 0;
  function render(status, trail) {
    const idx = MAIN_PATH.indexOf(status);
    if (idx !== -1) reached = idx;
    stepper.querySelectorAll("li").forEach((li, i) => {
      li.classList.toggle("done", i < reached || (status === "CONFIRMED" && i === reached));
      li.classList.toggle("now", i === reached && status !== "CONFIRMED");
    });
    stepper.style.setProperty("--p", String(reached / 4));
    stepper.classList.toggle("final", status === "CONFIRMED");
    stepper.classList.toggle("warn", status === "RETRYING");
    alt.querySelectorAll("[data-s]").forEach((tag) => tag.classList.toggle("on", tag.dataset.s === status));
    log.textContent = trail.slice(-3).join("  →  ");
  }

  let n = 0;
  loopWhileVisible(
    stepper.parentElement,
    async (step) => {
      const scenario = scenarios[n++ % scenarios.length];
      reached = 0;
      for (let i = 0; i < scenario.length; i++) {
        render(scenario[i], scenario.slice(0, i + 1));
        await step(i === scenario.length - 1 ? 2200 : 850);
      }
    },
    () => render("CONFIRMED", ["IN_TRANSIT", "DESTINATION_RECEIVED", "CONFIRMED"]),
  );
  render("CREATED", ["CREATED"]);
}

/* Token routing: a coin travels the route and lights it behind itself. */
function initTokenTravel() {
  const vis = document.querySelector(".vis-token");
  if (!vis) return;
  const track = vis.querySelector("#track");
  const lit = vis.querySelector(".track-lit");
  const coin = vis.querySelector(".coin");
  const dest = vis.querySelector(".chain-card.to");
  const length = track.getTotalLength();
  lit.style.strokeDasharray = `${length}`;

  const place = (t) => {
    const point = track.getPointAtLength(t * length);
    const ctm = track.getScreenCTM();
    const box = vis.getBoundingClientRect();
    if (!ctm) return;
    const x = ctm.a * point.x + ctm.c * point.y + ctm.e - box.left;
    const y = ctm.b * point.x + ctm.d * point.y + ctm.f - box.top;
    coin.style.transform = `translate(${x - 13}px, ${y - 13}px)`;
    lit.style.strokeDashoffset = `${length * (1 - t)}`;
  };

  const run = (ms) =>
    new Promise((resolve) => {
      const start = performance.now();
      const frame = (now) => {
        const t = Math.min(1, (now - start) / ms);
        place(t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
        if (t < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });

  loopWhileVisible(
    vis,
    async (step) => {
      dest.classList.remove("arrived");
      lit.style.opacity = "1";
      coin.style.opacity = "1";
      await run(2200);
      await step(0);
      coin.style.opacity = "0";
      dest.classList.add("arrived");
      await step(1600);
      lit.style.opacity = "0";
      await step(600);
    },
    () => {
      lit.style.strokeDashoffset = "0";
      dest.classList.add("arrived");
    },
  );
}

/* Provider policy switches. */
function initPolicy() {
  const list = document.getElementById("policy");
  const count = document.getElementById("policy-count");
  const update = () => (count.textContent = String(list.querySelectorAll('[aria-checked="true"]').length));
  list.querySelectorAll("[role=switch]").forEach((sw) =>
    sw.addEventListener("click", () => {
      sw.setAttribute("aria-checked", String(sw.getAttribute("aria-checked") !== "true"));
      update();
    }),
  );
  update();
}

initTokenCa();
initHero(document.getElementById("hero-console"));
initPreferencePanels();
initLifecycle();
initTokenTravel();
initPolicy();
initReveal();
initLive();
