/* Small UI toolkit for the app views. */
import { icons } from "../lib/icons.js";
import { formatEta, formatUsd } from "../services/scoring.js";

export const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export function html(strings, ...values) {
  return strings.reduce((out, s, i) => out + s + (i < values.length ? values[i] : ""), "");
}

export function fragment(markup) {
  const t = document.createElement("template");
  t.innerHTML = markup.trim();
  t.content.querySelectorAll("[data-icon]").forEach((el) => el.insertAdjacentHTML("afterbegin", icons[el.dataset.icon] || ""));
  return t.content;
}

/* Toast */
let toastTimer;
export function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

/* Modal with focus handling */
let lastFocus = null;
export function openModal(markup, onMount) {
  const modal = document.getElementById("modal");
  const body = document.getElementById("modal-body");
  lastFocus = document.activeElement;
  body.replaceChildren(fragment(markup));
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  onMount?.(body);
  const first = body.querySelector("button:not([disabled]), [href], input, select, textarea") || modal.querySelector(".modal-x");
  first?.focus();
}

export function closeModal() {
  const modal = document.getElementById("modal");
  if (modal.hidden) return;
  modal.hidden = true;
  document.body.style.overflow = "";
  lastFocus?.focus?.();
}

export function initModal() {
  const modal = document.getElementById("modal");
  modal.addEventListener("click", (event) => event.target.closest("[data-close]") && closeModal());
  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") closeModal();
    if (event.key === "Tab") {
      const items = [...modal.querySelectorAll("button:not([disabled]), [href], input, select, textarea")].filter((el) => el.offsetParent);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

/** A radio segmented control. */
export function bindSegment(root, onChange) {
  const buttons = [...root.querySelectorAll("[role=radio]")];
  const set = (value, focus) => {
    buttons.forEach((b) => {
      const on = b.dataset.value === value;
      b.setAttribute("aria-checked", String(on));
      b.tabIndex = on ? 0 : -1;
      if (on && focus) b.focus();
    });
    onChange(value);
  };
  buttons.forEach((b, i) => {
    b.addEventListener("click", () => set(b.dataset.value));
    b.addEventListener("keydown", (event) => {
      if (!["ArrowRight", "ArrowLeft"].includes(event.key)) return;
      event.preventDefault();
      set(buttons[(i + (event.key === "ArrowRight" ? 1 : buttons.length - 1)) % buttons.length].dataset.value, true);
    });
  });
}

export const segment = (name, options, value) =>
  `<div class="seg-full${options.length === 2 ? " seg-small" : ""}" role="radiogroup" aria-label="${esc(name)}">${options
    .map(
      ([v, label]) =>
        `<button type="button" role="radio" data-value="${v}" aria-checked="${v === value}" tabindex="${v === value ? 0 : -1}">${esc(label)}</button>`,
    )
    .join("")}</div>`;

export const chainName = (chains, id) => chains.find((c) => c.id === id)?.name ?? id;

export function relativeTime(iso) {
  if (!iso) return "";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.round(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)} h ago`;
  return new Date(iso).toLocaleDateString();
}

export const timeStamp = (iso) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" }) : "");

const availability = {
  active: ["ok", "Active"],
  degraded: ["warn", "Degraded"],
  paused: ["", "Paused"],
};
export const availabilityTag = (value) => {
  const [tone, label] = availability[value] ?? ["", value || "Unknown"];
  return `<span class="tag ${tone}">${esc(label)}</span>`;
};

/** Route option list. Returns markup; selection is bound by bindRoutes. */
export function routeList(routes, selectedId) {
  if (!routes.length) {
    return `<div class="empty"><span data-icon="route"></span>No compatible route for this pair.</div>`;
  }
  return `<div class="routes" role="radiogroup" aria-label="Available routes">${routes
    .map((r) => {
      const off = !r.eligible;
      const checked = !off && r.providerId === selectedId;
      const badges = [
        r.best ? `<span class="badge">Best</span>` : "",
        r.availability === "degraded" ? `<span class="badge warn">Degraded</span>` : "",
        off ? `<span class="badge off">Paused</span>` : "",
      ].join("");
      return `<button type="button" class="route${off ? " off" : ""}" role="radio" aria-checked="${checked}" ${off ? 'aria-disabled="true"' : ""} data-id="${esc(r.providerId)}" tabindex="${checked ? 0 : -1}">
        <span class="radio" aria-hidden="true"></span>
        <span class="pv"><b>${esc(r.provider)}${badges}</b><small>${off ? "Not eligible now" : `Score ${Math.round((r.score ?? 0) * 100)}`}</small></span>
        <span class="kv"><span>Cost</span><span>${formatUsd(r.costUsd)}</span></span>
        <span class="kv"><span>ETA</span><span>${formatEta(r.etaSeconds)}</span></span>
        <span class="kv sec"><span>Security</span><span>${esc(r.security)}</span></span>
      </button>`;
    })
    .join("")}</div>`;
}

export function bindRoutes(root, onSelect) {
  const items = [...root.querySelectorAll(".route:not(.off)")];
  items.forEach((item, i) => {
    item.addEventListener("click", () => onSelect(item.dataset.id));
    item.addEventListener("keydown", (event) => {
      if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
      event.preventDefault();
      const next = items[(i + (event.key === "ArrowDown" ? 1 : items.length - 1)) % items.length];
      onSelect(next.dataset.id, true);
    });
  });
}

export const pathMarkup = (from, provider, to) =>
  `<div class="path" aria-label="Route path: ${esc(from)} to Cons to ${esc(provider)} to ${esc(to)}"><span class="pn">${esc(from)}</span><span class="pl"><i></i></span><span class="pn hub">Cons</span><span class="pl"><i></i></span><span class="pn sel">${esc(provider)}</span><span class="pl"><i></i></span><span class="pn">${esc(to)}</span></div>`;
