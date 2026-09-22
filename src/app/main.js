import { consConfig, integration } from "../config/cons.js";
import { initChrome } from "../lib/chrome.js";
import { markSvg } from "../lib/icons.js";
import { dataMode, getChains, getTokens } from "../services/routing.js";
import * as wallet from "../services/wallet.js";
import { esc, initModal, openModal, toast } from "./ui.js";
import { renderActivity, renderProviders, renderReceipt } from "./views/monitor.js";
import { renderRouteView } from "./views/route.js";

initChrome();
initModal();

const view = document.getElementById("view");
const crumb = document.getElementById("crumb");

const ROUTES = {
  token: { title: "Token routing", render: (ctx) => renderRouteView(view, ctx, "token") },
  message: { title: "Message routing", render: (ctx) => renderRouteView(view, ctx, "message") },
  activity: { title: "Activity", render: (ctx) => renderActivity(view, ctx) },
  receipt: { title: "Receipts", render: (ctx, arg) => renderReceipt(view, ctx, arg) },
  providers: { title: "Providers", render: (ctx) => renderProviders(view, ctx) },
};

/* Top bar and integration status, all read from the central config. */
function paintStatus() {
  document.getElementById("net-pill").textContent = consConfig.networkLabel;
  const mode = document.getElementById("mode-pill");
  mode.textContent = dataMode === "live" ? "Live API" : "Preview data";
  mode.className = `tag ${dataMode === "live" ? "ok" : "warn"}`;
  const short = (v) => `${v.slice(0, 4)}…${v.slice(-4)}`;
  const rows = [
    ["Program", integration.hasProgram ? short(consConfig.programId) : "Not deployed", integration.hasProgram],
    ["Routing API", integration.hasApi ? "Connected" : "Preview", integration.hasApi],
    ["Token mint", integration.hasTokenMint ? short(consConfig.tokenMintAddress) : "Coming Soon", integration.hasTokenMint],
    ["Cluster", consConfig.networkLabel, true],
  ];
  document.getElementById("integration").innerHTML = rows
    .map(([k, v, on]) => `<div><dt>${esc(k)}</dt><dd class="${on ? "" : "off"}" title="${esc(v)}">${esc(v)}</dd></div>`)
    .join("");
}

/* Wallet button: connects to read the public key only. No signing exists yet. */
const walletBtn = document.getElementById("wallet-btn");
function paintWallet() {
  walletBtn.querySelector(".wl").textContent = wallet.state.address ? wallet.shortAddress(wallet.state.address) : "Connect wallet";
  walletBtn.classList.toggle("btn-primary", !wallet.state.address);
  walletBtn.classList.toggle("btn-ghost", Boolean(wallet.state.address));
  walletBtn.setAttribute("aria-label", wallet.state.address ? `Wallet ${wallet.state.address}. Open wallet menu` : "Connect a Solana wallet");
}

async function connectWallet() {
  const found = wallet.detectWallets();
  if (!found.length) {
    openModal(`<div class="m-head"><h2 id="modal-title">No Solana wallet found</h2><p>Install a Solana wallet extension, then reload this page.</p></div>
      <div class="m-body"><div class="notice neutral"><span data-icon="info"></span><span>Cons only reads your public key here. It never asks for a seed phrase or private key.</span></div></div>
      <div class="m-foot"><button class="btn btn-primary" type="button" data-close>Close</button></div>`);
    return;
  }
  const connectTo = async (w) => {
    try {
      await wallet.connect(w);
      toast(`Connected ${w.name}`);
    } catch (error) {
      toast(error?.message || "Connection was cancelled.");
    }
  };
  if (found.length === 1) return connectTo(found[0]);
  openModal(
    `<div class="m-head"><h2 id="modal-title">Connect a wallet</h2><p>Cons reads the public key only.</p></div>
    <div class="m-body">${found.map((w, i) => `<button class="btn btn-ghost" type="button" data-w="${i}" style="justify-content:flex-start;height:46px"><span data-icon="wallet"></span>${esc(w.name)}</button>`).join("")}</div>`,
    (body) =>
      body.querySelectorAll("[data-w]").forEach((b) =>
        b.addEventListener("click", () => {
          document.getElementById("modal").hidden = true;
          document.body.style.overflow = "";
          connectTo(found[Number(b.dataset.w)]);
        }),
      ),
  );
}

walletBtn.addEventListener("click", () => {
  if (!wallet.state.address) return connectWallet();
  openModal(
    `<div class="m-head"><h2 id="modal-title">${esc(wallet.state.walletName)}</h2><p class="mono" style="word-break:break-all">${esc(wallet.state.address)}</p></div>
    <div class="m-foot"><button class="btn btn-ghost" type="button" id="w-copy">Copy address</button><button class="btn btn-primary" type="button" id="w-off">Disconnect</button></div>`,
    (body) => {
      body.querySelector("#w-copy").addEventListener("click", async () => {
        await navigator.clipboard?.writeText(wallet.state.address).catch(() => {});
        toast("Address copied");
      });
      body.querySelector("#w-off").addEventListener("click", async () => {
        await wallet.disconnect();
        document.getElementById("modal").hidden = true;
        document.body.style.overflow = "";
        toast("Wallet disconnected");
      });
    },
  );
});
wallet.onChange(paintWallet);

/* Router */
let leaveHandlers = [];
let ctxBase = null;

async function route() {
  const [, name = "token", ...rest] = (location.hash || "#/token").replace(/^#/, "").split("/");
  const key = ROUTES[name] ? name : "token";
  const arg = rest.length ? decodeURIComponent(rest.join("/")) : "";

  leaveHandlers.forEach((fn) => fn());
  leaveHandlers = [];

  document.querySelectorAll("[data-route]").forEach((a) => {
    if (a.dataset.route === key) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  crumb.textContent = ROUTES[key].title;
  document.title = `${ROUTES[key].title} | Cons App`;

  view.classList.remove("view-enter");
  void view.offsetWidth;
  view.classList.add("view-enter");

  try {
    if (!ctxBase) {
      const [chains, tokens] = await Promise.all([getChains(), getTokens()]);
      ctxBase = { chains, tokens, connectWallet, mark: (el) => (el.innerHTML = markSvg(`r${Math.random().toString(36).slice(2, 7)}`)) };
    }
    await ROUTES[key].render({ ...ctxBase, onLeave: (fn) => leaveHandlers.push(fn) }, arg);
  } catch (error) {
    view.innerHTML = `<div class="card empty">${esc(error?.message || "Something went wrong loading this view.")}</div>`;
  }
}

window.addEventListener("hashchange", () => {
  route();
  view.focus({ preventScroll: true });
  window.scrollTo({ top: 0 });
});

paintStatus();
paintWallet();
route();
