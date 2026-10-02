/* Cons Program wire format used by src/services/program.js. Offsets follow
   cons-programs/integration/idl/cons_router.json and the program's state.rs. */
import assert from "node:assert/strict";
import { test } from "node:test";
import { createConsConfig, parseAssetMints } from "../src/config/cons.js";
import {
  ACCOUNT,
  IX,
  base58Decode,
  base58Encode,
  decodeConfig,
  decodeRequest,
  destinationBytes,
  destinationTxText,
  encodeCreateRequest,
  encodeRefund,
  formatUnits,
  parseUnits,
  payloadToBytes,
  refundAction,
} from "../src/lib/cons-ix.js";

const KEY = new Uint8Array(32).fill(7);
const KEY58 = base58Encode(KEY);

test("base58 round trips keys, including leading zero bytes", () => {
  const zeroLed = new Uint8Array(32);
  zeroLed[31] = 9;
  for (const bytes of [KEY, zeroLed]) assert.deepEqual(base58Decode(base58Encode(bytes)), bytes);
  assert.equal(base58Encode(new Uint8Array(32)), "1".repeat(32));
});

test("amounts convert to base units without floating point", () => {
  assert.equal(parseUnits("100", 6), 100_000_000n);
  assert.equal(parseUnits("0.000001", 6), 1n);
  assert.equal(parseUnits("123456789.123456", 6), 123456789123456n);
  assert.throws(() => parseUnits("1.0000001", 6));
  assert.throws(() => parseUnits("1e3", 6));
  assert.equal(formatUnits(100_500_000n, 6), "100.5");
  assert.equal(formatUnits(1n, 6), "0.000001");
});

test("destination is 32 bytes: EVM addresses are left padded", () => {
  const evm = destinationBytes("0x00000000000000000000000000000000000000Ab", "evm");
  assert.equal(evm.length, 32);
  assert.ok(evm.subarray(0, 31).every((b) => b === 0));
  assert.equal(evm[31], 0xab);
  assert.deepEqual(destinationBytes(KEY58, "solana"), KEY);
  assert.throws(() => destinationBytes("0x1234", "evm"));
});

test("create_request encodes discriminator then borsh args", () => {
  const data = encodeCreateRequest({
    nonce: 0x0102030405060708n,
    amount: 250_000_000n,
    destinationChain: 8453,
    destination: KEY,
    messageHash: new Uint8Array(32).fill(4),
    providerHint: 3,
    expiresAt: 1_800_003_600,
  });
  const v = new DataView(data.buffer);
  assert.equal(data.length, 8 + 8 + 8 + 4 + 32 + 32 + 2 + 8);
  assert.deepEqual([...data.subarray(0, 8)], IX.createRequest);
  assert.equal(v.getBigUint64(8, true), 0x0102030405060708n);
  assert.equal(v.getBigUint64(16, true), 250_000_000n);
  assert.equal(v.getUint32(24, true), 8453);
  assert.deepEqual(data.subarray(28, 60), KEY);
  assert.ok(data.subarray(60, 92).every((b) => b === 4));
  assert.equal(v.getUint16(92, true), 3);
  assert.equal(v.getBigInt64(94, true), 1_800_003_600n);
  assert.deepEqual([...encodeRefund()], [...IX.updateRequest, 6]);
});

test("request and config accounts decode at the program's offsets", () => {
  const d = new Uint8Array(261);
  const v = new DataView(d.buffer);
  d.set(ACCOUNT.request, 0);
  d.set(KEY, 8); // requester
  v.setBigUint64(40, 42n, true); // nonce
  d[48] = 0; // token
  d[49] = 5; // Failed
  v.setUint32(50, 8453, true);
  v.setUint16(86, 7, true); // provider
  v.setBigUint64(120, 5_000_000n, true); // amount
  v.setBigInt64(160, 100n, true); // created
  v.setBigInt64(168, 3700n, true); // expires
  v.setBigInt64(176, 160n, true); // submitted
  d.fill(0xcd, 192, 224); // 32 byte destination tx
  d[256] = 2; // retries
  v.setUint16(257, 9, true); // failure code
  const r = decodeRequest(d);
  assert.equal(r.requester, KEY58);
  assert.equal(r.nonce, 42n);
  assert.equal(r.kind, "token");
  assert.equal(r.status, "FAILED");
  assert.equal(r.destinationChain, 8453);
  assert.equal(r.providerId, 7);
  assert.equal(r.amount, 5_000_000n);
  assert.equal(r.expiresAt, 3700);
  assert.equal(r.retryCount, 2);
  assert.equal(r.failureCode, 9);
  assert.equal(destinationTxText(r.destinationTx), `0x${"cd".repeat(32)}`);
  assert.throws(() => decodeRequest(d.subarray(0, 260)));
  // Accounts from the first mainnet build carry 8 trailing zero bytes.
  const padded = new Uint8Array(269);
  padded.set(d);
  assert.equal(decodeRequest(padded).failureCode, 9);

  const c = new Uint8Array(107);
  c.set(ACCOUNT.config, 0);
  c[104] = 1;
  assert.equal(decodeConfig(c).paused, true);
});

test("refund action follows the program's rules", () => {
  const r = { requester: KEY58, status: "CREATED", expiresAt: 1000 };
  assert.equal(refundAction(r, { now: 999, signer: KEY58 }), "cancel");
  assert.equal(refundAction(r, { now: 999, signer: "someone" }), "");
  assert.equal(refundAction(r, { now: 1000, signer: "" }), "expire");
  assert.equal(refundAction({ ...r, status: "RETRYING" }, { now: 999, signer: KEY58 }), "");
  assert.equal(refundAction({ ...r, status: "RETRYING" }, { now: 1000, signer: "" }), "expire");
  assert.equal(refundAction({ ...r, status: "IN_TRANSIT" }, { now: 5000, signer: KEY58 }), "");
});

test("payload bytes for text and hex", () => {
  assert.deepEqual([...payloadToBytes("hi", "text")], [104, 105]);
  assert.deepEqual([...payloadToBytes("0x0aff", "hex")], [10, 255]);
  assert.throws(() => payloadToBytes("0xabc", "hex"));
});

test("live routes parse token and message entries", async () => {
  const { parseLiveRoutes } = await import("../src/config/cons.js");
  assert.deepEqual(
    parseLiveRoutes("token:usdc:base, message:base, junk"),
    [{ kind: "token", token: "USDC", destination: "base" }, { kind: "message", destination: "base" }],
  );
  assert.equal(parseLiveRoutes("").length, 0);
  assert.equal(createConsConfig({ PUBLIC_CONS_MAX_TOKEN_AMOUNT: "1" }).maxTokenAmount, 1);
});

test("asset mints come from config and invalid entries are dropped", () => {
  assert.deepEqual({ ...parseAssetMints(`usdc=${KEY58}, USDT=bad, =${KEY58}`) }, { USDC: KEY58 });
  assert.deepEqual({ ...createConsConfig({}).assetMints }, {});
  assert.equal(createConsConfig({ PUBLIC_CONS_ASSET_MINTS: `USDC=${KEY58}` }).assetMints.USDC, KEY58);
});
