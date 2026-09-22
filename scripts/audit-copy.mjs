/**
 * Copy and content audit.
 *
 *   1. No hyphen, en dash or em dash in the landing page's visible copy.
 *   2. No visible sentence over 15 words.
 *   3. Nothing left over from the reference frontend the design came from.
 *   4. No placeholder text and no hardcoded Solana address in source.
 *
 * Only real text nodes are checked for 1 and 2, so CSS, scripts and
 * attributes never trip the rules.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const failures = [];

const stripped = (html) =>
  html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<(pre|code)[\s\S]*?<\/\1>/gi, "")
    .replace(/<\/?(br|b|span|a)\b[^>]*>/gi, " ");

function visibleText(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<(pre|code)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|h1|h2|h3|h4|li|dt|dd|span|b|a|button|footer|figcaption)>/gi, " </$1>")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

for (const page of ["index.html", "app.html"]) {
  const text = visibleText(readFileSync(join(root, page), "utf8"));
  for (const [ch, name] of [["-", "hyphen"], ["–", "en dash"], ["—", "em dash"]]) {
    const i = text.indexOf(ch);
    if (i !== -1) failures.push(`${page}: ${name} in visible copy near "${text.slice(Math.max(0, i - 40), i + 40)}"`);
  }
  const nodes = [...stripped(readFileSync(join(root, page), "utf8")).matchAll(/>([^<>]+)</g)].map((m) => m[1].replace(/\s+/g, " ").trim()).filter(Boolean);
  for (const node of nodes) {
    for (const sentence of node.split(/(?<=[.!?])\s+/)) {
      const words = sentence.split(/\s+/).filter((w) => /[A-Za-z]/.test(w));
      if (words.length > 15) failures.push(`${page}: sentence over 15 words: "${sentence}"`);
    }
  }
}

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    if (["node_modules", "dist", ".git", "docs", "fonts"].includes(name)) continue;
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(html|js|mjs|css|json|md)$/.test(name) && !name.endsWith("package-lock.json")) files.push(path);
  }
};
walk(root);

const LEFTOVERS = [/\bmora\b/i, /framer/i, /analytics platform/i, /lorem ipsum/i, /\bTODO\b/, /\bMVP\b/, /roadmap/i, /presale/i, /tokenomics/i];
const ADDRESS = /["'`][1-9A-HJ-NP-Za-km-z]{32,44}["'`]/;
for (const file of files) {
  if (file.endsWith("audit-copy.mjs")) continue;
  const source = readFileSync(file, "utf8");
  for (const pattern of LEFTOVERS) if (pattern.test(source)) failures.push(`${file}: matches ${pattern}`);
  if (/\.(js|html)$/.test(file) && ADDRESS.test(source)) failures.push(`${file}: looks like a hardcoded Solana address`);
}

if (failures.length) {
  console.error(`Copy audit failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`Copy audit passed (${files.length} files)`);
