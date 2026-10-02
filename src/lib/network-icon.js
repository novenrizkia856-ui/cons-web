/* Network logo markup. Each call gets unique gradient and clip ids, so
   repeated logos still render when another copy is hidden. */
import { networkIcons, networkMarks, tokenIcons } from "./network-icons.js";

let seq = 0;

function unique(svg) {
  const n = ++seq;
  return svg.replace(/id="([^"]+)"/g, `id="$1_${n}"`).replace(/url\(#([^)]+)\)/g, `url(#$1_${n})`);
}

/** Logo on its brand colour, for HTML (shown as a round badge by CSS). */
export function networkIcon(id) {
  return networkIcons[id] ? unique(networkIcons[id]) : "";
}

/** Token logo on its brand colour, by symbol (USDC, USDT). */
export function tokenIcon(symbol) {
  return tokenIcons[symbol] ? unique(tokenIcons[symbol]) : "";
}

/** Bare mark as a nested <svg>, centred on (cx, cy), for drawing inside an SVG figure. */
export function networkMark(id, size, cx = 0, cy = 0) {
  if (!networkMarks[id]) return "";
  return unique(networkMarks[id]).replace("<svg ", `<svg x="${cx - size / 2}" y="${cy - size / 2}" width="${size}" height="${size}" `);
}
