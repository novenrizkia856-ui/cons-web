# Cons Web

Frontend for **Cons**, a Solana native routing layer for cross chain tokens and messages.
It is a static Vite site (vanilla JS, no framework) and deploys to Vercel as is.

| Page | Source | What it is |
|---|---|---|
| `/` | `index.html`, `src/landing/` | Landing page |
| `/app.html` | `app.html`, `src/app/` | Token routing, message routing, activity, receipts, providers |
| `/docs/` | `content/docs/` → `scripts/build-docs.mjs` | Docs, generated at build time |

## Configuration

Every deployment value lives in **`src/config/cons.js`**, fed by `PUBLIC_*` env vars
(see `.env.example`). Components never hardcode an address or endpoint.

| Variable | Effect when set | When empty |
|---|---|---|
| `PUBLIC_SOLANA_NETWORK` | `mainnet-beta`, `devnet` or `testnet` | `mainnet-beta` |
| `PUBLIC_CONS_PROGRAM_ID` | Program shown as configured in the app | "Program not deployed", submit disabled |
| `PUBLIC_CONS_TOKEN_MINT` | Landing Token CA shows the mint and copy works | "Coming Soon", copy inert |
| `PUBLIC_CONS_API_URL` | App reads the Cons API (`/v1/quote`, `/v1/providers`, ...) | Labeled preview data from `src/data/preview.js` |
| `PUBLIC_SOLANA_RPC_URL` | Custom RPC | Public cluster RPC |
| `PUBLIC_CONS_DOCS_URL` | Docs links point there | `/docs/` |
| `PUBLIC_CONS_GITHUB_URL` | GitHub link appears | GitHub link hidden |
| `PUBLIC_SOLANA_EXPLORER_URL` | Explorer base | `https://explorer.solana.com` |

Invalid base58 addresses are ignored, so a typo falls back to the unconfigured state.
All values are public. Never put a private key or signing secret in the env.

## Integration boundaries

- `src/services/routing.js`: chains, tokens, providers, quotes, request lookup. API when configured, preview otherwise.
- `src/services/program.js`: where a route becomes a Solana transaction. Not implemented until the program ships; steps are in the file header.
- `src/services/wallet.js`: injected Solana wallet connect, public key only. No signing.
- `src/data/preview.js`: illustrative data (Provider A to E, sample requests with no real signatures).

## Commands

```bash
npm install
npm run dev      # docs + Vite dev server
npm run build    # docs + static build into dist/
npm test         # config, validation and ranking tests
npm run audit    # copy rules and leftover check
```

## Design

Ported from a reference frontend: its neutral grey scale, warm champagne accent
(`#e8c289` / `#ab8f64`), Basier Circle and Geist Mono type, framed page rails, bordered two
column panels, two tone headlines and fade up blur reveals, set on dark surfaces.
All motion pauses offscreen and respects `prefers-reduced-motion`.
