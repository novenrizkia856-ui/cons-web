/* The normalized Cons lifecycle. Every provider state maps onto these. */

export const STATES = Object.freeze({
  CREATED: { label: "Created", tone: "info" },
  SUBMITTED: { label: "Submitted", tone: "info" },
  IN_TRANSIT: { label: "In Transit", tone: "warn" },
  DESTINATION_RECEIVED: { label: "Destination Received", tone: "warn" },
  CONFIRMED: { label: "Confirmed", tone: "ok" },
  RETRYING: { label: "Retrying", tone: "warn" },
  FAILED: { label: "Failed", tone: "err" },
  EXPIRED: { label: "Expired", tone: "err" },
  CANCELLED: { label: "Cancelled", tone: "plain" },
});

export const MAIN_PATH = Object.freeze(["CREATED", "SUBMITTED", "IN_TRANSIT", "DESTINATION_RECEIVED", "CONFIRMED"]);
export const ALT_STATES = Object.freeze(["RETRYING", "FAILED", "EXPIRED", "CANCELLED"]);
export const TERMINAL = Object.freeze(["CONFIRMED", "FAILED", "EXPIRED", "CANCELLED"]);

export const stateLabel = (key) => STATES[key]?.label ?? key;
export const stateTone = (key) => STATES[key]?.tone ?? "plain";

/** How far along the main path a request got, for steppers. */
export function progressIndex(status, reached) {
  const direct = MAIN_PATH.indexOf(status);
  if (direct !== -1) return direct;
  const last = reached ? MAIN_PATH.indexOf(reached) : -1;
  return last === -1 ? 1 : last;
}
