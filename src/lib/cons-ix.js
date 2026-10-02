/**
 * Cons Program wire format, as pure functions (no web3, covered by tests).
 *
 * The program speaks Anchor's format: an 8 byte instruction discriminator
 * followed by borsh arguments, and accounts that start with an 8 byte
 * discriminator. Layouts match cons-programs/integration/idl/cons_router.json.
 */

export const IX = Object.freeze({
  createRequest: [219, 191, 93, 237, 18, 44, 42, 84],
  updateRequest: [0, 229, 201, 79, 235, 123, 130, 102],
});
export const ACCOUNT = Object.freeze({
  config: [155, 12, 170, 224, 30, 250, 204, 130],
  request: [125, 172, 150, 161, 162, 115, 39, 71],
});
/** `Action` enum tag of the Refund variant (update_request). */
export const ACTION_REFUND = 6;

export const STATUS = Object.freeze(["CREATED", "SUBMITTED", "IN_TRANSIT", "DESTINATION_RECEIVED", "CONFIRMED", "FAILED", "RETRYING", "EXPIRED", "CANCELLED"]);

/* Account sizes the live mainnet build allocates (its request accounts carry
   8 trailing zero bytes; a later upgrade moves new requests to 261). */
export const REQUEST_ACCOUNT_BYTES = 269;
export const VAULT_ACCOUNT_BYTES = 165;

/** Bounds enforced on chain for expires_at, relative to the cluster clock. */
export const MIN_EXPIRY_SECONDS = 60;
export const MAX_EXPIRY_SECONDS = 30 * 24 * 60 * 60;

const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

export function base58Decode(text) {
  let num = 0n;
  for (const ch of text) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) throw new Error("Invalid base58.");
    num = num * 58n + BigInt(i);
  }
  const bytes = [];
  while (num > 0n) {
    bytes.unshift(Number(num & 0xffn));
    num >>= 8n;
  }
  for (const ch of text) {
    if (ch !== "1") break;
    bytes.unshift(0);
  }
  return Uint8Array.from(bytes);
}

export function base58Encode(bytes) {
  let num = 0n;
  for (const b of bytes) num = (num << 8n) | BigInt(b);
  let out = "";
  while (num > 0n) {
    out = ALPHABET[Number(num % 58n)] + out;
    num /= 58n;
  }
  for (const b of bytes) {
    if (b !== 0) break;
    out = "1" + out;
  }
  return out;
}

/** Decimal string to integer base units, without floating point. */
export function parseUnits(value, decimals) {
  const v = String(value ?? "").trim();
  if (!/^\d+(\.\d+)?$/.test(v)) throw new Error("Enter a number.");
  const [whole, fraction = ""] = v.split(".");
  if (fraction.length > decimals) throw new Error(`Up to ${decimals} decimals.`);
  return BigInt(whole + fraction.padEnd(decimals, "0"));
}

export function formatUnits(units, decimals) {
  const s = BigInt(units).toString().padStart(decimals + 1, "0");
  const whole = s.slice(0, s.length - decimals);
  const fraction = s.slice(s.length - decimals).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

/** 32 byte destination: a Solana key, or a 20 byte EVM address left padded with zeros. */
export function destinationBytes(address, chainKind) {
  const v = String(address || "").trim();
  if (chainKind === "evm") {
    if (!/^0x[0-9a-fA-F]{40}$/.test(v)) throw new Error("Enter a valid 0x address.");
    const out = new Uint8Array(32);
    for (let i = 0; i < 20; i++) out[12 + i] = parseInt(v.slice(2 + i * 2, 4 + i * 2), 16);
    return out;
  }
  const key = base58Decode(v);
  if (key.length !== 32) throw new Error("Enter a valid Solana address.");
  return key;
}

/** Payload bytes for text or hex input. */
export function payloadToBytes(value, encoding) {
  const v = String(value || "");
  if (encoding !== "hex") return new TextEncoder().encode(v);
  const hex = v.trim().replace(/^0x/i, "");
  if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2) throw new Error("Enter even length hex.");
  return Uint8Array.from(hex.match(/../g) ?? [], (h) => parseInt(h, 16));
}

