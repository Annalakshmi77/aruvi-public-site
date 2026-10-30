// Shared helpers for the guided tour and the auto-play demo of the Perfox chat widget.

declare global {
  interface Window {
    Perfox?: (command: string, ...args: unknown[]) => void;
  }
}

// Controls inside the chat window, matched by the widget's own aria-labels.
export const WIDGET_SELECTORS = {
  messageBox: "textarea, input[type='text']",
  attach: "[aria-label*='attach' i], [title*='attach' i], [aria-label*='upload' i], [title*='upload' i]",
  voiceNote: "[aria-label='Record a voice note']",
  voiceMode: "[aria-label='Use voice mode']",
  send: "[aria-label='Send']",
  newChat: "[aria-label='New chat']",
  history: "[aria-label='History']",
  fullscreen: "[aria-label='Fullscreen']",
  closeHistory: "[aria-label='Close history']",
  exitFullscreen: "[aria-label='Exit fullscreen']",
};

const RING_ID = "agent-tour-ring";

export function isVisible(el: Element | null | undefined): el is Element {
  if (!el) return false;
  const rect = el.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

// The Perfox widget renders inside an open shadow root on #perfox-widget.
function widgetRoot(): ShadowRoot | HTMLElement | null {
  const host = document.getElementById("perfox-widget");
  return host?.shadowRoot ?? host;
}

export function queryWidget(selector: string): Element | null {
  const found = widgetRoot()?.querySelectorAll(selector) ?? [];
  return Array.from(found).find(isVisible) ?? null;
}

export function findAgentLauncher(): Element | null {
  return queryWidget("button");
}

// The chat panel (or the history panel inside it): the largest box around a known control
// that is still smaller than the screen, so full-screen wrappers are ignored.
export function findChatWindow(): Element | null {
  const s = WIDGET_SELECTORS;
  const start = [s.messageBox, s.closeHistory, s.history, s.newChat, s.exitFullscreen, s.fullscreen]
    .map(queryWidget)
    .find((found) => found !== null);
  if (!start) return null;

  const screenArea = window.innerWidth * window.innerHeight;
  let best: Element | null = null;
  for (let node = start.parentElement; node; node = node.parentElement) {
    if (!isVisible(node)) continue;
    const r = node.getBoundingClientRect();
    if (r.width * r.height >= screenArea * 0.92) break;
    best = node;
  }
  return best;
}

export function isChatOpen(): boolean {
  return queryWidget(WIDGET_SELECTORS.messageBox) !== null;
}

export function focusMessageBox() {
  (queryWidget(WIDGET_SELECTORS.messageBox) as HTMLElement | null)?.focus();
}

// Resolves once the chat window's message box is on screen, or null after the timeout.
export function waitForChatWindow(timeoutMs = 5000): Promise<Element | null> {
  return new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      const input = queryWidget(WIDGET_SELECTORS.messageBox);
      if (input) return resolve(input);
      if (Date.now() - started > timeoutMs) return resolve(null);
      setTimeout(check, 150);
    };
    check();
  });
}

// Resolves once the widget launcher button/bubble is rendered and visible in DOM, or null after timeout.
export function waitForWidgetLauncher(timeoutMs = 8000): Promise<Element | null> {
  return new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      const launcher = findAgentLauncher();
      if (launcher && isVisible(launcher)) return resolve(launcher);
      if (Date.now() - started > timeoutMs) return resolve(null);
      setTimeout(check, 150);
    };
    check();
  });
}

// Opens the chat and waits for its open animation to settle before positions are measured.
export async function openChat(): Promise<boolean> {
  window.Perfox?.("open");
  const ready = await waitForChatWindow();
  await new Promise((r) => setTimeout(r, 400));
  return ready !== null;
}

// Glowing ring drawn over a highlighted element. Page CSS can't reach inside the
// widget's shadow DOM, so the ring is a separate fixed element placed on top.
export function showRing(element?: Element) {
  let ring = document.getElementById(RING_ID);
  if (!element) {
    ring?.remove();
    return;
  }
  if (!ring) {
    ring = document.createElement("div");
    ring.id = RING_ID;
    document.body.appendChild(ring);
  }
  const rect = element.getBoundingClientRect();
  const pad = 6;
  const round = rect.width < 64 && Math.abs(rect.width - rect.height) < 8;
  Object.assign(ring.style, {
    left: `${rect.left - pad}px`,
    top: `${rect.top - pad}px`,
    width: `${rect.width + pad * 2}px`,
    height: `${rect.height + pad * 2}px`,
    borderRadius: round ? "9999px" : "14px",
  });
  // Restart the entrance animation for each highlight.
  ring.classList.remove("is-visible");
  void ring.offsetWidth;
  ring.classList.add("is-visible");
}

export function removeRing() {
  document.getElementById(RING_ID)?.remove();
}

// Only one guide (tour or demo) may run at a time.
let guideActive = false;

export function claimGuide(): boolean {
  if (guideActive) return false;
  guideActive = true;
  return true;
}

export function releaseGuide() {
  guideActive = false;
}
