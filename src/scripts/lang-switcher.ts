// Language switcher SVG icon
const langIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M4.545 6.714 4.11 8H3l1.862-5h1.284L8 8H6.833l-.435-1.286zm1.634-.736L5.5 3.956h-.049l-.679 2.022z"/><path d="M0 2a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v3h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3H2a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zm7.138 9.995q.289.451.63.846c-.748.575-1.673 1.001-2.768 1.292.178.217.451.635.555.867 1.125-.359 2.08-.844 2.886-1.494.777.665 1.739 1.165 2.93 1.472.133-.254.414-.673.629-.89-1.125-.253-2.057-.694-2.82-1.284.681-.747 1.222-1.651 1.621-2.757H14V8h-3v1.047h.765c-.318.844-.74 1.546-1.272 2.13a6 6 0 0 1-.415-.492 2 2 0 0 1-.94.31"/></svg>`;

function initializeLanguageSwitcher(container: Element) {
  const btn = container.querySelector(".lang-btn") as HTMLButtonElement | null;
  const enContent = container.querySelector(
    ".lang-content:first-of-type",
  ) as HTMLElement | null;
  const zhContent = container.querySelector(
    ".lang-content:last-of-type",
  ) as HTMLElement | null;

  if (!btn || !enContent || !zhContent) return;

  // Inject the SVG icon if button is empty
  if (!btn.innerHTML.trim()) {
    btn.innerHTML = langIcon;
  }

  btn.addEventListener("click", () => {
    const isActive = btn.classList.toggle("active");
    enContent.classList.toggle("active", !isActive);
    zhContent.classList.toggle("active", isActive);
    btn.setAttribute(
      "data-tooltip",
      isActive
        ? "Switch to Original Version"
        : "Switch to Native Language Version",
    );
  });
}

document.querySelectorAll(".lang-container").forEach((container) => {
  initializeLanguageSwitcher(container);
});

document.querySelectorAll(".prose").forEach((prose) => {
  const markers = Array.from(prose.querySelectorAll("h2"));
  const englishMarker = markers.find(
    (marker) => marker.textContent?.trim() === "English",
  );
  const nativeMarker = markers.find(
    (marker) => marker.textContent?.trim() === "中文",
  );

  if (
    !englishMarker ||
    !nativeMarker ||
    englishMarker.parentElement !== nativeMarker.parentElement
  ) {
    return;
  }

  const parent = englishMarker.parentElement;
  if (!parent) return;

  const container = document.createElement("div");
  container.className = "lang-container";
  const btn = document.createElement("button");
  btn.className = "lang-btn";
  btn.setAttribute("data-tooltip", "Switch to Native Language Version");
  btn.setAttribute("aria-label", "Switch language");
  const englishContent = document.createElement("div");
  englishContent.className = "lang-content active";
  const nativeContent = document.createElement("div");
  nativeContent.className = "lang-content";

  parent.insertBefore(container, englishMarker);
  container.append(btn, englishContent, nativeContent);

  let current = englishMarker.nextSibling;
  while (current && current !== nativeMarker) {
    const next = current.nextSibling;
    englishContent.appendChild(current);
    current = next;
  }

  current = nativeMarker.nextSibling;
  while (current && !(current.nodeType === Node.ELEMENT_NODE && (current as Element).tagName === "HR")) {
    const next = current.nextSibling;
    nativeContent.appendChild(current);
    current = next;
  }

  englishMarker.remove();
  nativeMarker.remove();
  initializeLanguageSwitcher(container);
});
