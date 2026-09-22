/**
 * Cons Program boundary.
 *
 * This is where a routed request becomes a Solana transaction. It is not
 * implemented, because the Cons Program is not deployed yet. The UI calls
 * getExecutionReadiness() to decide what the submit control says, and calls
 * prepareTransfer / prepareMessage only when readiness is "ready".
 *
 * To integrate once the program ships:
 *   1. Set PUBLIC_CONS_PROGRAM_ID (and PUBLIC_SOLANA_RPC_URL) in the env.
 *   2. Add @solana/web3.js (or @solana/kit) and the program IDL.
 *   3. Implement prepareTransfer / prepareMessage to build the instructions,
 *      deriving the request PDA from consConfig.programId and binding the
 *      selected route (route commitment) into the request.
 *   4. Hand the transaction to the connected wallet for signing in
 *      src/services/wallet.js, then track it through src/services/routing.js.
 *   5. Set IMPLEMENTED below to true.
 */
import { consConfig, integration } from "../config/cons.js";

const IMPLEMENTED = false;

export class NotReadyError extends Error {
  constructor(message, reason) {
    super(message);
    this.name = "NotReadyError";
    this.reason = reason;
  }
}

/**
 * readiness: "no-program" | "pending" | "no-wallet" | "ready"
 */
export function getExecutionReadiness({ walletAddress } = {}) {
  if (!integration.hasProgram) {
    return { status: "no-program", label: "Program not deployed", detail: "Routing is shown in preview. Submission opens when the Cons Program is live." };
  }
  if (!IMPLEMENTED) {
    return { status: "pending", label: "Submission not enabled", detail: `Program ${consConfig.programId.slice(0, 4)}…${consConfig.programId.slice(-4)} is configured. Instruction building is not enabled in this build.` };
  }
  if (!walletAddress) {
    return { status: "no-wallet", label: "Connect wallet", detail: "Connect a Solana wallet to sign the request." };
  }
  return { status: "ready", label: "Sign and submit", detail: "Your wallet will ask you to approve the transaction." };
}

function assertReady() {
  const readiness = getExecutionReadiness({ walletAddress: "check" });
  if (readiness.status !== "ready" && readiness.status !== "no-wallet") throw new NotReadyError(readiness.detail, readiness.status);
}

/** Build the Solana transaction for a token route. Not implemented yet. */
export async function prepareTransfer(/* request, route, walletAddress */) {
  assertReady();
  throw new NotReadyError("Transfer instruction building is not implemented.", "pending");
}

/** Build the Solana transaction for a message route. Not implemented yet. */
export async function prepareMessage(/* request, route, walletAddress */) {
  assertReady();
  throw new NotReadyError("Message instruction building is not implemented.", "pending");
}
