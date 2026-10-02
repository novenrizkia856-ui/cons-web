/**
 * Routing data boundary.
 *
 * Every view reads chains, tokens, providers, quotes and request status
 * through this module and never from the preview data directly. Modes:
 *   live     PUBLIC_CONS_API_URL set: the Cons API (Developer Interface docs).
 *   chain    No API, Cons Program configured: everything is read from Solana.
 *            One route (the Cons operator assigns the provider), real costs,
 *            the connected wallet's requests, protocol facts.
 *   preview  Neither: the illustrative preview data layer.
 */
import { consConfig, integration, isSolanaAddress } from "../config/cons.js";
import * as networks from "../data/networks.js";
import * as preview from "../data/preview.js";
import { chainRoute, fetchRequest, listRequests } from "./program.js";
import { rankRoutes } from "./scoring.js";

export const dataMode = integration.hasApi ? "live" : integration.hasProgram ? "chain" : "preview";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function api(path, { method = "GET", body } = {}) {
  let response;
  try {
    response = await fetch(`${consConfig.apiBaseUrl}${path}`, {
      method,
      headers: { accept: "application/json", ...(body ? { "content-type": "application/json" } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("The Cons API could not be reached.", 0);
  }
  if (!response.ok) throw new ApiError(response.status === 404 ? "Not found." : `The Cons API returned ${response.status}.`, response.status);
  return response.json();
}

const list = (value, key) => (Array.isArray(value) ? value : Array.isArray(value?.[key]) ? value[key] : []);

export async function getChains() {
  return dataMode === "live" ? list(await api("/v1/chains"), "chains") : networks.chains;
}

/** On chain, only the assets whose mint is configured for this network. */
export async function getTokens() {
  if (dataMode === "live") return list(await api("/v1/tokens"), "tokens");
  if (dataMode === "chain") return networks.tokens.filter((t) => consConfig.assetMints[t.symbol]);
  return networks.tokens;
}

/** On chain there is no provider registry: the operator assigns providers. */
export async function getProviders() {
  if (dataMode === "live") return list(await api("/v1/providers"), "providers");
  return dataMode === "chain" ? [] : preview.providers;
}

/**
 * Quote and rank routes for a request.
 * request: { kind: "token"|"message", source, destination, token?, amount?,
 *            recipient?, payload?, payloadBytes?, preference }
 */
export async function quoteRoutes(request) {
  if (dataMode === "chain") return [await chainRoute(request)];
  const routes =
    dataMode === "live"
      ? list(await api("/v1/quote", { method: "POST", body: request }), "routes")
      : preview.candidateRoutes(request);
  return rankRoutes(routes, request.preference);
}

/**
 * Activity feed: { items, source }. On chain it lists the connected wallet's
 * requests (source "index" or "browser", see listRequests). The live API
 * exposes lookups by ID, so live mode starts empty.
 */
export async function getActivity({ owner } = {}) {
  if (dataMode === "chain") return owner ? listRequests(owner) : { items: [], source: "wallet" };
  return { items: dataMode === "live" ? [] : preview.sampleActivity, source: dataMode };
}

/** Normalize a receipt from the API into the shape the UI renders. */
export function normalizeReceipt(raw, kind) {
  if (!raw || typeof raw !== "object") return null;
  return {
    requestId: raw.requestId ?? raw.id ?? "",
    kind: raw.kind ?? kind ?? "token",
    status: raw.status ?? "CREATED",
    source: raw.source?.chain ?? raw.sourceChain ?? "",
    destination: raw.destination?.chain ?? raw.destinationChain ?? "",
    sourceTx: raw.source?.transactionId ?? raw.sourceSignature ?? null,
    destinationTx: raw.destination?.transactionId ?? null,
    provider: raw.route?.provider ?? raw.route ?? "",
    asset: raw.token ?? raw.asset ?? null,
    amount: raw.amount ?? null,
    submittedAt: raw.timestamps?.submitted ?? null,
    confirmedAt: raw.timestamps?.confirmed ?? null,
    history: Array.isArray(raw.history) ? raw.history : [],
    sample: false,
  };
}

/**
 * Look up one request by ID. A Solana address is read from the Cons Program
 * (the request account is the receipt); otherwise the API is asked for
 * transfers, then messages.
 */
export async function getRequest(id) {
  const key = String(id || "").trim();
  if (!key) return null;
  if (integration.hasProgram && isSolanaAddress(key)) {
    const onchain = await fetchRequest(key);
    if (onchain) return onchain;
  }
  if (dataMode === "preview") return preview.sampleActivity.find((item) => item.requestId === key) ?? null;
  if (dataMode === "chain") return null;

  const safe = encodeURIComponent(key);
  try {
    return normalizeReceipt(await api(`/v1/transfers/${safe}`), "token");
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 404) throw error;
  }
  try {
    return normalizeReceipt(await api(`/v1/messages/${safe}`), "message");
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export const previewNotice = preview.PREVIEW_NOTICE;
