/**
 * Cons Program boundary: where a routed request becomes a Solana transaction.
 *
 * Builds create_request and the refund action of update_request in the
 * program's Anchor format (src/lib/cons-ix.js), hands the transaction to the
 * connected wallet, and reads request accounts back as receipts. The program
 * ID, RPC and accepted mints all come from src/config/cons.js.
 *
 * @solana/web3.js is loaded on first use, so it never weighs on page load.
 */
import { consConfig, integration } from "../config/cons.js";
import {
  decodeConfig,
  decodeRequest,
  destinationBytes,
  destinationTxText,
  encodeCreateRequest,
  encodeRefund,
  formatUnits,
  parseUnits,
  payloadToBytes,
  u64Le,
} from "../lib/cons-ix.js";
import { getChains, getTokens } from "./routing.js";
import * as wallet from "./wallet.js";

/* Canonical Solana programs (protocol constants, not deployment config). */
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const ASSOCIATED_TOKEN_PROGRAM = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";

const TOKEN_EXPIRY_SECONDS = 3600;
const STATE_TTL_MS = 20_000;

/** Readable text for the program's custom error codes (6000 to 6009). */
const ERRORS = {
  6000: "This wallet is not allowed to do that.",
  6001: "New requests are paused right now.",
  6002: "This request cannot move to that state.",
  6003: "This request has expired.",
  6004: "Only the requester can cancel before the request expires.",
  6005: "Expiry is outside the allowed window.",
  6006: "Amount must be above zero.",
  6007: "Destination, network or payload is not valid.",
  6008: "Token account or mint does not match.",
  6009: "This request reached its retry limit.",
};

export class NotReadyError extends Error {
  constructor(message, reason) {
    super(message);
    this.name = "NotReadyError";
    this.reason = reason;
  }
}

let web3Promise;
const web3 = () => (web3Promise ??= Promise.all([import("@solana/web3.js"), import("buffer")]).then(([w3, b]) => ({ ...w3, Buffer: b.Buffer })));

let rpc;
const connection = (w3) => (rpc ??= new w3.Connection(consConfig.rpcUrl, "confirmed"));

const encoder = new TextEncoder();
const seeds = (...parts) => parts.map((p) => (typeof p === "string" ? encoder.encode(p) : p));

function pdas(w3, requester, nonce) {
  const program = new w3.PublicKey(consConfig.programId);
  const config = w3.PublicKey.findProgramAddressSync(seeds("config"), program)[0];
  if (!requester) return { program, config };
  const request = w3.PublicKey.findProgramAddressSync(seeds("request", requester.toBytes(), u64Le(nonce)), program)[0];
  const vault = w3.PublicKey.findProgramAddressSync(seeds("vault", request.toBytes()), program)[0];
  return { program, config, request, vault };
}

function associatedTokenAddress(w3, owner, mint) {
  return w3.PublicKey.findProgramAddressSync([owner.toBytes(), new w3.PublicKey(TOKEN_PROGRAM).toBytes(), mint.toBytes()], new w3.PublicKey(ASSOCIATED_TOKEN_PROGRAM))[0];
}

/* Program state: deployed, initialized, paused. Cached briefly. */
let programState = { status: integration.hasProgram ? "unknown" : "no-program", at: 0 };

export async function refreshProgramState({ force = false } = {}) {
  if (!integration.hasProgram) return programState;
  if (!force && programState.status !== "unknown" && Date.now() - programState.at < STATE_TTL_MS) return programState;
  try {
    const w3 = await web3();
    const info = await connection(w3).getAccountInfo(pdas(w3).config);
    if (!info) programState = { status: "not-initialized", at: Date.now() };
    else programState = { status: decodeConfig(info.data).paused ? "paused" : "live", at: Date.now() };
  } catch {
    programState = { status: "error", at: Date.now() };
  }
  return programState;
}

/**
 * What the submit control should say. `request` is the route view's request
 * object (sourceChain, destinationChain, token...). Call refreshProgramState
 * first for an up to date answer.
 * readiness: no-program | checking | error | not-initialized | paused |
 *            wrong-source | asset | no-wallet | ready
 */
