/* Cons icon set. 24px grid, 1.6 stroke, duotone: every glyph pairs its line
   work with a soft tinted fill (the .duo layer), so icons read as solid objects
   at small sizes and pick up the champagne accent inside the lit tiles. */
const svg = (body, duo = "", extra = "") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${
    duo ? `<g class="duo" fill="currentColor" stroke="none">${duo}</g>` : ""
  }${body}</svg>`;

export const icons = {
  copy: svg('<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>', '<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/>', ' class="i-copy"'),
  check: svg('<path d="M5 12.5l4.2 4L19 7"/>', "", ' class="i-check"'),
  tick: svg('<path d="M5 12.5l4.2 4L19 7"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  arrowUp: svg('<path d="M7 17 17 7M8.5 7H17v8.5"/>'),
  external: svg('<path d="M14 5h5v5M19 5l-8 8M18 14v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18V7.5A1.5 1.5 0 0 1 5.5 6H10"/>'),
  swap: svg('<path d="M7 4v16M3.5 7.5 7 4l3.5 3.5M17 20V4M13.5 16.5 17 20l3.5-3.5"/>'),
  route: svg(
    '<circle cx="5.5" cy="6" r="2.4"/><circle cx="18.5" cy="18" r="2.4"/><path d="M7.9 6H14a3.5 3.5 0 0 1 0 7h-4a3.5 3.5 0 0 0 0 7h6.1"/>',
    '<circle cx="5.5" cy="6" r="2.4"/><circle cx="18.5" cy="18" r="2.4"/>',
  ),
  token: svg(
    '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><path d="M12 9.6v4.8M10 12h4"/>',
    '<circle cx="12" cy="12" r="8.5"/>',
  ),
  message: svg(
    '<path d="M4.5 7a2.5 2.5 0 0 1 2.5-2.5h10A2.5 2.5 0 0 1 19.5 7v7a2.5 2.5 0 0 1-2.5 2.5h-6L7 20v-3.5A2.5 2.5 0 0 1 4.5 14z"/><path d="M8.5 9.5h7M8.5 12.5h4"/>',
    '<path d="M4.5 7a2.5 2.5 0 0 1 2.5-2.5h10A2.5 2.5 0 0 1 19.5 7v7a2.5 2.5 0 0 1-2.5 2.5h-6L7 20v-3.5A2.5 2.5 0 0 1 4.5 14z"/>',
  ),
  activity: svg('<path d="M3.5 12.5h3.5l2.4-6 4.2 11.5 2.4-5.5h4.5"/>', '<path d="M3.5 20.5h17v-6l-3.5-2-2.6 5.5-4.2-11.5-2.4 6H3.5z" opacity=".55"/>'),
  receipt: svg(
    '<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>',
    '<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/>',
  ),
  providers: svg(
    '<rect x="3.5" y="4" width="17" height="6" rx="2"/><rect x="3.5" y="14" width="17" height="6" rx="2"/><path d="M7 7h.01M7 17h.01M10 7h3M10 17h3"/>',
    '<rect x="3.5" y="4" width="17" height="6" rx="2"/><rect x="3.5" y="14" width="17" height="6" rx="2"/>',
  ),
  shield: svg('<path d="M12 3.5 19 6v5.5c0 4.2-3 7.6-7 9-4-1.4-7-4.8-7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>', '<path d="M12 3.5 19 6v5.5c0 4.2-3 7.6-7 9-4-1.4-7-4.8-7-9V6z"/>'),
  bolt: svg('<path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12z"/>', '<path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12z"/>'),
  coin: svg(
    '<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>',
    '<ellipse cx="12" cy="7" rx="7" ry="3"/>',
  ),
  pulse: svg(
    '<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6"/>',
    '<circle cx="12" cy="12" r="5.5" opacity=".6"/>',
  ),
  layers: svg('<path d="m12 4 8.5 4.5L12 13 3.5 8.5z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5"/>', '<path d="m12 4 8.5 4.5L12 13 3.5 8.5z"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2M8.3 9.2a3 3 0 0 1 2.4-1.9"/>', '<circle cx="11" cy="11" r="6.5"/>'),
  code: svg('<rect x="3.5" y="4.5" width="17" height="15" rx="3"/><path d="m10 9.5-2.5 2.5 2.5 2.5M14 9.5l2.5 2.5-2.5 2.5"/>', '<rect x="3.5" y="4.5" width="17" height="15" rx="3"/>'),
  eye: svg('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>', '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/>'),
  retry: svg('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4"/>', '<circle cx="12" cy="12" r="4"/>'),
  split: svg(
    '<circle cx="5" cy="12" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="19" cy="18" r="2.2"/><path d="M7.2 12H10c2 0 2.5-6 6.8-6M10 12c2 0 2.5 6 6.8 6"/>',
    '<circle cx="5" cy="12" r="2.2"/><circle cx="19" cy="6" r="2.2"/><circle cx="19" cy="18" r="2.2"/>',
  ),
  list: svg('<path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>'),
  wallet: svg(
    '<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H17v3"/><rect x="4" y="8" width="16.5" height="11" rx="2.5"/><path d="M20.5 11.5h-3.5a2 2 0 0 0 0 4h3.5"/>',
    '<rect x="4" y="8" width="16.5" height="11" rx="2.5"/>',
  ),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  chevron: svg('<path d="m6 9 6 6 6-6"/>'),
  info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>', '<circle cx="12" cy="12" r="8.5"/>'),
  lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5M12 14.5v2"/>', '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/>'),
  program: svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="m8 10 2.5 2L8 14M12.5 14.5h3.5"/>', '<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/>'),
  mint: svg('<path d="M12 3.5 19.5 8v8L12 20.5 4.5 16V8z"/><path d="M12 12v8.5M12 12 4.5 8M12 12l7.5-4"/>', '<path d="M12 3.5 19.5 8 12 12 4.5 8z"/>'),
  signature: svg('<path d="M3.5 16c3 0 4-9 6.5-9s-1 8 1.5 8 2.5-4 4.5-4 1.5 3 4.5 3M3.5 20h17"/>', '<rect x="3.5" y="18.5" width="17" height="3" rx="1.5" opacity=".7"/>'),
  account: svg('<circle cx="12" cy="9" r="3.5"/><path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5"/>', '<circle cx="12" cy="9" r="3.5"/><path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5z"/>'),
  cpi: svg(
    '<rect x="3.5" y="4" width="7" height="7" rx="1.8"/><rect x="13.5" y="13" width="7" height="7" rx="1.8"/><path d="M10.5 7.5h4a2.5 2.5 0 0 1 2.5 2.5v3"/><path d="m15 11 2 2 2-2"/>',
    '<rect x="3.5" y="4" width="7" height="7" rx="1.8"/><rect x="13.5" y="13" width="7" height="7" rx="1.8"/>',
  ),
  instruction: svg('<path d="M9 5.5h10M9 10h7M9 14.5h10M9 19h5"/><circle cx="5" cy="5.5" r="1.2"/><circle cx="5" cy="14.5" r="1.2"/>', '<circle cx="5" cy="5.5" r="1.2"/><circle cx="5" cy="14.5" r="1.2"/>'),
  pda: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17" stroke-dasharray="2 2.5"/><circle cx="12" cy="12" r="2.4"/>', '<circle cx="12" cy="12" r="8.5"/>'),
  ata: svg('<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10.5h3.5M14 13.5h2"/>', '<rect x="3.5" y="6" width="17" height="12" rx="2.5"/>'),
  token2022: svg('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 3.5v4M12 16.5v4"/>', '<circle cx="12" cy="12" r="4.5"/>'),
  book: svg('<path d="M4.5 5.5A1.5 1.5 0 0 1 6 4h13.5v14H6a1.5 1.5 0 0 0-1.5 1.5z"/><path d="M4.5 19.5A1.5 1.5 0 0 0 6 21h13.5v-3M9 8h6"/>', '<path d="M4.5 5.5A1.5 1.5 0 0 1 6 4h13.5v14H6a1.5 1.5 0 0 0-1.5 1.5z"/>'),
  globe: svg('<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5z"/>', '<circle cx="12" cy="12" r="8.5"/>'),
  spark: svg('<path d="M12 3.5c.6 4.6 3.9 7.9 8.5 8.5-4.6.6-7.9 3.9-8.5 8.5-.6-4.6-3.9-7.9-8.5-8.5 4.6-.6 7.9-3.9 8.5-8.5z"/>', '<path d="M12 3.5c.6 4.6 3.9 7.9 8.5 8.5-4.6.6-7.9 3.9-8.5 8.5-.6-4.6-3.9-7.9-8.5-8.5 4.6-.6 7.9-3.9 8.5-8.5z"/>'),
  clock: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>', '<circle cx="12" cy="12" r="8.5"/>'),
  fee: svg('<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.2c-.5-.8-1.4-1.2-2.5-1.2-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.1 0-2-.4-2.5-1.2M12 6.5v1.5M12 16v1.5"/>', '<circle cx="12" cy="12" r="8.5"/>'),
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.75 3.5h3.07l-6.7 7.66L22 20.5h-6.17l-4.83-6.32-5.53 6.32H2.4l7.17-8.2L2 3.5h6.33l4.37 5.78zm-1.08 15.2h1.7L7.4 5.2H5.58z"/></svg>',
  github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.5a9.5 9.5 0 0 0-3 18.5c.5.1.7-.2.7-.5v-1.7c-2.6.6-3.2-1.2-3.2-1.2-.4-1.1-1-1.4-1-1.4-.9-.6 0-.6 0-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.3 1.1 2.9.8.1-.6.3-1.1.6-1.3-2.1-.2-4.3-1-4.3-4.7 0-1 .4-1.9 1-2.6-.1-.2-.4-1.2.1-2.5 0 0 .8-.3 2.6 1a9 9 0 0 1 4.8 0c1.8-1.3 2.6-1 2.6-1 .5 1.3.2 2.3.1 2.5.6.7 1 1.6 1 2.6 0 3.7-2.2 4.5-4.3 4.7.3.3.6.9.6 1.8v2.6c0 .3.2.6.7.5A9.5 9.5 0 0 0 12 2.5z"/></svg>',
};

/* Brand mark from public/brand. Dark surfaces take the white file, light ones the black. */
export const markImg = (tone = "black") =>
  `<img class="mark-img" src="/brand/cons-mark-${tone}.png" alt="" width="288" height="256" decoding="async">`;
export const markTone = (el) => (el.closest(".scope-dark, .announce, .band, .footer") ? "white" : "black");
