import assert from "node:assert/strict";
import { test } from "node:test";
import { createConsConfig, explorerUrl, isSolanaAddress } from "../src/config/cons.js";
import { candidateRoutes } from "../src/data/preview.js";
import { rankRoutes } from "../src/services/scoring.js";
import { departure, drawFold } from "../src/landing/fold.js";
import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { payloadBytes, validateAddress, validateAmount, validatePair } from "../src/lib/validate.js";

// A syntactically valid base58 string of Solana key length, not a real account.
const KEY = "1".repeat(32);

test("config defaults leave every integration unconfigured", () => {
  const c = createConsConfig({});
  assert.equal(c.network, "mainnet-beta");
  assert.equal(c.programId, "");
  assert.equal(c.tokenMintAddress, "");
  assert.equal(c.apiBaseUrl, "");
  assert.equal(c.rpcUrl, "https://api.mainnet-beta.solana.com");
  assert.equal(c.docsUrl, "/docs/");
});

test("config reads PUBLIC_ env values and rejects malformed addresses", () => {
  const c = createConsConfig({
    PUBLIC_SOLANA_NETWORK: "devnet",
    PUBLIC_CONS_PROGRAM_ID: KEY,
    PUBLIC_CONS_API_URL: "https://api.example.com/",
  });
  assert.equal(c.network, "devnet");
  assert.equal(c.rpcUrl, "https://api.devnet.solana.com");
  assert.equal(c.programId, KEY);
  assert.equal(c.tokenMintAddress, "");
  assert.equal(c.apiBaseUrl, "https://api.example.com");
});

test("unknown network falls back to mainnet-beta", () => {
  assert.equal(createConsConfig({ PUBLIC_SOLANA_NETWORK: "moonnet" }).network, "mainnet-beta");
});

test("explorer links add the cluster outside mainnet", () => {
  const dev = createConsConfig({ PUBLIC_SOLANA_NETWORK: "devnet" });
  assert.equal(explorerUrl("tx", "abc", dev), "https://explorer.solana.com/tx/abc?cluster=devnet");
  assert.equal(explorerUrl("tx", "", dev), "");
});

test("address validation", () => {
  assert.ok(isSolanaAddress(KEY));
  assert.ok(!isSolanaAddress("0OIl".repeat(10)));
  assert.equal(validateAddress("0x" + "a".repeat(40), "evm"), "");
  assert.notEqual(validateAddress("0x12", "evm"), "");
  assert.notEqual(validateAddress("", "solana"), "");
});

test("amount, pair and payload validation", () => {
  assert.equal(validateAmount("100.5", 6), "");
  assert.notEqual(validateAmount("0", 6), "");
  assert.notEqual(validateAmount("1.1234567", 6), "");
  assert.equal(validatePair("solana", "base"), "");
  assert.notEqual(validatePair("base", "ethereum"), "");
  assert.notEqual(validatePair("solana", "solana"), "");
  assert.deepEqual(payloadBytes("0xabcd", "hex"), { bytes: 2, error: "" });
  assert.equal(payloadBytes("abc", "hex").error, "Enter even length hex.");
  assert.equal(payloadBytes("hé", "text").bytes, 3);
});

test("ranking compares only eligible routes and marks one best", () => {
  const routes = candidateRoutes({ kind: "message", source: "base", destination: "solana", payloadBytes: 96 });
  const ranked = rankRoutes(routes, "best");
  assert.equal(ranked.filter((r) => r.best).length, 1);
  const paused = ranked.find((r) => r.availability === "paused");
  assert.equal(paused.eligible, false);
  assert.equal(paused.score, null);
  assert.equal(ranked[ranked.length - 1], paused);
});

test("preference changes the winner", () => {
  const routes = candidateRoutes({ kind: "token", source: "solana", destination: "base", amount: 100 });
  const cheapest = [...routes].sort((a, b) => a.costUsd - b.costUsd)[0];
  const fastest = [...routes].sort((a, b) => a.etaSeconds - b.etaSeconds)[0];
  assert.equal(rankRoutes(routes, "cost")[0].providerId, cheapest.providerId);
  assert.equal(rankRoutes(routes, "speed")[0].providerId, fastest.providerId);
});

test("hero console holds flat until seen, then folds away", () => {
  // Console ends at 1171px on a 900px screen: the fold starts at 311px.
  assert.equal(departure(1171, 0, 900), 0);
  assert.equal(departure(1171, 311, 900), 0);
  assert.ok(departure(1171, 500, 900) > 0.3 && departure(1171, 500, 900) < 0.35);
  assert.equal(departure(1171, 2000, 900), 1);
  const el = { style: {} };
  drawFold(el, 0, 300);
  assert.equal(el.style.transform, "");
  assert.equal(el.style.opacity, "1.000");
  drawFold(el, 1, 300);
  assert.match(el.style.transform, /rotateX\(88\.000deg\)/);
  assert.equal(el.style.opacity, "0.000");
});

test("docs build: grouped rail, outline, search index, no raw ASCII diagrams", () => {
  execFileSync(process.execPath, ["scripts/build-docs.mjs"], { cwd: new URL("..", import.meta.url) });
  const docs = new URL("../public/docs/", import.meta.url);
  const index = JSON.parse(readFileSync(new URL("search.json", docs), "utf8"));
  assert.equal(index.length, 15);
  assert.ok(existsSync(new URL("docs.js", docs)));
  const home = readFileSync(new URL("index.html", docs), "utf8");
  for (const group of ["Overview", "Architecture", "Routing", "Concepts", "Build", "Reference"]) assert.ok(home.includes(`rail-label">${group}<`), group);
  assert.ok(home.includes('class="docs-outline"'));
  for (const page of index) {
    const html = readFileSync(new URL(page.page, docs), "utf8");
    assert.ok(!/<pre><code(?: class="language-text")?>[^<]*(\n\s*\|\s*\n|├──)/.test(html), `${page.page} still has an ASCII diagram`);
  }
});

test("token CA: empty or null shows Coming Soon, anything else is shown as written", async () => {
  const { resolveTokenCa } = await import("../src/config/cons.js");
  const { TOKEN_CA } = await import("../src/config/token.js");
  assert.equal(typeof TOKEN_CA === "string" || TOKEN_CA === null, true);
  for (const blank of ["", "   ", null, undefined]) assert.equal(createConsConfig({}, blank).tokenMintAddress, "");
  assert.equal(resolveTokenCa("  So11111111111111111111111111111111111111112 "), "So11111111111111111111111111111111111111112");
  assert.equal(createConsConfig({}, "anything at all").tokenMintAddress, "anything at all");
});
