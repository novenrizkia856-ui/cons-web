import { icons } from "./icons.js";

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;opacity:0;pointer-events:none";
    document.body.append(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}

function flashTip(button, text) {
  button.dataset.tip = text;
  button.classList.add("show-tip");
  clearTimeout(button._tipTimer);
  button._tipTimer = setTimeout(() => button.classList.remove("show-tip", "copied"), 1600);
}

export function setCopyValue(button, value, { label = "Copy", unavailable = "Not available yet" } = {}) {
  button.dataset.value = value || "";
  button.dataset.unavailable = unavailable;
  button.setAttribute("aria-label", value ? label : `${label}. ${unavailable}`);
  if (value) button.removeAttribute("aria-disabled");
  else button.setAttribute("aria-disabled", "true");
}

/**
 * A copy button. With an empty value it stays focusable but inert and says
 * why, so nothing unavailable is ever copied.
 */
export function copyButton(value, options = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-btn";
  button.innerHTML = icons.copy + icons.check;
  setCopyValue(button, value, options);
  bindCopy(button);
  return button;
}

export function bindCopy(button) {
  if (button._copyBound) return;
  button._copyBound = true;
  button.addEventListener("click", async () => {
    const current = button.dataset.value;
    if (!current) {
      flashTip(button, button.dataset.unavailable || "Not available yet");
      return;
    }
    const ok = await copyText(current);
    if (ok) button.classList.add("copied");
    flashTip(button, ok ? "Copied" : "Copy failed");
  });
}
