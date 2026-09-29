/* Cons docs behaviour: search, mobile rail, outline highlight, code copy and
   diagram reveals. Plain script, copied next to the generated pages. Every
   page reads fine without it. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  /* ------------------------------------------------------ mobile rail -- */
  const rail = $("#docs-rail");
  const scrim = $(".rail-scrim");
  const menu = $(".menu-btn");
  const setRail = (open) => {
    rail.classList.toggle("open", open);
    scrim.hidden = !open;
    menu.setAttribute("aria-expanded", String(open));
    document.body.style.overflow = open ? "hidden" : "";
  };
  menu?.addEventListener("click", () => setRail(!rail.classList.contains("open")));
  scrim?.addEventListener("click", () => setRail(false));
  $('[aria-current="page"]', rail)?.scrollIntoView({ block: "center" });

  /* ------------------------------------------------------------ copy ---- */
  for (const btn of $$(".docs-copy")) {
    btn.addEventListener("click", async () => {
      const code = btn.closest(".docs-code").querySelector("code").textContent;
      try {
        await navigator.clipboard.writeText(code);
      } catch {
        return;
      }
      const word = btn.querySelector("span");
      btn.classList.add("done");
      word.textContent = "Copied";
      setTimeout(() => (btn.classList.remove("done"), (word.textContent = "Copy")), 1600);
    });
  }

  /* --------------------------------------------------------- outline ---- */
  const links = $$(".docs-outline li a");
  if (links.length && "IntersectionObserver" in window) {
    const targets = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
    const mark = () => {
      const line = innerHeight * 0.3;
      let current = targets[0];
      for (const t of targets) if (t.getBoundingClientRect().top <= line) current = t;
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) current = targets[targets.length - 1];
      links.forEach((a) => a.classList.toggle("is-active", a.hash === `#${current.id}`));
    };
    let queued = false;
    addEventListener("scroll", () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => ((queued = false), mark()));
    }, { passive: true });
    mark();
  }

  /* ---------------------------------------------------------- reveal ---- */
  const reveals = $$("[data-reveal]");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) (e.target.classList.add("in"), io.unobserve(e.target));
    }, { rootMargin: "0px 0px -6% 0px" });
    reveals.forEach((el) => io.observe(el));
  } else reveals.forEach((el) => el.classList.add("in"));

  /* ---------------------------------------------------------- search ---- */
  const dialog = $(".search");
  const input = $("input", dialog);
  const list = $(".search-results", dialog);
  let index = null;
  let results = [];
  let active = 0;
  let opener = null;

  const load = () =>
    index ??
    fetch("search.json")
      .then((r) => r.json())
      .then((data) => (index = data))
      .catch(() => (index = []));

  function open() {
    opener = document.activeElement;
    setRail(false);
    dialog.hidden = false;
    document.body.style.overflow = "hidden";
    input.value = "";
    Promise.resolve(load()).then(() => run(""));
    input.focus();
  }
  function close() {
    dialog.hidden = true;
    document.body.style.overflow = "";
    opener?.focus?.();
  }

  const highlight = (text, terms) =>
    terms.reduce((html, t) => html.replace(new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"), "<mark>$1</mark>"), esc(text));

  function snippet(text, terms) {
    const lower = text.toLowerCase();
    const hits = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0);
    const at = hits.length ? Math.max(0, Math.min(...hits) - 50) : 0;
    return (at > 0 ? "… " : "") + text.slice(at, at + 180);
  }

  function run(query) {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    results = [];
    if (!terms.length) {
      results = (index || []).map((p) => ({ page: p, section: null, score: 0 }));
    } else {
      for (const page of index || []) {
        for (const section of page.sections) {
          const title = page.title.toLowerCase();
          const heading = section.heading.toLowerCase();
          const body = section.text.toLowerCase();
          let score = 0;
          let hit = true;
          for (const t of terms) {
            const s = (title.includes(t) ? 6 : 0) + (heading.includes(t) ? 4 : 0) + (body.includes(t) ? 1 : 0);
            if (!s) hit = false;
            score += s;
          }
          if (hit) results.push({ page, section, score: score + (section.id ? 0 : 1) });
        }
      }
      results.sort((a, b) => b.score - a.score);
      results = results.slice(0, 24);
    }
    active = 0;
    paint(terms);
  }

  function paint(terms) {
    if (!results.length) {
      list.innerHTML = `<li class="search-empty">No results for “${esc(input.value.trim())}”</li>`;
      return;
    }
    let html = "";
    let group = null;
    results.forEach((r, i) => {
      if (!terms.length && r.page.group !== group) {
        group = r.page.group;
        html += `<li class="search-group" role="presentation">${esc(group)}</li>`;
      }
      const href = r.section?.id ? `${r.page.page}#${r.section.id}` : r.page.page;
      const title = r.section?.heading || r.page.title;
      const path = r.section?.heading ? `${r.page.group} / ${r.page.title}` : r.page.group;
      const text = terms.length ? highlight(snippet(r.section.text, terms), terms) : "";
      html += `<li role="option" id="sr-${i}" aria-selected="${i === active}"><a href="${href}"><span class="r-path">${esc(path)}</span><span class="r-title">${terms.length ? highlight(title, terms) : esc(title)}</span>${text ? `<span class="r-text">${text}</span>` : ""}</a></li>`;
    });
    list.innerHTML = html;
    input.setAttribute("aria-activedescendant", `sr-${active}`);
  }

  function move(step) {
    if (!results.length) return;
    active = (active + step + results.length) % results.length;
    $$('[role="option"]', list).forEach((li) => li.setAttribute("aria-selected", String(li.id === `sr-${active}`)));
    $(`#sr-${active}`, list)?.scrollIntoView({ block: "nearest" });
    input.setAttribute("aria-activedescendant", `sr-${active}`);
  }

  $$("[data-search-open]").forEach((b) => b.addEventListener("click", open));
  dialog.addEventListener("click", (e) => e.target === dialog && close());
  list.addEventListener("click", (e) => e.target.closest("a") && close());
  input.addEventListener("input", () => run(input.value));
  input.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") (e.preventDefault(), move(1));
    else if (e.key === "ArrowUp") (e.preventDefault(), move(-1));
    else if (e.key === "Enter") {
      const a = $(`#sr-${active} a`, list);
      if (a) (e.preventDefault(), close(), (location.href = a.href));
    }
  });
  addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if ((e.key === "k" || e.key === "K") && (e.ctrlKey || e.metaKey)) (e.preventDefault(), dialog.hidden ? open() : close());
    else if (e.key === "/" && !typing && dialog.hidden) (e.preventDefault(), open());
    else if (e.key === "Escape") {
      if (!dialog.hidden) close();
      else if (rail.classList.contains("open")) setRail(false);
    }
  });
  if (/Mac|iPhone|iPad/.test(navigator.platform)) $$(".search-btn kbd").forEach((k) => (k.textContent = "⌘ K"));
})();
