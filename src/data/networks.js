/**
 * Networks and assets Cons routes between. Real descriptors, used in every
 * data mode; mint addresses come from config (PUBLIC_CONS_ASSET_MINTS).
 *
 * chainId is the numeric id the Cons Program stores as destination_chain:
 * the EVM chain id for EVM networks. Solana is only ever the source.
 * status "soon": shown with its logo but not selectable until its chain id
 * and routing are confirmed. popular: listed first in the network picker.
 */
export const chains = [
  { id: "ethereum", name: "Ethereum", kind: "evm", short: "ETH", chainId: 1, popular: true },
  { id: "robinhood", name: "Robinhood", kind: "evm", short: "HOOD", chainId: null, popular: true, status: "soon" },
  { id: "arc", name: "Arc", kind: "evm", short: "ARC", chainId: null, popular: true, status: "soon" },
  { id: "solana", name: "Solana", kind: "solana", short: "SOL", chainId: 0, popular: true },
  { id: "arbitrum", name: "Arbitrum", kind: "evm", short: "ARB", chainId: 42161, popular: true },
  { id: "base", name: "Base", kind: "evm", short: "BASE", chainId: 8453, popular: true },
  { id: "bnb", name: "BNB Smart Chain", kind: "evm", short: "BNB", chainId: 56, popular: true },
  { id: "hyperevm", name: "HyperEVM", kind: "evm", short: "HYPE", chainId: 999, popular: true },
  { id: "avalanche", name: "Avalanche", kind: "evm", short: "AVAX", chainId: 43114 },
  { id: "optimism", name: "Optimism", kind: "evm", short: "OP", chainId: 10 },
  { id: "polygon", name: "Polygon", kind: "evm", short: "POL", chainId: 137 },
];

/* Identified by symbol in the UI. The chain specific mint comes from config. */
export const tokens = [
  { symbol: "USDC", name: "USD Coin", decimals: 6, program: "SPL Token" },
  { symbol: "USDT", name: "Tether USD", decimals: 6, program: "SPL Token" },
];
