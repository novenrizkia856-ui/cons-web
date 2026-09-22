/* Token and message routing workspace. One view, two request kinds. */
import { copyText } from "../../lib/clipboard.js";
import { payloadBytes, validateAddress, validateAmount, validatePair } from "../../lib/validate.js";
import { getExecutionReadiness, prepareMessage, prepareTransfer } from "../../services/program.js";
import { dataMode, quoteRoutes } from "../../services/routing.js";
import { PREFERENCES, formatEta, formatUsd } from "../../services/scoring.js";
import * as wallet from "../../services/wallet.js";
import { bindRoutes, bindSegment, chainName, closeModal, esc, fragment, openModal, pathMarkup, routeList, segment, toast } from "../ui.js";

const state = {
  token: { source: "solana", destination: "base", token: "USDC", amount: "100", recipient: "", preference: "best", selected: null },
  message: { source: "solana", destination: "ethereum", target: "", payload: "", encoding: "text", preference: "best", delivery: "single", quorum: "2", expiry: "3600", selected: null },
};

const PREFS = Object.entries(PREFERENCES).map(([k, v]) => [k, v.label]);

export async function renderRouteView(view, ctx, kind) {
  const s = state[kind];
  const { chains, tokens } = ctx;
  const chainOptions = (value) => chains.map((c) => `<option value="${esc(c.id)}"${c.id === value ? " selected" : ""}>${esc(c.name)}</option>`).join("");
  const isToken = kind === "token";

  view.replaceChildren(
    fragment(`
    <div class="view-head">
      <div><h1>${isToken ? "Token routing" : "Message routing"}</h1>
      <p>${isToken ? "Move a supported asset. Cons compares every eligible route." : "Send an arbitrary payload to a program or contract."}</p></div>
    </div>
    ${dataMode === "preview" ? `<div class="notice"><span data-icon="info"></span><span>Routes below use illustrative preview data. No transaction is created from this page yet.</span></div>` : ""}
    <div class="work">
      <form class="card" id="req" novalidate>
        <div class="card-head">Request <span class="sub">${isToken ? "Token" : "Message"}</span></div>
        <div class="card-body">
          <div class="pair">
            <div class="field"><label for="f-src">From</label><select class="select" id="f-src" name="source">${chainOptions(s.source)}</select></div>
            <button class="swap" type="button" id="f-swap" aria-label="Swap networks"><span data-icon="swap"></span></button>
            <div class="field"><label for="f-dst">To</label><select class="select" id="f-dst" name="destination">${chainOptions(s.destination)}</select></div>
          </div>
          <p class="err" id="e-pair" role="alert"></p>
          ${
            isToken
              ? `<div class="field"><span class="label">Asset and amount</span>
              <div class="amount">
                <select class="select" id="f-token" name="token" aria-label="Token">${tokens.map((t) => `<option value="${esc(t.symbol)}"${t.symbol === s.token ? " selected" : ""}>${esc(t.symbol)}</option>`).join("")}</select>
                <input class="input mono" id="f-amount" name="amount" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${esc(s.amount)}" aria-label="Amount" aria-describedby="e-amount">
              </div><p class="err" id="e-amount"></p></div>
              <div class="field"><label for="f-recipient">Recipient <button type="button" class="inline-link" id="use-wallet" hidden>Use connected wallet</button></label>
                <input class="input mono" id="f-recipient" name="recipient" autocomplete="off" spellcheck="false" value="${esc(s.recipient)}" aria-describedby="e-recipient">
                <p class="err" id="e-recipient"></p></div>`
              : `<div class="field"><label for="f-target">Destination program or contract</label>
                <input class="input mono" id="f-target" name="target" autocomplete="off" spellcheck="false" value="${esc(s.target)}" aria-describedby="e-target">
                <p class="err" id="e-target"></p></div>
              <div class="field"><span class="label"><span>Payload</span><span class="hint" id="bytes">0 bytes</span></span>
                ${segment("Payload encoding", [["text", "Text"], ["hex", "Hex"]], s.encoding)}
                <textarea class="textarea" id="f-payload" name="payload" spellcheck="false" aria-label="Payload" aria-describedby="e-payload" placeholder="${s.encoding === "hex" ? "0x..." : "sync_state"}">${esc(s.payload)}</textarea>
                <p class="err" id="e-payload"></p></div>
              <details class="adv"><summary>Advanced <span data-icon="chevron"></span></summary><div class="adv-body">
                <div class="field"><span class="label">Delivery</span>${segment("Delivery", [["single", "Single route"], ["multi", "Multi path"]], s.delivery)}</div>
                <div class="field" id="quorum-field" ${s.delivery === "multi" ? "" : "hidden"}><label for="f-quorum">Quorum</label>
                  <select class="select" id="f-quorum"><option value="2"${s.quorum === "2" ? " selected" : ""}>2 of 3 confirmations</option><option value="3"${s.quorum === "3" ? " selected" : ""}>3 of 3 confirmations</option></select></div>
                <div class="field"><label for="f-expiry">Expiry</label>
                  <select class="select" id="f-expiry"><option value="600"${s.expiry === "600" ? " selected" : ""}>10 minutes</option><option value="3600"${s.expiry === "3600" ? " selected" : ""}>1 hour</option><option value="86400"${s.expiry === "86400" ? " selected" : ""}>24 hours</option></select></div>
              </div></details>`
          }
          <div class="field"><span class="label">Routing preference</span><div id="pref">${segment("Routing preference", PREFS, s.preference)}</div></div>
        </div>
      </form>

      <section class="card" aria-labelledby="routes-title">
        <div class="card-head"><span id="routes-title">Available routes</span><span class="sub" id="routes-count"></span></div>
        <div id="routes"></div>
        <div id="route-detail"></div>
      </section>
    </div>`),
  );

  const $ = (sel) => view.querySelector(sel);
  const kindOf = (id) => chains.find((c) => c.id === id)?.kind;
  let routes = [];
  let quoteSeq = 0;

  function errors() {
    const e = { pair: validatePair(s.source, s.destination) };
    if (isToken) {
      const decimals = tokens.find((t) => t.symbol === s.token)?.decimals ?? 6;
      e.amount = validateAmount(s.amount, decimals);
      e.recipient = s.recipient ? validateAddress(s.recipient, kindOf(s.destination)) : "Required.";
    } else {
      e.target = s.target ? validateAddress(s.target, kindOf(s.destination)) : "Required.";
      e.payload = payloadBytes(s.payload, s.encoding).error;
    }
    return e;
  }

  /* Show an error only once the field has been touched. */
  const touched = new Set();
  function paintErrors() {
    const e = errors();
    for (const [key, message] of Object.entries(e)) {
      const out = $(`#e-${key}`);
      if (!out) continue;
      const show = key === "pair" || touched.has(key) ? message : "";
      out.textContent = show;
      const input = $(`#f-${key}`);
      input?.setAttribute("aria-invalid", String(Boolean(show)));
    }
    return e;
  }

  function syncHints() {
    const dstKind = kindOf(s.destination);
    const placeholder = dstKind === "solana" ? "Solana wallet address" : "0x address";
    if (isToken) {
      $("#f-recipient").placeholder = placeholder;
      $("#use-wallet").hidden = !(dstKind === "solana" && wallet.state.address);
    } else {
      $("#f-target").placeholder = dstKind === "solana" ? "Program ID" : "0x contract address";
      const { bytes } = payloadBytes(s.payload, s.encoding);
      $("#bytes").textContent = `${bytes} bytes`;
    }
  }

  function renderDetail() {
    const host = $("#route-detail");
    const route = routes.find((r) => r.providerId === s.selected);
    if (!route) {
      host.replaceChildren();
      return;
    }
    const valid = Object.values(errors()).every((m) => !m);
    host.replaceChildren(
      fragment(`
      ${pathMarkup(chainName(chains, s.source), route.provider, chainName(chains, s.destination))}
      <div class="summary"><div><span>Est. cost</span><b>${formatUsd(route.costUsd)}</b></div><div><span>Est. time</span><b>${formatEta(route.etaSeconds)}</b></div><div><span>Security</span><b>${esc(route.security)}</b></div></div>
      <div class="card-foot"><p>${valid ? "Ready to review." : "Complete the request to review."}</p>
      <button class="btn btn-primary" type="button" id="review" ${valid ? "" : "disabled"}>Review route</button></div>`),
    );
    $("#review").addEventListener("click", () => review(route));
  }

  function renderRoutes() {
    const host = $("#routes");
    const eligible = routes.filter((r) => r.eligible);
    if (!eligible.some((r) => r.providerId === s.selected)) s.selected = eligible.find((r) => r.best)?.providerId ?? null;
    $("#routes-count").textContent = routes.length ? `${eligible.length} eligible of ${routes.length}${dataMode === "preview" ? " · illustrative" : ""}` : "";
    host.replaceChildren(fragment(routeList(routes, s.selected)));
    bindRoutes(host, (id, focus) => {
      s.selected = id;
      host.querySelectorAll(".route").forEach((el) => {
        const on = el.dataset.id === id;
        el.setAttribute("aria-checked", String(on));
        el.tabIndex = on ? 0 : -1;
        if (on && focus) el.focus();
      });
      renderDetail();
    });
    renderDetail();
  }

  async function requote() {
    const pairError = validatePair(s.source, s.destination);
    const host = $("#routes");
    if (pairError) {
      routes = [];
      $("#routes-count").textContent = "";
      host.replaceChildren(fragment(`<div class="empty"><span data-icon="route"></span>${esc(pairError)}</div>`));
      $("#route-detail").replaceChildren();
      return;
    }
    const seq = ++quoteSeq;
    host.replaceChildren(fragment(`<div class="routes"><div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div></div>`));
    try {
      const request = isToken
        ? { kind, source: s.source, destination: s.destination, token: s.token, amount: Number(s.amount) || 0, preference: s.preference }
        : { kind, source: s.source, destination: s.destination, payloadBytes: payloadBytes(s.payload, s.encoding).bytes, preference: s.preference };
      const [result] = await Promise.all([quoteRoutes(request), new Promise((r) => setTimeout(r, 280))]);
      if (seq !== quoteSeq) return;
      routes = result;
      renderRoutes();
    } catch (error) {
      if (seq !== quoteSeq) return;
      routes = [];
      host.replaceChildren(fragment(`<div class="empty"><span data-icon="info"></span>${esc(error.message || "Routes could not be loaded.")}</div>`));
    }
  }

  let timer;
  const requoteSoon = () => {
    clearTimeout(timer);
    timer = setTimeout(requote, 250);
  };

  function requestObject(route) {
    const base = { sourceChain: s.source, destinationChain: s.destination, priority: s.preference, route: route.providerId };
    return isToken
      ? { ...base, token: s.token, amount: s.amount, recipient: s.recipient.trim() }
      : {
          ...base,
          recipient: s.target.trim(),
          payload: s.payload,
          encoding: s.encoding,
          delivery: s.delivery === "multi" ? { mode: "multi_path", quorum: `${s.quorum}_of_3` } : { mode: "single" },
          expirySeconds: Number(s.expiry),
        };
  }

  function review(route) {
    const readiness = getExecutionReadiness({ walletAddress: wallet.state.address });
    const rows = [
      ["From", chainName(chains, s.source)],
      ["To", chainName(chains, s.destination)],
      ...(isToken
        ? [["Asset", `${s.amount} ${s.token}`], ["Recipient", s.recipient]]
        : [["Destination", s.target], ["Payload", `${payloadBytes(s.payload, s.encoding).bytes} bytes`], ["Delivery", s.delivery === "multi" ? `Multi path, ${s.quorum} of 3` : "Single route"]]),
      ["Route", route.provider],
      ["Est. cost", formatUsd(route.costUsd)],
      ["Est. time", formatEta(route.etaSeconds)],
      ["Preference", PREFERENCES[s.preference].label],
    ];
    const canAct = readiness.status === "ready" || readiness.status === "no-wallet";
    openModal(
      `<div class="m-head"><h2 id="modal-title">Review route</h2><p>Check the request before it goes to your wallet.</p></div>
      <div class="m-body">
        <dl class="m-list">${rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd title="${esc(v)}">${esc(v)}</dd></div>`).join("")}</dl>
        <div class="notice ${canAct ? "neutral" : ""}"><span data-icon="${canAct ? "info" : "lock"}"></span><span>${esc(readiness.detail)}</span></div>
      </div>
      <div class="m-foot">
        <button class="btn btn-ghost" type="button" id="m-copy"><span data-icon="code"></span>Copy request</button>
        <button class="btn btn-primary" type="button" id="m-go" ${canAct ? "" : "disabled"}>${esc(readiness.label)}</button>
      </div>`,
      (body) => {
        body.querySelector("#m-copy").addEventListener("click", async () => {
          const ok = await copyText(JSON.stringify(requestObject(route), null, 2));
          toast(ok ? "Request JSON copied" : "Copy failed");
        });
        body.querySelector("#m-go").addEventListener("click", async () => {
          if (readiness.status === "no-wallet") {
            closeModal();
            ctx.connectWallet();
            return;
          }
          try {
            await (isToken ? prepareTransfer : prepareMessage)(requestObject(route), route, wallet.state.address);
          } catch (error) {
            toast(error.message);
          }
        });
      },
    );
  }

  /* Bindings */
  const form = $("#req");
  form.addEventListener("submit", (event) => event.preventDefault());
  $("#f-src").addEventListener("change", (e) => {
    s.source = e.target.value;
    syncHints();
    paintErrors();
    requoteSoon();
  });
  $("#f-dst").addEventListener("change", (e) => {
    s.destination = e.target.value;
    syncHints();
    paintErrors();
    requoteSoon();
  });
  $("#f-swap").addEventListener("click", (e) => {
    [s.source, s.destination] = [s.destination, s.source];
    $("#f-src").value = s.source;
    $("#f-dst").value = s.destination;
    e.currentTarget.classList.toggle("spin");
    syncHints();
    paintErrors();
    requoteSoon();
  });

  const onField = (id, key, requote = false) => {
    const input = $(id);
    input.addEventListener("input", () => {
      s[key] = input.value;
      if (touched.has(key)) paintErrors();
      syncHints();
      if (requote) requoteSoon();
      else renderDetail();
    });
    input.addEventListener("blur", () => {
      touched.add(key);
      paintErrors();
      renderDetail();
    });
  };

  if (isToken) {
    $("#f-token").addEventListener("change", (e) => {
      s.token = e.target.value;
      requoteSoon();
    });
    onField("#f-amount", "amount", true);
    onField("#f-recipient", "recipient");
    $("#use-wallet").addEventListener("click", () => {
      s.recipient = wallet.state.address;
      $("#f-recipient").value = s.recipient;
      touched.add("recipient");
      paintErrors();
      renderDetail();
    });
  } else {
    onField("#f-target", "target");
    onField("#f-payload", "payload", true);
    bindSegment(view.querySelector('[aria-label="Payload encoding"]'), (value) => {
      if (value === s.encoding) return;
      s.encoding = value;
      $("#f-payload").placeholder = value === "hex" ? "0x..." : "sync_state";
      syncHints();
      if (touched.has("payload")) paintErrors();
      requoteSoon();
    });
    bindSegment(view.querySelector('[aria-label="Delivery"]'), (value) => {
      s.delivery = value;
      $("#quorum-field").hidden = value !== "multi";
    });
    $("#f-quorum").addEventListener("change", (e) => (s.quorum = e.target.value));
    $("#f-expiry").addEventListener("change", (e) => (s.expiry = e.target.value));
  }

  bindSegment($("#pref"), (value) => {
    if (value === s.preference) return;
    s.preference = value;
    s.selected = null;
    requote();
  });

  const offWallet = wallet.onChange(() => view.isConnected && syncHints());
  ctx.onLeave(offWallet);

  syncHints();
  paintErrors();
  await requote();
}