class Writer {
  constructor(size) {
    this.bytes = new Uint8Array(size);
    this.view = new DataView(this.bytes.buffer);
    this.at = 0;
  }
  put(bytes) {
    this.bytes.set(bytes, this.at);
    this.at += bytes.length;
    return this;
  }
  u16(v) {
    this.view.setUint16(this.at, v, true);
    this.at += 2;
    return this;
  }
  u32(v) {
    this.view.setUint32(this.at, v, true);
    this.at += 4;
    return this;
  }
  u64(v) {
    this.view.setBigUint64(this.at, BigInt(v), true);
    this.at += 8;
    return this;
  }
  i64(v) {
    this.view.setBigInt64(this.at, BigInt(v), true);
    this.at += 8;
    return this;
  }
}

export function u64Le(value) {
  return new Writer(8).u64(value).bytes;
}

/**
 * create_request(nonce, amount, destination_chain, destination, message_hash, provider_hint, expires_at)
 * Token requests pass amount > 0 (and the token accounts); message requests pass amount 0 and a non zero hash.
 */
export function encodeCreateRequest({ nonce, amount = 0n, destinationChain, destination, messageHash = new Uint8Array(32), providerHint = 0, expiresAt }) {
  if (destination.length !== 32 || messageHash.length !== 32) throw new Error("Destination and hash must be 32 bytes.");
  return new Writer(8 + 8 + 8 + 4 + 32 + 32 + 2 + 8)
    .put(IX.createRequest)
    .u64(nonce)
    .u64(amount)
    .u32(destinationChain)
    .put(destination)
    .put(messageHash)
    .u16(providerHint)
    .i64(expiresAt).bytes;
}

/** update_request(Action::Refund): cancel before expiry (requester), expire after it (anyone). */
export function encodeRefund() {
  return Uint8Array.from([...IX.updateRequest, ACTION_REFUND]);
}

const sameBytes = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/** Decode a Config account (107 bytes). */
export function decodeConfig(data) {
  const d = data instanceof Uint8Array ? data : Uint8Array.from(data);
  if (d.length !== 107 || !sameBytes(d.subarray(0, 8), ACCOUNT.config)) throw new Error("Not a Cons config account.");
  return {
    admin: base58Encode(d.subarray(8, 40)),
    operator: base58Encode(d.subarray(40, 72)),
    treasury: base58Encode(d.subarray(72, 104)),
    paused: d[104] === 1,
    version: d[105],
  };
}

/** Decode a Request account (261 bytes; trailing bytes are ignored, as Anchor does). */
export function decodeRequest(data) {
  const d = data instanceof Uint8Array ? data : Uint8Array.from(data);
  if (d.length < 261 || !sameBytes(d.subarray(0, 8), ACCOUNT.request)) throw new Error("Not a Cons request account.");
  const v = new DataView(d.buffer, d.byteOffset, d.byteLength);
  const i64 = (o) => Number(v.getBigInt64(o, true));
  return {
    requester: base58Encode(d.subarray(8, 40)),
    nonce: v.getBigUint64(40, true),
    kind: d[48] === 0 ? "token" : "message",
    status: STATUS[d[49]] ?? "CREATED",
    destinationChain: v.getUint32(50, true),
    destination: d.slice(54, 86),
    providerId: v.getUint16(86, true),
    mint: base58Encode(d.subarray(88, 120)),
    amount: v.getBigUint64(120, true),
    messageHash: d.slice(128, 160),
    createdAt: i64(160),
    expiresAt: i64(168),
    submittedAt: i64(176),
    confirmedAt: i64(184),
    destinationTx: d.slice(192, 256),
    retryCount: d[256],
    failureCode: v.getUint16(257, true),
  };
}

/** Destination tx reference for display: 0x hash (EVM, 32 bytes) or a base58 signature. */
export function destinationTxText(bytes) {
  if (bytes.every((b) => b === 0)) return "";
  if (bytes.subarray(32).every((b) => b === 0)) return `0x${[...bytes.subarray(0, 32)].map((b) => b.toString(16).padStart(2, "0")).join("")}`;
  return base58Encode(bytes);
}

/** Refund rules the program enforces, for showing the right action. */
export function refundAction(request, { now, signer }) {
  if (now >= request.expiresAt) return ["CREATED", "FAILED", "RETRYING"].includes(request.status) ? "expire" : "";
  return signer === request.requester && ["CREATED", "FAILED"].includes(request.status) ? "cancel" : "";
}
