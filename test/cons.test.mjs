import assert from "node:assert/strict";
import { test } from "node:test";
import { createConsConfig, explorerUrl, isSolanaAddress } from "../src/config/cons.js";
import { candidateRoutes } from "../src/data/preview.js";
import { rankRoutes } from "../src/services/scoring.js";
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
    PUBLIC_CONS_TOKEN_MINT: "not-an-address",
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
