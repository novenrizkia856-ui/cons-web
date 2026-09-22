/* Activity, Receipt and Providers views. */
import { consConfig, explorerUrl } from "../../config/cons.js";
import { copyButton } from "../../lib/clipboard.js";
import { ALT_STATES, MAIN_PATH, STATES, stateLabel, stateTone } from "../../data/lifecycle.js";
import { dataMode, getActivity, getProviders, getRequest } from "../../services/routing.js";
import { availabilityTag, chainName, esc, fragment, relativeTime, timeStamp } from "../ui.js";

const statusTag = (status) => `<span class="tag ${stateTone(status)}">${esc(stateLabel(status))}</span>`;
const previewNotice = (text) => (dataMode === "preview" ? `<div class="notice"><span data-icon="info"></span><span>${text}</span></div>` : "");

/* Activity */
const activityState = { filter: "ALL", query: "" };

export async function renderActivity(view, ctx) {
  const items = await getActivity();
  const counts = items.reduce((acc, item) => ((acc[item.status] = (acc[item.status] || 0) + 1), acc), {});
  const filters = [["ALL", "All", items.length], ...[...MAIN_PATH, ...ALT_STATES].map((key) => [key, STATES[key].label, counts[key] || 0])];

  view.replaceChildren(
    fragment(`
    <div class="view-head"><div><h1>Activity</h1><p>Every request in one status model.</p></div>
      ${dataMode === "preview" ? `<span class="tag warn">Sample data</span>` : ""}</div>
    ${previewNotice("These are sample requests that show each lifecycle state. Live activity appears once the Cons API is configured.")}
    <div class="toolbar">
      <div class="filters" role="group" aria-label="Filter by status">${filters
        .map(([key, label, n]) => `<button type="button" data-f="${key}" aria-pressed="${key === activityState.filter}">${esc(label)}<span class="n">${n}</span></button>`)
        .join("")}</div>
      <label class="search"><span class="sr-only">Search by request ID</span><span data-icon="search"></span><input class="input mono" id="q" placeholder="Request ID" value="${esc(activityState.query)}" autocomplete="off"></label>
    </div>
    <div class="table" id="list"></div>`),
  );

  const list = view.querySelector("#list");
  function paint() {
    const q = activityState.query.trim().toLowerCase();
    const rows = items.filter((i) => (activityState.filter === "ALL" || i.status === activityState.filter) && (!q || i.requestId.toLowerCase().includes(q)));
    if (!items.length) {
      list.replaceChildren(fragment(`<div class="empty"><span data-icon="activity"></span>No requests from this browser yet.<a class="btn btn-ghost btn-sm" href="#/receipt">Look up a request</a></div>`));
      return;
    }
    if (!rows.length) {
      list.replaceChildren(fragment(`<div class="empty"><span data-icon="search"></span>No request matches.</div>`));
      return;
    }
    list.replaceChildren(
      fragment(`<div class="tr th"><span>Request</span><span>Type</span><span>Route</span><span>Detail</span><span>Provider</span><span>Status</span><span>Submitted</span></div>
      ${rows
        .map(
          (i) => `<a class="tr" href="#/receipt/${encodeURIComponent(i.requestId)}">
          <span class="id">${esc(i.requestId)}</span>
          <span class="muted">${i.kind === "token" ? "Token" : "Message"}</span>
          <span class="rt">${esc(chainName(ctx.chains, i.source))}<span data-icon="arrow"></span>${esc(chainName(ctx.chains, i.destination))}</span>
          <span class="muted">${i.kind === "token" ? `${esc(i.amount)} ${esc(i.asset)}` : `${i.payloadBytes ?? 0} bytes`}</span>
          <span>${esc(i.provider)}</span>
          <span>${statusTag(i.status)}</span>
          <span class="muted">${esc(relativeTime(i.submittedAt))}</span></a>`,
        )
        .join("")}`),
    );
  }

  view.querySelectorAll("[data-f]").forEach((button) =>
    button.addEventListener("click", () => {
      activityState.filter = button.dataset.f;
      view.querySelectorAll("[data-f]").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      paint();
    }),
  );
  view.querySelector("#q").addEventListener("input", (e) => {
    activityState.query = e.target.value;
    paint();
  });
  paint();
}

