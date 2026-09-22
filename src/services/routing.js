/**
 * Routing data boundary.
 *
 * Every view reads chains, tokens, providers, quotes and request status
 * through this module and never from the preview data directly. With
 * PUBLIC_CONS_API_URL set it calls the Cons API (endpoints as listed in the
 * Developer Interface docs); without it, it serves the preview data layer.
 */
import { consConfig, integration } from "../config/cons.js";
import * as preview from "../data/preview.js";
import { rankRoutes } from "./scoring.js";

export const dataMode = integration.hasApi ? "live" : "preview";

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
  return dataMode === "live" ? list(await api("/v1/chains"), "chains") : preview.chains;
}

export async function getTokens() {
  return dataMode === "live" ? list(await api("/v1/tokens"), "tokens") : preview.tokens;
}

export async function getProviders() {
  return dataMode === "live" ? list(await api("/v1/providers"), "providers") : preview.providers;
}

/**
 * Quote and rank routes for a request.
 * request: { kind: "token"|"message", source, destination, token?, amount?,
 *            recipient?, payload?, payloadBytes?, preference }
 */
export async function quoteRoutes(request) {
  const routes =
    dataMode === "live"
      ? list(await api("/v1/quote", { method: "POST", body: request }), "routes")
      : preview.candidateRoutes(request);
  return rankRoutes(routes, request.preference);
}

/** Activity feed. The live API exposes lookups by ID, so live mode starts empty. */
export async function getActivity() {
  return dataMode === "live" ? [] : preview.sampleActivity;
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

/** Look up one request by ID. Tries transfers, then messages. */
export async function getRequest(id) {
  const key = String(id || "").trim();
  if (!key) return null;
  if (dataMode === "preview") return preview.sampleActivity.find((item) => item.requestId === key) ?? null;

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
