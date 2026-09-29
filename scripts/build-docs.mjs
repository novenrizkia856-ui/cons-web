/**
 * Render content/docs/**\/*.md into public/docs as a static docs site.
 *
 * Nav order and groups come from content/docs/SUMMARY.md, GitBook style:
 * a "## Group" heading followed by its page links. Pages are flattened, so
 * core/token-routing.md is published as /docs/token-routing.html.
 *
 * Each page gets a grouped browse rail, a breadcrumb, heading anchors, an
 * "On this page" outline and a pager. The ASCII diagrams in the doc set are
 * drawn as real diagrams; anything unrecognised stays a code block. A search
 * index is written next to the pages for docs.js. `marked` runs here only;
 * visitors get plain HTML.
 *
 *   node scripts/build-docs.mjs
 */
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { Marked } from "marked";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const source = join(root, "content", "docs");
const out = join(root, "public", "docs");

const pageFor = (file) => (basename(file) === "README.md" ? "index.html" : basename(file).replace(/\.md$/, ".html"));
const escape = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const stripTags = (html) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const slugify = (text) => text.toLowerCase().replace(/&[a-z]+;/g, "").replace(/[^a-z0-9\s]/g, "").trim().replace(/\s+/g, "-") || "section";

/* One line per group, shown on the docs home cards. */
const GROUP_NOTES = {
  Overview: "What Cons is, what it covers and where it stops.",
  Architecture: "The components and the Solana program behind them.",
  Routing: "How tokens and messages move, and how a route is chosen.",
  Concepts: "Provider adapters, trust boundaries and failure handling.",
  Build: "Integrating Cons and watching routes in production.",
  Reference: "Terms used across the documentation.",
};

function readSummary() {
  const summary = readFileSync(join(source, "SUMMARY.md"), "utf8");
  const entries = [];
  let group = "Documentation";
  for (const line of summary.split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) group = heading[1].trim();
    const link = line.match(/^\s*[-*]\s*\[([^\]]+)\]\(([^)]+\.md)\)/);
    if (link) entries.push({ title: link[1].trim(), file: link[2].trim(), page: pageFor(link[2].trim()), group });
  }
  if (!entries.length) throw new Error("SUMMARY.md lists no pages");
  return entries;
}

/* ------------------------------------------------------------ icons ---- */
const ICON = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/></svg>',
  hash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
  up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/></svg>',
};

/* --------------------------------------------------------- diagrams ---- */

/* Diagram labels: SHOUTED labels read as title case, lifecycle states and
   short acronyms stay as they are. */
const KEEP = new Set(["SDK", "API", "CPI", "PDA", "USDC"]);
function label(raw) {
  const text = raw.trim();
  if (/^(CREATED|SUBMITTED|IN_TRANSIT|DESTINATION_RECEIVED|CONFIRMED)$/.test(text)) return { text, state: true };
  if (text !== text.toUpperCase() || !/[A-Z]/.test(text)) return { text };
  return { text: text.split(/(\s+|\/)/).map((w) => (KEEP.has(w) ? w : w.charAt(0) + w.slice(1).toLowerCase())).join("") };
}
const isCons = (text) => /^cons( program| router)?$/i.test(text.trim());

function nodeHtml(raw, extra = "") {
  const { text, state } = label(raw);
  const cls = ["dg-node", state ? "is-state" : "", isCons(text) ? "is-cons" : "", extra].filter(Boolean).join(" ");
  return `<span class="${cls}">${escape(text)}</span>`;
}

/* A step is a node, or a row of parallel nodes with an optional note. */
function flowHtml(steps, caption) {
  const parts = [];
  steps.forEach((step, i) => {
    if (i > 0) parts.push(`<li class="dg-link" aria-hidden="true">${step.via ? `<span>${escape(step.via)}</span>` : ""}</li>`);
    if (step.parallel) {
      const cells = step.parallel.map((n) => (typeof n === "string" ? nodeHtml(n) : `<span class="dg-node">${escape(n.text)}<small>${escape(n.sub)}</small></span>`));
      parts.push(`<li class="dg-step dg-row" style="--n:${step.parallel.length}">${cells.join("")}${step.note ? `<em>${escape(step.note)}</em>` : ""}</li>`);
    } else {
      parts.push(`<li class="dg-step">${nodeHtml(step.node)}</li>`);
    }
  });
  return `<figure class="docs-diagram" data-reveal><ol class="dg-flow">${parts.join("")}</ol>${caption ? `<figcaption>${escape(caption)}</figcaption>` : ""}</figure>`;
}

/* Linear flows: labels joined by lines made only of | and v, where a pipe
   line may carry an edge label such as "| CPI". */