/* Receipt */
function lifecycleSteps(item) {
  const history = item.history?.length ? item.history : [item.status];
  const failed = ["FAILED", "EXPIRED", "CANCELLED"].includes(item.status);
  const reachedMain = history.filter((s) => MAIN_PATH.includes(s));
  const lastMain = reachedMain[reachedMain.length - 1];
  const upto = MAIN_PATH.indexOf(lastMain);
  const steps = MAIN_PATH.map((key, i) => {
    let cls = "";
    if (i < upto || (i === upto && (item.status === "CONFIRMED" || failed || item.status === "RETRYING"))) cls = "done";
    else if (i === upto) cls = "now";
    return { key, cls, label: STATES[key].label };
  });
  if (item.status === "RETRYING") steps.splice(upto + 1, 0, { key: "RETRYING", cls: "warn", label: "Retrying", note: "Same request, same route" });
  if (failed) {
    const cut = steps.findIndex((s) => s.cls === "" );
    const tail = { key: item.status, cls: item.status === "CANCELLED" ? "" : "bad", label: STATES[item.status].label, note: "Terminal state" };
    steps.splice(cut === -1 ? steps.length : cut, steps.length, tail);
  }
  return `<ol class="vstep">${steps.map((s) => `<li class="${s.cls}"><i></i><span>${esc(s.label)}${s.note ? `<small>${esc(s.note)}</small>` : ""}</span></li>`).join("")}</ol>`;
}

function field(label, value, { mono = false, copy = false, link = "" } = {}) {
  const na = value === null || value === undefined || value === "";
  const shown = na ? (dataMode === "preview" ? "Not available in preview" : "Pending") : value;
  return `<div><dt>${esc(label)}</dt><dd class="${mono ? "mono" : ""}${na ? " na" : ""}" title="${esc(na ? "" : value)}">${esc(shown)}</dd>
    <span class="acts">${copy && !na ? `<span data-copy="${esc(value)}" data-label="Copy ${esc(label.toLowerCase())}"></span>` : ""}${link ? `<a class="ext" href="${esc(link)}" target="_blank" rel="noopener noreferrer" aria-label="Open ${esc(label.toLowerCase())} in explorer" data-icon="external"></a>` : ""}</span></div>`;
}

