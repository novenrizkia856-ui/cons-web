/**
 * Preview data layer.
 *
 * Used only while PUBLIC_CONS_API_URL is empty. Nothing here is live data:
 * providers are generic placeholders (Provider A, B, C, D), figures are
 * illustrative, and sample requests carry no real signatures or addresses.
 * The UI labels every view fed from this module as preview data.
 *
 * Delete nothing here when the API goes live; src/services/routing.js simply
 * stops reading it once apiBaseUrl is configured.
 */

export const PREVIEW_NOTICE = "Illustrative preview data. Not live network information.";

export const chains = [
  { id: "solana", name: "Solana", kind: "solana", short: "SOL" },
  { id: "ethereum", name: "Ethereum", kind: "evm", short: "ETH" },
  { id: "base", name: "Base", kind: "evm", short: "BASE" },
];

/* Tokens are identified by symbol here only for display. Real routing resolves
   the chain specific mint or contract from the Cons asset registry. */
export const tokens = [
  { symbol: "USDC", name: "USD Coin", decimals: 6, program: "SPL Token" },
  { symbol: "USDT", name: "Tether USD", decimals: 6, program: "SPL Token" },
];

export const SECURITY_TIERS = { Standard: 1, Enhanced: 2, "Higher assurance": 3 };

export const providers = [
  {
    id: "provider-a",
    name: "Provider A",
    kinds: ["token", "message"],
    chains: ["solana", "ethereum", "base"],
    security: "Standard",
    securityModel: "Provider defined",
    availability: "active",
    baseFee: 2.1,
    feeBps: 4,
    etaSeconds: 180,
    reliability: 0.96,
  },
  {
    id: "provider-b",
    name: "Provider B",
    kinds: ["token"],
    chains: ["solana", "ethereum", "base"],
    security: "Standard",
    securityModel: "Provider defined",
    availability: "active",
    baseFee: 1.4,
    feeBps: 3,
    etaSeconds: 480,
    reliability: 0.94,
  },
  {
    id: "provider-c",
    name: "Provider C",
    kinds: ["token", "message"],
    chains: ["solana", "ethereum", "base"],
    security: "Higher assurance",
    securityModel: "Provider defined",
    availability: "active",
    baseFee: 3.2,
    feeBps: 5,
    etaSeconds: 60,
    reliability: 0.98,
  },
  {
    id: "provider-d",
    name: "Provider D",
    kinds: ["message", "token"],
    chains: ["solana", "base"],
    security: "Enhanced",
    securityModel: "Provider defined",
    availability: "degraded",
    baseFee: 1.9,
    feeBps: 4,
    etaSeconds: 300,
    reliability: 0.89,
  },
  {
    id: "provider-e",
    name: "Provider E",
    kinds: ["message"],
    chains: ["solana", "ethereum", "base"],
    security: "Enhanced",
    securityModel: "Provider defined",
    availability: "paused",
    baseFee: 1.2,
    feeBps: 0,
    etaSeconds: 240,
    reliability: 0.9,
  },
];

/** Candidate routes for a request, before ranking. */
export function candidateRoutes({ kind = "token", source, destination, amount = 0, payloadBytes = 0 }) {
  return providers
    .filter((p) => p.kinds.includes(kind) && p.chains.includes(source) && p.chains.includes(destination))
    .map((p) => {
      const variable = kind === "token" ? (Number(amount) || 0) * (p.feeBps / 10000) : (payloadBytes / 1024) * 0.08;
      return {
        providerId: p.id,
        provider: p.name,
        kind,
        source,
        destination,
        costUsd: Math.round((p.baseFee + variable) * 100) / 100,
        etaSeconds: p.etaSeconds + (destination === "ethereum" || source === "ethereum" ? 60 : 0),
        security: p.security,
        securityTier: SECURITY_TIERS[p.security] ?? 1,
        availability: p.availability,
        reliability: p.reliability,
      };
    });
}

const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();

/* Sample requests. IDs are marked sample_ and transaction fields are null so
   nothing resembles a real signature or address. */
export const sampleActivity = [
  {
    requestId: "sample_0142",
    kind: "token",
    status: "IN_TRANSIT",
    source: "solana",
    destination: "base",
    asset: "USDC",
    amount: "250",
    provider: "Provider A",
    submittedAt: minutesAgo(2),
    confirmedAt: null,
    history: ["CREATED", "SUBMITTED", "IN_TRANSIT"],
  },
  {
    requestId: "sample_0141",
    kind: "message",
    status: "CONFIRMED",
    source: "solana",
    destination: "ethereum",
    asset: null,
    payloadBytes: 96,
    provider: "Provider C",
    submittedAt: minutesAgo(18),
    confirmedAt: minutesAgo(16),
    history: ["CREATED", "SUBMITTED", "IN_TRANSIT", "DESTINATION_RECEIVED", "CONFIRMED"],
  },
  {
    requestId: "sample_0140",
    kind: "token",
    status: "RETRYING",
    source: "ethereum",
    destination: "solana",
    asset: "USDC",
    amount: "1200",
    provider: "Provider B",
    submittedAt: minutesAgo(26),
    confirmedAt: null,
    history: ["CREATED", "SUBMITTED", "IN_TRANSIT", "RETRYING"],
  },
  {
    requestId: "sample_0139",
    kind: "token",
    status: "CONFIRMED",
    source: "solana",
    destination: "ethereum",
    asset: "USDT",
    amount: "80",
    provider: "Provider C",
    submittedAt: minutesAgo(64),
    confirmedAt: minutesAgo(62),
    history: ["CREATED", "SUBMITTED", "IN_TRANSIT", "DESTINATION_RECEIVED", "CONFIRMED"],
  },
  {
    requestId: "sample_0138",
    kind: "message",
    status: "DESTINATION_RECEIVED",
    source: "base",
    destination: "solana",
    asset: null,
    payloadBytes: 212,
    provider: "Provider D",
    submittedAt: minutesAgo(90),
    confirmedAt: null,
    history: ["CREATED", "SUBMITTED", "IN_TRANSIT", "DESTINATION_RECEIVED"],
  },
  {
    requestId: "sample_0137",
    kind: "token",
    status: "FAILED",
    source: "solana",
    destination: "base",
    asset: "USDC",
    amount: "40",
    provider: "Provider D",
    submittedAt: minutesAgo(140),
    confirmedAt: null,
    history: ["CREATED", "SUBMITTED", "FAILED"],
  },
  {
    requestId: "sample_0136",
    kind: "message",
    status: "EXPIRED",
    source: "solana",
    destination: "base",
    asset: null,
    payloadBytes: 64,
    provider: "Provider A",
    submittedAt: minutesAgo(300),
    confirmedAt: null,
    history: ["CREATED", "EXPIRED"],
  },
  {
    requestId: "sample_0135",
    kind: "token",
    status: "CANCELLED",
    source: "solana",
    destination: "ethereum",
    asset: "USDT",
    amount: "500",
    provider: "Provider B",
    submittedAt: minutesAgo(420),
    confirmedAt: null,
    history: ["CREATED", "CANCELLED"],
  },
  {
    requestId: "sample_0134",
    kind: "token",
    status: "SUBMITTED",
    source: "base",
    destination: "solana",
    asset: "USDC",
    amount: "75",
    provider: "Provider A",
    submittedAt: minutesAgo(1),
    confirmedAt: null,
    history: ["CREATED", "SUBMITTED"],
  },
].map((item) => ({ ...item, sample: true, sourceTx: null, destinationTx: null }));