function parseLinear(text) {
  const lines = text.split("\n").filter((l) => l.trim());
  const steps = [];
  let via = "";
  for (const line of lines) {
    const t = line.trim();
    if (/^[|v]$/.test(t)) continue;
    const edge = t.match(/^\|\s+([A-Za-z].*)$/);
    if (edge) {
      via = edge[1];
      continue;
    }
    if (/[|+\\/<>├└─]|->/.test(t.replace(/ \/ /g, " "))) return null;
    steps.push({ node: t, via });
    via = "";
  }
  const connectors = lines.filter((l) => /^[|v]/.test(l.trim())).length;
  return steps.length >= 2 && connectors >= steps.length - 1 ? steps : null;
}

/* Trees: a root line followed by ├── and └── children. */
function parseTree(text) {
  const [head, ...rest] = text.split("\n").filter((l) => l.trim());
  if (!rest.length || !rest.every((l) => /^[├└]──\s+/.test(l.trim()))) return null;
  return { root: head.trim(), children: rest.map((l) => l.trim().replace(/^[├└]──\s+/, "")) };
}

function treeHtml({ root, children }) {
  return `<figure class="docs-diagram" data-reveal><div class="dg-tree">${nodeHtml(root, "dg-root")}<ul>${children
    .map((c) => `<li>${nodeHtml(c)}</li>`)
    .join("")}</ul></div></figure>`;
}

/* The branching diagrams are drawn by hand from what their ASCII says. */
const BRANCHED = [
  {
    match: /SOLANA APPLICATION[\s\S]*ROUTING ENGINE[\s\S]*transport providers[\s\S]*EXTERNAL CHAIN/,
    html: () =>
      flowHtml([
        { node: "SOLANA APPLICATION" },
        { node: "CONS" },
        { node: "ROUTING ENGINE" },
        { parallel: ["Provider A", "Provider B", "Provider C"], note: "Transport providers" },
        { node: "EXTERNAL CHAIN" },
      ]),
  },
  {
    match: /APPLICATION \/ SDK[\s\S]*ROUTING API[\s\S]*PROVIDER ADAPTERS[\s\S]*DESTINATION CHAIN/,
    html: () =>
      flowHtml([
        { node: "APPLICATION / SDK" },
        { node: "ROUTING API" },
        { node: "ROUTING ENGINE" },
        { parallel: ["SOLANA PROGRAM", { text: "Provider Adapters", sub: "A · B · C" }] },
        { node: "CROSS-CHAIN TRANSPORT" },
        { node: "DESTINATION CHAIN" },
      ]),
  },
  {
    match: /SOLANA -+\+-> Provider B[\s\S]*QUORUM -> DESTINATION/,
    html: () =>
      flowHtml([
        { node: "SOLANA" },
        { parallel: ["Provider A", "Provider B", "Provider C"], note: "Independent transport paths" },
        { node: "QUORUM" },
        { node: "DESTINATION" },
      ]),
  },
];

/* Light highlighting for the JSON and TypeScript samples, done at build time. */
const TOKENS = /("[^"\n]*"\s*(?=:))|("[^"\n]*")|\b(interface|type|function|return|const|let|await|async|export|import|from|Promise)\b|\b(string|number|boolean|void|null|true|false|undefined)\b|(-?\b\d+(?:\.\d+)?\b)|([{}[\]();:,<>|?=]+)/g;
function highlight(text) {
  let html = "";
  let last = 0;
  for (const m of text.matchAll(TOKENS)) {
    html += escape(text.slice(last, m.index));
    const cls = m[1] ? "tok-n" : m[2] ? "tok-s" : m[3] ? "tok-k" : m[4] ? "tok-t" : m[5] ? "tok-t" : "tok-p";
    html += `<span class="${cls}">${escape(m[0])}</span>`;
    last = m.index + m[0].length;
  }
  return html + escape(text.slice(last));
}

function codeBlock(text, lang) {
  if (!lang || lang === "text") {
    const special = BRANCHED.find((b) => b.match.test(text));
    if (special) return special.html();
    const tree = parseTree(text);
    if (tree) return treeHtml(tree);
    const steps = parseLinear(text);
    if (steps) return flowHtml(steps);
    const lines = text.trim().split("\n");
    if (lines.length === 1) return `<p class="docs-rule"><span>Rule</span>${escape(lines[0])}</p>`;
  }
  const name = { ts: "TypeScript", json: "JSON", text: "Text", "": "Text" }[lang] ?? lang;
  return `<div class="docs-code"><div class="docs-code-bar"><span>${escape(name)}</span><button type="button" class="docs-copy" aria-label="Copy code">${ICON.copy}<span>Copy</span></button></div><pre><code${lang ? ` class="language-${escape(lang)}"` : ""}>${lang === "json" || lang === "ts" ? highlight(text) : escape(text)}</code></pre></div>`;
}

/* ----------------------------------------------------------- render ---- */