export function getExecutionReadiness({ walletAddress, request } = {}) {
  const status = integration.hasProgram ? programState.status : "no-program";
  if (status === "no-program") return { status, label: "Program not deployed", detail: "Routing is shown in preview. Submission opens when the Cons Program is live." };
  if (status === "unknown") return { status: "checking", label: "Checking program", detail: "Reading the Cons Program state on Solana." };
  if (status === "error") return { status, label: "Program unreachable", detail: "The Cons Program could not be read. Try again shortly." };
  if (status === "not-initialized") return { status, label: "Opening soon", detail: "The Cons Program is deployed and opens for requests once it is initialized." };
  if (status === "paused") return { status, label: "Paused", detail: "New requests are paused. Existing requests can still be refunded." };
  if (request && request.sourceChain !== "solana") return { status: "wrong-source", label: "Start on Solana", detail: "Requests are created on Solana. Choose Solana as the source network." };
  if (request?.token && !consConfig.assetMints[request.token]) return { status: "asset", label: "Asset unavailable", detail: `${request.token} is not enabled on ${consConfig.networkLabel} yet.` };
  if (!walletAddress) return { status: "no-wallet", label: "Connect wallet", detail: "Connect a Solana wallet to sign the request." };
  return { status: "ready", label: "Sign and submit", detail: "Your wallet will ask you to approve the transaction." };
}

function assertReady(request) {
  const readiness = getExecutionReadiness({ walletAddress: wallet.state.address, request });
  if (readiness.status !== "ready") throw new NotReadyError(readiness.detail, readiness.status);
}

/** Readable message for a failed transaction or wallet error. */
export function errorText(error) {
  const text = String(error?.message ?? error ?? "");
  const custom = text.match(/custom program error: 0x([0-9a-f]+)/i) ?? text.match(/"Custom":\s*(\d+)/);
  if (custom) {
    const code = custom[0].includes("0x") ? parseInt(custom[1], 16) : Number(custom[1]);
    if (ERRORS[code]) return ERRORS[code];
  }
  if (/reject|denied|cancel/i.test(text)) return "The wallet request was declined.";
  if (/insufficient (funds|lamports)|debit an account/i.test(text)) return "Not enough SOL in this wallet for fees and rent.";
  return text || "The transaction failed.";
}

async function sendInstruction(w3, keys, data) {
  const c = connection(w3);
  const payer = new w3.PublicKey(wallet.state.address);
  const ix = new w3.TransactionInstruction({ programId: new w3.PublicKey(consConfig.programId), keys, data: w3.Buffer.from(data) });
  const { blockhash, lastValidBlockHeight } = await c.getLatestBlockhash("confirmed");
  const tx = new w3.Transaction({ feePayer: payer, blockhash, lastValidBlockHeight }).add(ix);
  const signature = await wallet.signAndSend(tx, c);
  const result = await c.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, "confirmed");
  if (result.value.err) throw new Error(errorText(JSON.stringify(result.value.err)));
  return signature;
}

function randomNonce() {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return bytes.reduce((n, b) => (n << 8n) | BigInt(b), 0n);
}

const meta = (pubkey, isWritable = false, isSigner = false) => ({ pubkey, isWritable, isSigner });

async function destination(request) {
  const chain = (await getChains()).find((c) => c.id === request.destinationChain);
  if (!chain?.chainId) throw new Error("This destination network is not supported yet.");
  return { chainId: chain.chainId, bytes: destinationBytes(request.recipient, chain.kind) };
}

/** Create a token request: moves the amount into the request's vault on Solana. */
export async function prepareTransfer(request) {
  await refreshProgramState();
  assertReady(request);
  const w3 = await web3();
  const c = connection(w3);
  const requester = new w3.PublicKey(wallet.state.address);
  const mint = new w3.PublicKey(consConfig.assetMints[request.token]);

  const mintInfo = await c.getAccountInfo(mint);
  if (!mintInfo || mintInfo.owner.toBase58() !== TOKEN_PROGRAM) throw new Error(`${request.token} mint was not found on ${consConfig.networkLabel}.`);
  const amount = parseUnits(request.amount, mintInfo.data[44]);
  if (amount <= 0n) throw new Error(ERRORS[6006]);

  const source = associatedTokenAddress(w3, requester, mint);
  let balance;
  try {
    balance = BigInt((await c.getTokenAccountBalance(source)).value.amount);
  } catch {
    throw new Error(`This wallet has no ${request.token} account.`);
  }
  if (balance < amount) throw new Error(`Not enough ${request.token} in this wallet.`);

  const dest = await destination(request);
  const nonce = randomNonce();
  const { config, request: address, vault } = pdas(w3, requester, nonce);
  const data = encodeCreateRequest({
    nonce,
    amount,
    destinationChain: dest.chainId,
    destination: dest.bytes,
    expiresAt: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
  });
  const keys = [
    meta(requester, true, true),
    meta(config),
    meta(address, true),
    meta(mint),
    meta(source, true),
    meta(vault, true),
    meta(new w3.PublicKey(TOKEN_PROGRAM)),
    meta(w3.SystemProgram.programId),
  ];
  const signature = await sendInstruction(w3, keys, data);
  return { signature, request: address.toBase58() };
}

