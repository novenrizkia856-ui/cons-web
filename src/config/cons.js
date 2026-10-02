/**
 * Cons configuration. The one place deployment values live.
 *
 * Every blockchain address, endpoint and link the UI shows is read from here.
 * Components never hardcode a program ID, mint, RPC or API URL.
 *
 * Values come from PUBLIC_* environment variables at build time (see
 * .env.example), falling back to the defaults below. Everything here is public
 * and ships to the browser: never add a private key or signing secret.
 *
 * After the Cons Program is deployed, set PUBLIC_CONS_PROGRAM_ID (and the API
 * and RPC values when they exist) in Vercel and redeploy. No component
 * changes are needed. The token CA is the one exception: it lives in
 * src/config/token.js as a single line.
 */
import { TOKEN_CA } from "./token.js";

export const SOLANA_NETWORKS = Object.freeze({
  "mainnet-beta": { label: "Mainnet Beta", rpcUrl: "https://api.mainnet-beta.solana.com" },
  devnet: { label: "Devnet", rpcUrl: "https://api.devnet.solana.com" },
  testnet: { label: "Testnet", rpcUrl: "https://api.testnet.solana.com" },
});

const DEFAULTS = Object.freeze({
  network: "mainnet-beta",
  programId: "",
  apiBaseUrl: "",
  docsUrl: "/docs/",
  githubUrl: "",
  rpcUrl: "",
  explorerBaseUrl: "https://explorer.solana.com",
  assetMints: "",
  liveRoutes: "",
  maxTokenAmount: "",
});

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

/** A Solana public key is 32 bytes, which is 32 to 44 base58 characters. */
export function isSolanaAddress(value) {
  return typeof value === "string" && value.length >= 32 && value.length <= 44 && BASE58.test(value);
}

const clean = (value) => (typeof value === "string" ? value.trim() : "");

/** Token CA rule: null or blank means "Coming Soon" (""); anything else is used as written. */
export function resolveTokenCa(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

/**
 * Routes the Cons operator delivers today, as "token:USDC:base,message:base".
 * Empty means no restriction. Only these can be submitted, so no request is
 * created that nobody will route.
 */
export function parseLiveRoutes(value) {
  return Object.freeze(
    clean(value)
      .split(",")
      .map((part) => part.split(":").map(clean))
      .filter(([kind]) => kind === "token" || kind === "message")
      .map(([kind, a, b]) => (kind === "token" ? { kind, token: (a || "").toUpperCase(), destination: b || "" } : { kind, destination: a || "" })),
  );
}

/**
 * "USDC=<mint>,USDT=<mint>" to { USDC: "<mint>", ... }. These are the Solana
 * mints the Cons Program accepts for token requests on this network. Invalid
 * entries are dropped, so that asset simply stays unavailable.
 */
export function parseAssetMints(value) {
  const out = {};
  for (const part of clean(value).split(",")) {
    const [symbol, mint] = part.split("=").map(clean);
    if (symbol && isSolanaAddress(mint)) out[symbol.toUpperCase()] = mint;
  }
  return Object.freeze(out);
}
const trimSlash = (value) => value.replace(/\/+$/, "");

/**
 * Build the resolved config from an env object. Exported for tests.
 * Invalid addresses resolve to "" so the UI falls back to its unconfigured
 * state instead of showing or copying a malformed value.
 */
export function createConsConfig(env = {}, tokenCa = TOKEN_CA) {
  const network = SOLANA_NETWORKS[clean(env.PUBLIC_SOLANA_NETWORK)] ? clean(env.PUBLIC_SOLANA_NETWORK) : DEFAULTS.network;
  const programId = clean(env.PUBLIC_CONS_PROGRAM_ID) || DEFAULTS.programId;

  return Object.freeze({
    network,
    networkLabel: SOLANA_NETWORKS[network].label,
    programId: isSolanaAddress(programId) ? programId : "",
    tokenMintAddress: resolveTokenCa(tokenCa),
    apiBaseUrl: trimSlash(clean(env.PUBLIC_CONS_API_URL) || DEFAULTS.apiBaseUrl),
    docsUrl: clean(env.PUBLIC_CONS_DOCS_URL) || DEFAULTS.docsUrl,
    githubUrl: clean(env.PUBLIC_CONS_GITHUB_URL) || DEFAULTS.githubUrl,
    rpcUrl: clean(env.PUBLIC_SOLANA_RPC_URL) || DEFAULTS.rpcUrl || SOLANA_NETWORKS[network].rpcUrl,
    explorerBaseUrl: trimSlash(clean(env.PUBLIC_SOLANA_EXPLORER_URL) || DEFAULTS.explorerBaseUrl),
    assetMints: parseAssetMints(clean(env.PUBLIC_CONS_ASSET_MINTS) || DEFAULTS.assetMints),
    liveRoutes: parseLiveRoutes(clean(env.PUBLIC_CONS_LIVE_ROUTES) || DEFAULTS.liveRoutes),
    maxTokenAmount: Number(clean(env.PUBLIC_CONS_MAX_TOKEN_AMOUNT) || DEFAULTS.maxTokenAmount) || 0,
  });
}

export const consConfig = createConsConfig(import.meta.env ?? {});

/** Integration readiness, derived once so every view agrees. */
export const integration = Object.freeze({
  hasProgram: Boolean(consConfig.programId),
  hasApi: Boolean(consConfig.apiBaseUrl),
  hasTokenMint: Boolean(consConfig.tokenMintAddress),
});

/** Explorer links for real Solana identities only. */
export function explorerUrl(kind, value, config = consConfig) {
  if (!value) return "";
  const cluster = config.network === "mainnet-beta" ? "" : `?cluster=${config.network}`;
  const path = { tx: "tx", address: "address" }[kind];
  return path ? `${config.explorerBaseUrl}/${path}/${encodeURIComponent(value)}${cluster}` : "";
}
