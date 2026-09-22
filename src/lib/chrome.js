/* Shared page chrome: brand marks, config driven links, mobile menu. */
import { consConfig } from "../config/cons.js";
import { icons, markSvg } from "./icons.js";

export function initChrome() {
  document.documentElement.classList.remove("no-js");

  document.querySelectorAll("[data-mark]").forEach((el, i) => {
    el.innerHTML = markSvg(`mk${i}`);
  });
  document.querySelectorAll("[data-icon]").forEach((el) => {
    el.insertAdjacentHTML("afterbegin", icons[el.dataset.icon] || "");
  });

  // Links resolved from config. An unconfigured link is removed, never left dead.
  document.querySelectorAll("[data-link]").forEach((el) => {
    const root = { docs: consConfig.docsUrl, github: consConfig.githubUrl }[el.dataset.link];
    if (!root) {
      el.remove();
      return;
    }
    const url = el.dataset.page ? root.replace(/\/?$/, "/") + el.dataset.page : root;
    el.setAttribute("href", url);
    if (/^https?:/i.test(url)) {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
    }
  });

  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = String(new Date().getFullYear())));

  const button = document.querySelector(".menu-btn");
  const menu = document.querySelector(".mobile-menu");
  if (button && menu) {
    const set = (open) => {
      button.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("open", open);
      menu.inert = !open;
    };
    set(false);
    button.addEventListener("click", () => set(button.getAttribute("aria-expanded") !== "true"));
    menu.addEventListener("click", (event) => event.target.closest("a") && set(false));
    document.addEventListener("keydown", (event) => event.key === "Escape" && set(false));
    window.matchMedia("(min-width: 961px)").addEventListener("change", (event) => event.matches && set(false));
  }
}
