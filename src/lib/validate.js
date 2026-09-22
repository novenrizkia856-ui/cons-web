/* Input validation for routing requests. Pure functions, covered by tests. */
import { isSolanaAddress } from "../config/cons.js";

export const isEvmAddress = (value) => /^0x[0-9a-fA-F]{40}$/.test(String(value || "").trim());

export function validateAddress(value, chainKind) {
  const v = String(value || "").trim();
  if (!v) return "Required.";
  if (chainKind === "solana") return isSolanaAddress(v) ? "" : "Enter a valid Solana address.";
  if (chainKind === "evm") return isEvmAddress(v) ? "" : "Enter a valid 0x address.";
  return "";
}

export function validateAmount(value, decimals = 6) {
  const v = String(value ?? "").trim();
  if (!v) return "Required.";
  if (!/^\d+(\.\d+)?$/.test(v)) return "Enter a number.";
  if (Number(v) <= 0) return "Must be above zero.";
  const fraction = v.split(".")[1] || "";
  if (fraction.length > decimals) return `Up to ${decimals} decimals.`;
  return "";
}

/** Cons routes always involve Solana on one side. */
export function validatePair(source, destination) {
  if (!source || !destination) return "Choose both networks.";
  if (source === destination) return "Choose two different networks.";
  if (source !== "solana" && destination !== "solana") return "Cons routes start or end on Solana.";
  return "";
}

const encoder = new TextEncoder();

/** Payload size in bytes for text or hex encoding, or an error message. */
export function payloadBytes(value, encoding) {
  const v = String(value || "");
  if (!v.trim()) return { bytes: 0, error: "Required." };
  if (encoding === "hex") {
    const hex = v.trim().replace(/^0x/i, "");
    if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2) return { bytes: 0, error: "Enter even length hex." };
    return { bytes: hex.length / 2, error: "" };
  }
  return { bytes: encoder.encode(v).length, error: "" };
}