function renderPage(markdown) {
  const headings = [];
  const used = new Map();
  const marked = new Marked({
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        if (depth === 1) return `<h1>${inner}</h1>\n`;
        const text = stripTags(inner);
        const base = slugify(text);
        const n = used.get(base) || 0;
        used.set(base, n + 1);
        const id = n ? `${base}-${n + 1}` : base;
        if (depth <= 3) headings.push({ id, text, depth });
        return `<h${depth} id="${id}"><a class="docs-anchor" href="#${id}" aria-label="Link to this section">${ICON.hash}</a>${inner}</h${depth}>\n`;
      },
      code({ text, lang }) {
        return codeBlock(text, (lang || "").trim());
      },
      blockquote({ tokens }) {
        const body = this.parser.parse(tokens);
        const lead = body.match(/^<p><strong>([^<]+?):?<\/strong>:?\s*/);
        if (lead) {
          const title = lead[1].replace(/:$/, "");
          return `<aside class="docs-callout is-key"><p class="docs-callout-title">${title}</p>${body.replace(lead[0], "<p>")}</aside>\n`;
        }
        return `<aside class="docs-callout">${body}</aside>\n`;
      },
      table(token) {
        const cell = (c, tag) => {
          const align = c.align ? ` style="text-align:${c.align}"` : "";
          return `<${tag}${align}>${this.parser.parseInline(c.tokens)}</${tag}>`;
        };
        const head = `<tr>${token.header.map((c) => cell(c, "th")).join("")}</tr>`;
        const rows = token.rows.map((r) => `<tr>${r.map((c) => cell(c, "td")).join("")}</tr>`).join("");
        return `<div class="docs-table-wrap"><table><thead>${head}</thead><tbody>${rows}</tbody></table></div>\n`;
      },
    },
  });
  let html = marked.parse(markdown);
  html = html.replace(/href="([^"]+\.md)(#[^"]*)?"/g, (whole, target, hash = "") =>
    /^[a-z]+:/i.test(target) || target.startsWith("/") ? whole : `href="${pageFor(posix.basename(target))}${hash}"`,
  );
  /* The first paragraph under the title is the page's lede. */
  html = html.replace(/(<\/h1>\n)<p>/, '$1<p class="docs-lede">');
  return { html, headings };
}

