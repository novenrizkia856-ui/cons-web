/* Branded network logo markup. Each call gets unique gradient and clip ids,
   so repeated logos still render when another copy is hidden. */
import { networkIcons } from "./network-icons.js";

let seq = 0;

export function networkIcon(id) {
  const svg = networkIcons[id];
  if (!svg) return "";
  const n = ++seq;
  return svg.replace(/id="([^"]+)"/g, `id="$1_${n}"`).replace(/url\(#([^)]+)\)/g, `url(#$1_${n})`);
}
