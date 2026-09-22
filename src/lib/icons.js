/* Line icons, 24px grid, 1.6 stroke, matching the reference icon weight. */
const svg = (body, extra = "") =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${extra}>${body}</svg>`;

export const icons = {
  copy: svg('<rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/>', ' class="i-copy"'),
  check: svg('<path d="M5 12.5l4.2 4L19 7"/>', ' class="i-check"'),
  tick: svg('<path d="M5 12.5l4.2 4L19 7"/>'),
  arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  external: svg('<path d="M14 5h5v5M19 5l-8 8M18 14v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18V7.5A1.5 1.5 0 0 1 5.5 6H10"/>'),
  swap: svg('<path d="M7 4v16M3.5 7.5 7 4l3.5 3.5M17 20V4M13.5 16.5 17 20l3.5-3.5"/>'),
  route: svg('<circle cx="5.5" cy="6" r="2.2"/><circle cx="18.5" cy="18" r="2.2"/><path d="M7.7 6H14a3.5 3.5 0 0 1 0 7h-4a3.5 3.5 0 0 0 0 7h6.3"/>'),
  token: svg('<circle cx="12" cy="12" r="8"/><path d="M9 12h6M12 9v6"/>'),
  message: svg('<path d="M4.5 6.5h15v9.5h-8.5L7 19.5V16H4.5z"/><path d="M8.5 10.5h7M8.5 13h4"/>'),
  activity: svg('<path d="M3.5 12h4l2.5-6 4 12 2.5-6h4"/>'),
  receipt: svg('<path d="M6 3.5h12v17l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path d="M9 8h6M9 11.5h6M9 15h3.5"/>'),
  providers: svg('<rect x="3.5" y="4" width="17" height="5" rx="1.5"/><rect x="3.5" y="15" width="17" height="5" rx="1.5"/><path d="M7 6.5h.01M7 17.5h.01M12 9v6"/>'),
  shield: svg('<path d="M12 3.5 19 6v5.5c0 4.2-3 7.6-7 9-4-1.4-7-4.8-7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>'),
  bolt: svg('<path d="M13 3.5 5.5 13.5H12l-1 7 7.5-10H12z"/>'),
  coin: svg('<ellipse cx="12" cy="7" rx="7" ry="3"/><path d="M5 7v5c0 1.7 3.1 3 7 3s7-1.3 7-3V7M5 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"/>'),
  pulse: svg('<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6 18 18M6 18l1.4-1.4M16.6 7.4 18 6"/>'),
  layers: svg('<path d="m12 4 8.5 4.5L12 13 3.5 8.5z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5M3.5 16.5 12 21l8.5-4.5"/>'),
  search: svg('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
  code: svg('<path d="m9 7-5 5 5 5M15 7l5 5-5 5"/>'),
  eye: svg('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>'),
  retry: svg('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4"/>'),
  split: svg('<path d="M4 12h5l4-6h7M13 18l-4-6M13 18h7M17 3.5 20 6l-3 2.5M17 15.5l3 2.5-3 2.5"/>'),
  list: svg('<path d="M9 6.5h11M9 12h11M9 17.5h11M4.5 6.5h.01M4.5 12h.01M4.5 17.5h.01"/>'),
  wallet: svg('<path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3"/><rect x="4" y="8" width="16.5" height="11" rx="2.5"/><path d="M16 13.5h.01"/>'),
  close: svg('<path d="M6 6l12 12M18 6 6 18"/>'),
  chevron: svg('<path d="m6 9 6 6 6-6"/>'),
  info: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/>'),
  lock: svg('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>'),
  program: svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><path d="m8 10 2.5 2L8 14M12.5 14.5h3.5"/>'),
  mint: svg('<path d="M12 3.5 19.5 8v8L12 20.5 4.5 16V8z"/><path d="M12 8v8M8.5 10l3.5 2 3.5-2"/>'),
  signature: svg('<path d="M3.5 17c3 0 4-9 6.5-9s-1 8 1.5 8 2.5-4 4.5-4 1.5 3 4.5 3M3.5 20.5h17"/>'),
  account: svg('<circle cx="12" cy="9" r="3.5"/><path d="M5 19.5c1.2-3.3 3.8-5 7-5s5.8 1.7 7 5"/>'),
  cpi: svg('<rect x="3.5" y="4" width="7" height="7" rx="1.8"/><rect x="13.5" y="13" width="7" height="7" rx="1.8"/><path d="M10.5 7.5h4a2.5 2.5 0 0 1 2.5 2.5v3"/>'),
  instruction: svg('<path d="M5 5.5h14M5 10h9M5 14.5h14M5 19h6"/>'),
  pda: svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17" stroke-dasharray="2 2.5"/><circle cx="12" cy="12" r="2.2"/>'),
  ata: svg('<rect x="3.5" y="6" width="17" height="12" rx="2.5"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10.5h3.5M14 13.5h2"/>'),
  token2022: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.5"/><path d="M12 4v3.5M12 16.5V20"/>'),
  book: svg('<path d="M4.5 5.5A1.5 1.5 0 0 1 6 4h13.5v14H6a1.5 1.5 0 0 0-1.5 1.5z"/><path d="M4.5 19.5A1.5 1.5 0 0 0 6 21h13.5v-3"/>'),
};

/** The Cons mark: an open route ring and the node it arrives at. */
export const markSvg = (id = "m") => `<svg viewBox="0 0 32 32" aria-hidden="true">
  <defs><linearGradient id="${id}g" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse"><stop style="stop-color:var(--strong)"/><stop offset="1" style="stop-color:var(--muted)"/></linearGradient></defs>
  <path d="M23.4 8.4A10.5 10.5 0 1 0 23.4 23.6" fill="none" stroke="url(#${id}g)" stroke-width="4" stroke-linecap="round"/>
  <path d="M12.5 16h7.5" stroke="url(#${id}g)" stroke-width="4" stroke-linecap="round"/>
  <circle cx="26.2" cy="16" r="3.1" style="fill:var(--accent-fill)"/>
</svg>`;
