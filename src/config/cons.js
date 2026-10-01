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
 * After the Cons Program is deployed, set PUBLIC_CONS_PROGRAM_ID (and the mint,
 * API and RPC values when they exist) in Vercel and redeploy. No component
 * changes are needed.
 */

export const SOLANA_NETWORKS = Object.freeze({
  "mainnet-beta": { label: "Mainnet Beta", rpcUrl: "https://api.mainnet-beta.solana.com" },
  devnet: { label: "Devnet", rpcUrl: "https://api.devnet.solana.com" },
  testnet: { label: "Testnet", rpcUrl: "https://api.testnet.solana.com" },
});

const DEFAULTS = Object.freeze({
  network: "mainnet-beta",
  programId: "",
  tokenMintAddress: "",
  apiBaseUrl: "",
  docsUrl: "/docs/",
  githubUrl: "",
  rpcUrl: "",
  explorerBaseUrl: "https://explorer.solana.com",
});

const BASE58 = /^[1-9A-HJ-NP-Za-km-z]+$/;

/** A Solana public key is 32 bytes, which is 32 to 44 base58 characters. */
export function isSolanaAddress(value) {
  return typeof value === "string" && value.length >= 32 && value.length <= 44 && BASE58.test(value);
}

const clean = (value) => (typeof value === "string" ? value.trim() : "");
const trimSlash = (value) => value.replace(/\/+$/, "");

/**
 * Build the resolved config from an env object. Exported for tests.
 * Invalid addresses resolve to "" so the UI falls back to its unconfigured
 * state instead of showing or copying a malformed value.
 */
export function createConsConfig(env = {}) {
  const network = SOLANA_NETWORKS[clean(env.PUBLIC_SOLANA_NETWORK)] ? clean(env.PUBLIC_SOLANA_NETWORK) : DEFAULTS.network;
  const programId = clean(env.PUBLIC_CONS_PROGRAM_ID) || DEFAULTS.programId;
  const tokenMintAddress = clean(env.PUBLIC_CONS_TOKEN_MINT) || DEFAULTS.tokenMintAddress;

  return Object.freeze({
    network,
    networkLabel: SOLANA_NETWORKS[network].label,
    programId: isSolanaAddress(programId) ? programId : "",
    tokenMintAddress: isSolanaAddress(tokenMintAddress) ? tokenMintAddress : "",
    apiBaseUrl: trimSlash(clean(env.PUBLIC_CONS_API_URL) || DEFAULTS.apiBaseUrl),
    docsUrl: clean(env.PUBLIC_CONS_DOCS_URL) || DEFAULTS.docsUrl,
    githubUrl: clean(env.PUBLIC_CONS_GITHUB_URL) || DEFAULTS.githubUrl,
    rpcUrl: clean(env.PUBLIC_SOLANA_RPC_URL) || DEFAULTS.rpcUrl || SOLANA_NETWORKS[network].rpcUrl,
    explorerBaseUrl: trimSlash(clean(env.PUBLIC_SOLANA_EXPLORER_URL) || DEFAULTS.explorerBaseUrl),
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
