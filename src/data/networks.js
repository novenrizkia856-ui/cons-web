/**
 * Networks and assets Cons routes between. Real descriptors, used in every
 * data mode; mint addresses come from config (PUBLIC_CONS_ASSET_MINTS).
 *
 * chainId is the numeric id the Cons Program stores as destination_chain:
 * the EVM chain id for EVM networks. Solana is only ever the source.
 */
export const chains = [
  { id: "solana", name: "Solana", kind: "solana", short: "SOL", chainId: 0 },
  { id: "ethereum", name: "Ethereum", kind: "evm", short: "ETH", chainId: 1 },
  { id: "base", name: "Base", kind: "evm", short: "BASE", chainId: 8453 },
];

/* Identified by symbol in the UI. The chain specific mint comes from config. */
export const tokens = [
  { symbol: "USDC", name: "USD Coin", decimals: 6, program: "SPL Token" },
  { symbol: "USDT", name: "Tether USD", decimals: 6, program: "SPL Token" },
];