export async function renderReceipt(view, ctx, id) {
  view.replaceChildren(
    fragment(`
    <div class="view-head"><div><h1>Receipt</h1><p>One normalized record for source, route and destination.</p></div></div>
    <form class="lookup" id="lookup" role="search"><label class="sr-only" for="rid">Request ID</label>
      <input class="input mono" id="rid" placeholder="Request ID" autocomplete="off" value="${esc(id || "")}">
      <button class="btn btn-ghost" type="submit"><span data-icon="search"></span>Look up</button></form>
    <div id="rc"></div>`),
  );
  view.querySelector("#lookup").addEventListener("submit", (e) => {
    e.preventDefault();
    const value = view.querySelector("#rid").value.trim();
    location.hash = value ? `#/receipt/${encodeURIComponent(value)}` : "#/receipt";
  });

  const host = view.querySelector("#rc");
  if (!id) {
    host.replaceChildren(
      fragment(
        dataMode === "preview"
          ? `<div class="card empty"><span data-icon="receipt"></span>Pick a sample request from Activity to see its receipt.<a class="btn btn-ghost btn-sm" href="#/activity">Open Activity</a></div>`
          : `<div class="card empty"><span data-icon="receipt"></span>Enter a request ID to load its receipt.</div>`,
      ),
    );
    return;
  }

  host.replaceChildren(fragment(`<div class="skeleton" style="height:320px"></div>`));
  let item;
  try {
    item = await getRequest(id);
  } catch (error) {
    host.replaceChildren(fragment(`<div class="card empty"><span data-icon="info"></span>${esc(error.message)}</div>`));
    return;
  }
  if (!item) {
    host.replaceChildren(fragment(`<div class="card empty"><span data-icon="search"></span>No request found for ${esc(id)}.</div>`));
    return;
  }

  const solanaSource = item.source === "solana";
  const solanaDest = item.destination === "solana";
  host.replaceChildren(
    fragment(`
    ${item.sample ? previewNotice("Sample receipt. Transaction fields stay empty because no real transaction exists.") : ""}
    <div class="receipt-wrap">
      <article class="card rcpt">
        <div class="rcpt-head"><span data-mark-inline></span><b>Route receipt</b>${statusTag(item.status)}</div>
        <dl>
          ${field("Request ID", item.requestId, { mono: true, copy: true })}
          ${field("Type", item.kind === "token" ? `Token · ${item.amount ?? ""} ${item.asset ?? ""}`.trim() : "Message")}
          ${field("Source chain", chainName(ctx.chains, item.source))}
          ${field("Destination chain", chainName(ctx.chains, item.destination))}
          ${field(solanaSource ? "Source signature" : "Source transaction", item.sourceTx, { mono: true, copy: true, link: solanaSource ? explorerUrl("tx", item.sourceTx) : "" })}
          ${field(solanaDest ? "Destination signature" : "Destination transaction", item.destinationTx, { mono: true, copy: true, link: solanaDest ? explorerUrl("tx", item.destinationTx) : "" })}
          ${field("Provider", item.provider)}
          ${field("Status", stateLabel(item.status))}
          ${field("Submitted", timeStamp(item.submittedAt))}
          ${field("Confirmed", timeStamp(item.confirmedAt))}
        </dl>
      </article>
      <aside class="card"><div class="card-head">Lifecycle <span class="sub">${esc(consConfig.networkLabel)}</span></div>${lifecycleSteps(item)}</aside>
    </div>`),
  );
  host.querySelectorAll("[data-copy]").forEach((el) => el.replaceWith(copyButton(el.dataset.copy, { label: el.dataset.label })));
  host.querySelectorAll("[data-mark-inline]").forEach((el) => ctx.mark(el));
}

/* Providers */
export async function renderProviders(view, ctx) {
  view.replaceChildren(fragment(`<div class="view-head"><div><h1>Providers</h1><p>Supported is not the same as usable. Both are shown.</p></div></div><div class="skeleton" style="height:200px"></div>`));
  let providers = [];
  try {
    providers = await getProviders();
  } catch (error) {
    view.querySelector(".skeleton").replaceWith(fragment(`<div class="card empty"><span data-icon="info"></span>${esc(error.message)}</div>`));
    return;
  }
  const dot = (a) => (a === "active" ? "ok" : a === "degraded" ? "warn" : "");
  view.replaceChildren(
    fragment(`
    <div class="view-head"><div><h1>Providers</h1><p>Supported is not the same as usable. Both are shown.</p></div>
      ${dataMode === "preview" ? `<span class="tag warn">Illustrative</span>` : ""}</div>
    ${previewNotice("Provider A to E are placeholders that show how providers are compared. They are not real integrations or measurements.")}
    <div class="pgrid">${providers
      .map(
        (p) => `<article class="card pcard">
        <div class="pcard-top"><b><span class="hdot ${dot(p.availability)}" aria-hidden="true"></span>${esc(p.name)}</b>${availabilityTag(p.availability)}</div>
        <dl>
          <div><dt>Routes</dt><dd class="chips">${(p.kinds || []).map((k) => `<span>${k === "token" ? "Token" : "Message"}</span>`).join("")}</dd></div>
          <div><dt>Chains</dt><dd class="chips">${(p.chains || []).map((c) => `<span>${esc(chainName(ctx.chains, c))}</span>`).join("")}</dd></div>
          <div><dt>Security tier</dt><dd>${esc(p.security ?? "")}</dd></div>
          <div><dt>Security model</dt><dd>${esc(p.securityModel ?? "Provider defined")}</dd></div>
          <div><dt>Eligible now</dt><dd>${p.availability === "paused" ? "No" : "Yes"}</dd></div>
        </dl>
      </article>`,
      )
      .join("")}</div>`),
  );
}
