/**
 * Render content/docs/**\/*.md into public/docs as static HTML.
 *
 * The nav order comes from content/docs/SUMMARY.md. Pages are flattened, so
 * core/token-routing.md is published as /docs/token-routing.html.
 * `marked` runs here only; visitors get plain HTML.
 *
 *   node scripts/build-docs.mjs
 */
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { basename, dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const source = join(root, "content", "docs");
const out = join(root, "public", "docs");

const pageFor = (file) => (basename(file) === "README.md" ? "index.html" : basename(file).replace(/\.md$/, ".html"));
const escape = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function readSummary() {
  const summary = readFileSync(join(source, "SUMMARY.md"), "utf8");
  const entries = [];
  const line = /^\s*[-*]\s*\[([^\]]+)\]\(([^)]+\.md)\)/gm;
  let match;
  while ((match = line.exec(summary))) entries.push({ title: match[1].trim(), file: match[2].trim(), page: pageFor(match[2].trim()) });
  if (!entries.length) throw new Error("SUMMARY.md lists no pages");
  return entries;
}

const headingOf = (markdown, fallback) => markdown.match(/^#\s+(.+)$/m)?.[1].trim() ?? fallback;

/** In repo .md links become the flattened .html pages. */
function rewriteLinks(html) {
  return html.replace(/href="([^"]+\.md)(#[^"]*)?"/g, (whole, target, hash = "") =>
    /^[a-z]+:/i.test(target) || target.startsWith("/") ? whole : `href="${pageFor(posix.basename(target))}${hash}"`,
  );
}

const wrapTables = (html) => html.replace(/<table>[\s\S]*?<\/table>/g, (table) => `<div class="docs-table-wrap">${table}</div>`);

function nav(entries, current) {
  const items = entries
    .map((e) => `<li><a href="${e.page}"${e.page === current ? ' aria-current="page"' : ""}>${escape(e.title)}</a></li>`)
    .join("");
  return `<nav class="docs-nav" aria-label="Documentation"><p class="docs-nav-title">Documentation</p><ol>${items}</ol></nav>`;
}

function pager(entries, index) {
  const link = (entry, kind, label) =>
    entry ? `<a class="docs-pager-${kind}" href="${entry.page}"><span>${label}</span><strong>${escape(entry.title)}</strong></a>` : "";
  return `<div class="docs-pager">${link(entries[index - 1], "prev", "Previous")}${link(entries[index + 1], "next", "Next")}</div>`;
}

function render(entry, index, entries) {
  const markdown = readFileSync(join(source, entry.file), "utf8");
  const heading = headingOf(markdown, entry.title);
  const body = wrapTables(rewriteLinks(marked.parse(markdown)));
  const title = entry.page === "index.html" ? "Cons Docs" : `${heading} | Cons Docs`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(title)}</title>
<meta name="description" content="${escape(`Cons documentation. ${heading}.`)}">
<meta name="theme-color" content="#fafafa">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="stylesheet" href="docs.css">
</head>
<body>
<header class="docs-top">
  <a class="docs-brand" href="/" aria-label="Cons home"><img src="/brand/cons-wordmark-black.png" alt="Cons" width="719" height="192"></a>
  <div class="docs-top-right"><span class="docs-tag">Docs</span><a class="docs-home" href="/app.html">Open App</a><a class="docs-home" href="/">Home</a></div>
</header>
<div class="docs-shell">
${nav(entries, entry.page)}
<main class="docs-main">
${body}
${pager(entries, index)}
</main>
</div>
</body>
</html>
`;
}

const entries = readSummary();
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
entries.forEach((entry, index) => writeFileSync(join(out, entry.page), render(entry, index, entries)));
copyFileSync(join(here, "docs.css"), join(out, "docs.css"));
console.log(`docs: ${entries.length} pages -> public/docs`);
