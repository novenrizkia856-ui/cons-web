/**
 * Solana wallet boundary.
 *
 * Connects to an injected Solana wallet to read the public key, and nothing
 * more. There is no signing here on purpose: transaction building belongs to
 * src/services/program.js once the Cons Program exists.
 *
 * To move to the Solana Wallet Adapter or Wallet Standard later, keep this
 * module's exports (detectWallets, connect, disconnect, onChange, state) and
 * swap the internals. Views depend only on these exports.
 */

const listeners = new Set();
export const state = { address: "", walletName: "" };

function emit() {
  listeners.forEach((fn) => fn({ ...state }));
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Injected providers that follow the common window.solana connect interface. */
export function detectWallets() {
  if (typeof window === "undefined") return [];
  const found = [];
  const add = (name, provider) => {
    if (provider && typeof provider.connect === "function" && !found.some((w) => w.provider === provider)) found.push({ name, provider });
  };
  add("Phantom", window.phantom?.solana);
  add("Solflare", window.solflare);
  add("Backpack", window.backpack);
  add("Solana wallet", window.solana);
  return found;
}

let active = null;

export async function connect(wallet = detectWallets()[0]) {
  if (!wallet) throw new Error("No Solana wallet was found in this browser.");
  const result = await wallet.provider.connect();
  const key = result?.publicKey ?? wallet.provider.publicKey;
  if (!key) throw new Error("The wallet did not return a public key.");
  active = wallet;
  state.address = key.toString();
  state.walletName = wallet.name;
  wallet.provider.on?.("disconnect", reset);
  wallet.provider.on?.("accountChanged", (next) => {
    if (next) {
      state.address = next.toString();
      emit();
    } else reset();
  });
  emit();
  return { ...state };
}

function reset() {
  active = null;
  state.address = "";
  state.walletName = "";
  emit();
}

export async function disconnect() {
  try {
    await active?.provider.disconnect?.();
  } finally {
    reset();
  }
}

export const shortAddress = (value) => (value ? `${value.slice(0, 4)}…${value.slice(-4)}` : "");