/* Search sections: the text under each h2, keyed by its anchor. */
function searchSections(html) {
  const sections = [];
  const parts = html.split(/(?=<h2 id=")/);
  for (const part of parts) {
    const m = part.match(/^<h2 id="([^"]+)">([\s\S]*?)<\/h2>/);
    const plain = part.replace(/<h[12][^>]*>[\s\S]*?<\/h[12]>/g, " ").replace(/<\/(span|li|p|td|th|small)>/g, "$& ");
    const text = stripTags(plain).replace(/\s+([.,;:])/g, "$1").replace(/\s+/g, " ").trim();
    sections.push({ id: m ? m[1] : "", heading: m ? stripTags(m[2]) : "", text: text.slice(0, 1200) });
  }
  return sections;
}

function rail(entries, current) {
  const groups = [];
  for (const e of entries) {
    let g = groups.find((x) => x.name === e.group);
    if (!g) groups.push((g = { name: e.group, items: [] }));
    g.items.push(e);
  }
  const body = groups
    .map(
      (g) =>
        `<div class="rail-group"><p class="rail-label">${escape(g.name)}</p><ul>${g.items
          .map((e) => `<li><a href="${e.page}"${e.page === current ? ' aria-current="page"' : ""}>${escape(e.title)}</a></li>`)
          .join("")}</ul></div>`,
    )
    .join("");
  return `<nav class="docs-rail" id="docs-rail" aria-label="Documentation"><div class="rail-inner">${body}</div></nav>`;
}

function outline(headings) {
  const items = headings.filter((h) => h.depth === 2 || h.depth === 3);
  if (items.length < 2) return `<aside class="docs-outline" aria-hidden="true"></aside>`;
  return `<aside class="docs-outline" aria-label="On this page"><div class="outline-inner"><p class="rail-label">On this page</p><ul>${items
    .map((h) => `<li class="d${h.depth}"><a href="#${h.id}">${escape(h.text)}</a></li>`)
    .join("")}</ul><a class="outline-top" href="#top">${ICON.up}Back to top</a></div></aside>`;
}

function pager(entries, index) {
  const link = (entry, kind, word) =>
    entry
      ? `<a class="pager-${kind}" href="${entry.page}"><span>${word}</span><strong>${kind === "prev" ? ICON.back : ""}${escape(entry.title)}${kind === "next" ? ICON.arrow : ""}</strong></a>`
      : "<span></span>";
  return `<nav class="docs-pager" aria-label="Pages">${link(entries[index - 1], "prev", "Previous")}${link(entries[index + 1], "next", "Next")}</nav>`;
}

/* Docs home: one card per group, listing its pages. */
function homeCards(entries) {
  const groups = [];
  for (const e of entries.slice(1)) {
    let g = groups.find((x) => x.name === e.group);
    if (!g) groups.push((g = { name: e.group, items: [] }));
    g.items.push(e);
  }
  return `<section class="docs-home" aria-labelledby="explore"><h2 id="explore"><a class="docs-anchor" href="#explore" aria-label="Link to this section">${ICON.hash}</a>Explore the docs</h2><div class="home-grid">${groups
    .map(
      (g, i) =>
        `<a class="home-card" href="${g.items[0].page}"><span class="home-num">0${i + 1}</span><strong>${escape(g.name)}</strong><p>${escape(GROUP_NOTES[g.name] ?? "")}</p><ul>${g.items
          .map((e) => `<li>${escape(e.title)}</li>`)
          .join("")}</ul><span class="home-go">${ICON.arrow}</span></a>`,
    )
    .join("")}</div></section>`;
}

const wordsIn = (html) => stripTags(html).split(/\s+/).filter(Boolean).length;

function render(entry, index, entries, page) {
  const { html, headings } = page;
  const heading = stripTags(html.match(/<h1>([\s\S]*?)<\/h1>/)?.[1] ?? entry.title);
  const isHome = entry.page === "index.html";
  const title = isHome ? "Cons Docs" : `${heading} | Cons Docs`;
  const minutes = Math.max(1, Math.round(wordsIn(html) / 220));
  const intro = `<div class="docs-meta"><ol class="crumbs"><li><a href="index.html">Docs</a></li><li>${escape(entry.group)}</li></ol><span>${minutes} min read</span></div>`;
  const body = html.replace(/<h1>/, `${intro}<h1>`) + (isHome ? homeCards(entries) : "");
  const outlineHeadings = isHome ? [...headings, { id: "explore", text: "Explore the docs", depth: 2 }] : headings;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(`Cons documentation. ${heading}.`)}">
<meta name="theme-color" content="#fafafa">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="preload" href="/fonts/basier-circle-regular.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="docs.css">
<script>document.documentElement.classList.add("js")</script>
<script src="docs.js" defer></script>
</head>
<body id="top">
<a class="skip" href="#content">Skip to content</a>
<header class="docs-top">
  <div class="top-left">
    <button class="icon-btn menu-btn" type="button" aria-controls="docs-rail" aria-expanded="false" aria-label="Open navigation">${ICON.menu}</button>
    <a class="docs-brand" href="/" aria-label="Cons home"><img src="/brand/cons-wordmark-black.png" alt="Cons" width="719" height="192"></a>
    <a class="docs-tag" href="index.html">Docs</a>
  </div>
  <button class="search-btn" type="button" data-search-open aria-label="Search the docs">${ICON.search}<span>Search docs</span><kbd>Ctrl K</kbd></button>
  <div class="top-right">
    <button class="icon-btn search-icon" type="button" data-search-open aria-label="Search the docs">${ICON.search}</button>
    <a class="top-link" href="/">Home</a>
    <a class="top-cta" href="/app.html">Open App</a>
  </div>
</header>
<div class="docs-shell">
${rail(entries, entry.page)}
<main class="docs-main" id="content">
<article class="docs-article">
${body}
</article>
${pager(entries, index)}
<footer class="docs-foot"><span>Cons documentation</span><span>Page ${index + 1} of ${entries.length}</span></footer>
</main>
${outline(outlineHeadings)}
</div>
<div class="rail-scrim" hidden></div>
<div class="search" role="dialog" aria-modal="true" aria-label="Search the docs" hidden>
  <div class="search-panel">
    <label class="search-field">${ICON.search}<input type="search" placeholder="Search the docs" autocomplete="off" spellcheck="false" aria-controls="search-results"><kbd>Esc</kbd></label>
    <ul class="search-results" id="search-results" role="listbox" aria-label="Results"></ul>
    <p class="search-hint"><span><kbd>↑</kbd><kbd>↓</kbd> to move</span><span><kbd>Enter</kbd> to open</span></p>
  </div>
</div>
</body>
</html>
`;
}

const entries = readSummary();
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const index = [];
entries.forEach((entry, i) => {
  const page = renderPage(readFileSync(join(source, entry.file), "utf8"));
  writeFileSync(join(out, entry.page), render(entry, i, entries, page));
  index.push({ title: entry.title, group: entry.group, page: entry.page, sections: searchSections(page.html) });
});
writeFileSync(join(out, "search.json"), JSON.stringify(index));
copyFileSync(join(here, "docs.css"), join(out, "docs.css"));
copyFileSync(join(here, "docs.js"), join(out, "docs.js"));
console.log(`docs: ${entries.length} pages -> public/docs`);