/** Create a message request: records the payload hash on Solana. */
export async function prepareMessage(request) {
  await refreshProgramState();
  assertReady(request);
  const w3 = await web3();
  const requester = new w3.PublicKey(wallet.state.address);
  const payload = payloadToBytes(request.payload, request.encoding);
  if (!payload.length) throw new Error("Payload is required.");
  const messageHash = new Uint8Array(await crypto.subtle.digest("SHA-256", payload));

  const dest = await destination(request);
  const nonce = randomNonce();
  const { program, config, request: address } = pdas(w3, requester, nonce);
  const data = encodeCreateRequest({
    nonce,
    destinationChain: dest.chainId,
    destination: dest.bytes,
    messageHash,
    expiresAt: Math.floor(Date.now() / 1000) + (Number(request.expirySeconds) || 3600),
  });
  const none = meta(program); // optional account left out: the program id
  const keys = [meta(requester, true, true), meta(config), meta(address, true), none, none, none, none, meta(w3.SystemProgram.programId)];
  const signature = await sendInstruction(w3, keys, data);
  return { signature, request: address.toBase58() };
}

const iso = (seconds) => (seconds > 0 ? new Date(seconds * 1000).toISOString() : null);

function historyOf(r) {
  const main = ["CREATED", "SUBMITTED", "IN_TRANSIT", "DESTINATION_RECEIVED", "CONFIRMED"];
  const at = main.indexOf(r.status);
  if (at !== -1) return main.slice(0, at + 1);
  return ["CREATED", ...(r.submittedAt > 0 ? ["SUBMITTED"] : []), r.status];
}

/** Read a request account as a receipt in the shape the UI renders, or null. */
export async function fetchRequest(address) {
  if (!integration.hasProgram) return null;
  const w3 = await web3();
  const c = connection(w3);
  let key;
  try {
    key = new w3.PublicKey(address);
  } catch {
    return null;
  }
  const info = await c.getAccountInfo(key);
  if (!info || info.owner.toBase58() !== consConfig.programId) return null;
  const r = decodeRequest(info.data);

  const [chains, tokens, signatures] = await Promise.all([getChains(), getTokens(), c.getSignaturesForAddress(key, { limit: 1000 }).catch(() => [])]);
  const symbol = Object.entries(consConfig.assetMints).find(([, mint]) => mint === r.mint)?.[0];
  const decimals = tokens.find((t) => t.symbol === symbol)?.decimals ?? 6;
  return {
    requestId: address,
    kind: r.kind,
    status: r.status,
    source: "solana",
    destination: chains.find((ch) => ch.chainId === r.destinationChain)?.id ?? `chain ${r.destinationChain}`,
    sourceTx: signatures.at(-1)?.signature ?? null,
    destinationTx: destinationTxText(r.destinationTx) || null,
    provider: r.providerId ? `Provider ${r.providerId}` : "",
    asset: r.kind === "token" ? (symbol ?? `${r.mint.slice(0, 4)}…`) : null,
    amount: r.kind === "token" ? formatUnits(r.amount, decimals) : null,
    submittedAt: iso(r.createdAt),
    confirmedAt: iso(r.confirmedAt),
    history: historyOf(r),
    sample: false,
    onchain: r,
  };
}

/**
 * Refund a request: cancels it before expiry (requester only), or expires it
 * after expiry (anyone). Token custody returns to the requester's token account.
 */
export async function refundRequest(address) {
  if (!wallet.state.address) throw new Error("Connect a wallet first.");
  const w3 = await web3();
  const c = connection(w3);
  const key = new w3.PublicKey(address);
  const info = await c.getAccountInfo(key);
  if (!info) throw new Error("Request not found.");
  const r = decodeRequest(info.data);
  const { program, config } = pdas(w3);
  const none = meta(program);
  let tokenKeys = [none, none, none, none];
  if (r.kind === "token") {
    const requester = new w3.PublicKey(r.requester);
    const mint = new w3.PublicKey(r.mint);
    const refundTo = associatedTokenAddress(w3, requester, mint);
    if (!(await c.getAccountInfo(refundTo))) throw new Error("The requester has no token account for this asset.");
    const vault = w3.PublicKey.findProgramAddressSync(seeds("vault", key.toBytes()), program)[0];
    tokenKeys = [meta(requester, true), meta(vault, true), meta(refundTo, true), meta(new w3.PublicKey(TOKEN_PROGRAM))];
  }
  const keys = [meta(new w3.PublicKey(wallet.state.address), false, true), meta(config), meta(key, true), ...tokenKeys];
  return sendInstruction(w3, keys, encodeRefund());
}
