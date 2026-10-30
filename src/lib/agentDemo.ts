import {
  WIDGET_SELECTORS,
  claimGuide,
  findAgentLauncher,
  findChatWindow,
  focusMessageBox,
  isChatOpen,
  openChat,
  queryWidget,
  releaseGuide,
  waitForWidgetLauncher,
} from "@/lib/agentWidget";
import { ARROW_RIGHT, ICONS, svg, type IconName } from "@/lib/agentIcons";

const SAMPLE_QUESTION = "What are the widths available in red tape?";

// Created in this order so later layers sit on top (all share the maximum z-index).
const IDS = {
  spot: "agent-demo-spot",
  ghost: "agent-demo-ghost",
  callout: "agent-demo-callout",
  cursor: "agent-demo-cursor",
  bar: "agent-demo-bar",
};

const MOVE_MS = 800; // cursor and spotlight glide
const PRE_CLICK_MS = 1100; // time to read the callout before a real click happens
const TRY_TIMEOUT_MS = 9000; // try-it mode: click for the visitor if they haven't after this long
const TYPE_CHAR_MS = 55;
const END_HOLD_MS = 9000;

// How long a callout stays up: roughly the time to read it (~4 words a second), within sensible limits.
function readingTime(content: CalloutContent): number {
  const words = `${content.title} ${content.text}`.trim().split(/\s+/).length;
  return Math.min(Math.max(800 + words * 250, 1800), 4200);
}

type Placement = "top" | "bottom" | "left" | "right";

interface CalloutContent {
  icon: IconName;
  title: string;
  text: string;
}

// Shown after a real click: the spotlight grows to the part of the widget that changed.
interface Reveal extends CalloutContent {
  area: "chat" | "screen"; // the chat window, or the whole screen (fullscreen mode)
  placement?: Placement;
  hold?: number; // defaults to reading time
}

// One beat of the demo. Scenes whose target can't be found are skipped.
interface Scene extends CalloutContent {
  target?: () => Element | null;
  placement?: Placement; // preferred side for the callout
  click?: boolean; // ripple when the cursor arrives
  type?: string; // ghost-type this text over the target
  press?: boolean; // really click the target, so the widget reacts
  autoPress?: boolean; // in the Tour too, click it for the visitor (simple "go back" steps)
  waitForTarget?: boolean; // target only appears after the previous scene's click
  skip?: () => boolean;
  after?: (signal: AbortSignal) => Promise<void>;
  reveal?: Reveal;
  hold?: number; // ms to stay after this scene; defaults to the time needed to read it
}

const byLabel = (selector: string) => () => queryWidget(selector);

const SCENES: Scene[] = [
  {
    icon: "bot",
    title: "Meet Peacock Assist",
    text: "Your AI tape expert. Here's a quick look at what it can do.",
  },
  {
    icon: "message",
    title: "Open the chat",
    text: "Tap this bubble any time to talk to our assistant.",
    target: findAgentLauncher,
    placement: "left",
    press: true,
    skip: isChatOpen,
    after: async (signal) => {
      await openChat();
      throwIfAborted(signal);
    },
    reveal: {
      icon: "bot",
      title: "Here's your assistant",
      text: "Everything happens right here in this window.",
      area: "chat",
      placement: "left",
    },
    hold: 0,
  },
  {
    icon: "message",
    title: "Ask your question",
    text: "Widths, printing, prices, delivery — just type it here.",
    target: byLabel(WIDGET_SELECTORS.messageBox),
    placement: "top",
    click: true,
    type: SAMPLE_QUESTION,
    hold: 1600,
  },
  {
    icon: "paperclip",
    title: "Share your logo",
    text: "Attach artwork and get help planning a branded tape.",
    target: byLabel(WIDGET_SELECTORS.attach),
    placement: "top",
  },
  {
    icon: "mic",
    title: "Send a voice note",
    text: "Prefer talking? Record a quick message instead.",
    target: byLabel(WIDGET_SELECTORS.voiceNote),
    placement: "top",
  },
  {
    icon: "wave",
    title: "Talk live",
    text: "Start a voice conversation with the agent.",
    target: byLabel(WIDGET_SELECTORS.voiceMode),
    placement: "top",
  },
  {
    icon: "send",
    title: "Hit send",
    text: "Answers arrive in seconds.",
    target: byLabel(WIDGET_SELECTORS.send),
    placement: "top",
    click: true,
  },
  {
    icon: "plus",
    title: "Start a new chat",
    text: "Begin fresh whenever you switch topics.",
    target: byLabel(WIDGET_SELECTORS.newChat),
    placement: "bottom",
    press: true,
    reveal: {
      icon: "message",
      title: "A fresh chat",
      text: "A clean conversation, ready for your next question.",
      area: "chat",
      placement: "left",
    },
    hold: 0,
  },
  {
    icon: "history",
    title: "Open your history",
    text: "Every earlier conversation is saved here.",
    target: byLabel(WIDGET_SELECTORS.history),
    placement: "bottom",
    press: true,
    reveal: {
      icon: "history",
      title: "All your past chats",
      text: "Tap any one to pick up right where you left off.",
      area: "chat",
      placement: "left",
    },
    hold: 0,
  },
  {
    icon: "close",
    title: "Back to the chat",
    text: "Close history to return to your conversation.",
    target: byLabel(WIDGET_SELECTORS.closeHistory),
    autoPress: true,
    placement: "bottom",
    waitForTarget: true,
    press: true,
    hold: 1400,
  },
  {
    icon: "expand",
    title: "Go fullscreen",
    text: "Expand the chat for a bigger view.",
    target: byLabel(WIDGET_SELECTORS.fullscreen),
    placement: "bottom",
    press: true,
    reveal: {
      icon: "expand",
      title: "A bigger view",
      text: "Great for longer conversations and comparing options.",
      area: "screen",
      placement: "top",
    },
    hold: 0,
  },
  {
    icon: "shrink",
    title: "Shrink it back",
    text: "Return to the compact chat whenever you like.",
    target: byLabel(WIDGET_SELECTORS.exitFullscreen),
    autoPress: true,
    placement: "bottom",
    waitForTarget: true,
    press: true,
    reveal: {
      icon: "shrink",
      title: "Compact again",
      text: "The chat stays out of your way while you browse.",
      area: "chat",
      placement: "left",
    },
    hold: 0,
  },
];

const FINALE: CalloutContent = {
  icon: "hand",
  title: "Your turn! 👋",
  text: "Ask your first question — we're here to help.",
};

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function abortError() {
  return new DOMException("Demo stopped", "AbortError");
}

function throwIfAborted(signal: AbortSignal) {
  if (signal.aborted) throw abortError();
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(abortError());
    const timer = setTimeout(resolve, ms);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(abortError());
      },
      { once: true },
    );
  });
}

function el(id: string, html = "", before?: Element | null): HTMLDivElement {
  document.getElementById(id)?.remove();
  const node = document.createElement("div");
  node.id = id;
  node.innerHTML = html;
  if (before?.parentNode === document.body) document.body.insertBefore(node, before);
  else document.body.appendChild(node);
  return node;
}

// Waits briefly for a target that appears after an earlier click (e.g. the history panel's close button).
async function resolveTarget(find: () => Element | null, signal: AbortSignal, timeoutMs: number) {
  const started = Date.now();
  for (;;) {
    const found = find();
    if (found || Date.now() - started > timeoutMs) return found;
    await sleep(150, signal);
  }
}

// Waits until an element stops moving, so positions are measured after the widget's own animation.
async function settle(find: () => Element | null, signal: AbortSignal, timeoutMs = 1500) {
  const started = Date.now();
  let last = "";
  await sleep(120, signal);
  while (Date.now() - started < timeoutMs) {
    const r = find()?.getBoundingClientRect();
    const key = r ? `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}` : "none";
    if (key === last) return;
    last = key;
    await sleep(120, signal);
  }
}

// If the demo stops midway, close the history panel and leave fullscreen so the widget looks normal.
function restoreWidget() {
  (queryWidget(WIDGET_SELECTORS.closeHistory) as HTMLElement | null)?.click();
  (queryWidget(WIDGET_SELECTORS.exitFullscreen) as HTMLElement | null)?.click();
}

/* ---------- Spotlight: dims everything except the target ---------- */

// target: a single control · area: a whole panel · clear: no dimming at all · dim: everything dimmed
type SpotMode = "target" | "area" | "clear" | "dim";

const screenRect = () => new DOMRect(0, 0, window.innerWidth, window.innerHeight);

function moveSpot(spot: HTMLElement, rect: DOMRect | null, mode: SpotMode) {
  spot.classList.toggle("has-target", mode === "target");
  spot.classList.toggle("is-area", mode === "area");
  spot.classList.toggle("is-clear", mode === "clear");

  if (mode === "clear") {
    // The hole opens up to the whole screen, then the dim fades away.
    Object.assign(spot.style, { left: "0px", top: "0px", width: "100vw", height: "100vh", borderRadius: "0px" });
    return;
  }
  if (!rect || mode === "dim") {
    // Zero-size hole in the middle: the whole screen is dimmed.
    Object.assign(spot.style, {
      left: `${window.innerWidth / 2}px`,
      top: `${window.innerHeight / 2}px`,
      width: "0px",
      height: "0px",
      borderRadius: "9999px",
    });
    return;
  }
  const pad = mode === "area" ? 6 : 8;
  const round = mode === "target" && rect.width < 72 && Math.abs(rect.width - rect.height) < 10;
  Object.assign(spot.style, {
    left: `${rect.left - pad}px`,
    top: `${rect.top - pad}px`,
    width: `${rect.width + pad * 2}px`,
    height: `${rect.height + pad * 2}px`,
    borderRadius: round ? "9999px" : mode === "area" ? "22px" : "16px",
  });
}

/* ---------- Callout: speech bubble placed beside the target ---------- */

const PAUSE_SVG = svg('<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>', 12);
const PLAY_SVG = svg('<path d="M7 4.5v15l12-7.5z"/>', 12);

function buildCallout(onStartChat: () => void) {
  const callout = el(
    IDS.callout,
    `<span class="ac-arrow" aria-hidden="true"></span>
     <button type="button" class="ac-pause" aria-label="Pause demo"></button>
     <span class="ac-icon" aria-hidden="true"></span>
     <div class="ac-body" aria-live="polite">
       <div class="ac-title"></div>
       <div class="ac-text"></div>
       <div class="ac-tip">Tap this card or press Next › to go faster</div>
       <div class="ac-try">
         <span class="ac-hint">👆 Your turn — click the glowing button</span>
         <button type="button" class="ac-showme">Show me ${ARROW_RIGHT}</button>
       </div>
       <div class="ac-actions">
         <button type="button" class="ac-start">Start chatting ${ARROW_RIGHT}</button>
       </div>
     </div>`,
  );
  callout.querySelector<HTMLButtonElement>(".ac-start")!.addEventListener("click", onStartChat);
  return callout;
}

function fillCallout(callout: HTMLElement, content: CalloutContent) {
  callout.querySelector(".ac-icon")!.innerHTML = svg(ICONS[content.icon], 20);
  callout.querySelector(".ac-title")!.textContent = content.title;
  callout.querySelector(".ac-text")!.textContent = content.text;
}

function placeCallout(callout: HTMLElement, rect: DOMRect | null, preferred?: Placement) {
  const gap = 18;
  const margin = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = callout.offsetWidth;
  const h = callout.offsetHeight;

  if (!rect) {
    // Centred on screen, or pinned near the top when asked (e.g. over the fullscreen chat).
    callout.dataset.side = "none";
    const y = preferred === "top" ? margin + 12 : (vh - h) / 2;
    callout.style.transform = `translate(${(vw - w) / 2}px, ${y}px)`;
    return;
  }

  const fits: Record<Placement, boolean> = {
    top: rect.top - gap - h >= margin,
    bottom: rect.bottom + gap + h <= vh - margin,
    left: rect.left - gap - w >= margin,
    right: rect.right + gap + w <= vw - margin,
  };
  const order: Placement[] = [preferred ?? "top", "top", "bottom", "left", "right"];
  const side = order.find((s) => fits[s]) ?? "top";

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let x: number;
  let y: number;
  if (side === "top" || side === "bottom") {
    x = cx - w / 2;
    y = side === "top" ? rect.top - gap - h : rect.bottom + gap;
  } else {
    x = side === "left" ? rect.left - gap - w : rect.right + gap;
    y = cy - h / 2;
  }
  x = Math.min(Math.max(x, margin), vw - w - margin);
  y = Math.min(Math.max(y, margin), vh - h - margin);

  // Point the arrow at the target's centre, even when the bubble was nudged to stay on screen.
  const arrow =
    side === "top" || side === "bottom"
      ? Math.min(Math.max(cx - x, 22), w - 22)
      : Math.min(Math.max(cy - y, 22), h - 22);

  callout.dataset.side = side;
  callout.style.setProperty("--arrow", `${arrow}px`);
  callout.style.transform = `translate(${x}px, ${y}px)`;
}

/* ---------- Control bar: progress + skip ---------- */

function buildBar(onNext: () => void, onSkip: () => void) {
  const bar = el(
    IDS.bar,
    `<span class="ab-dot" aria-hidden="true"></span>
     <span class="ab-track" aria-hidden="true"><span></span></span>
     <button type="button" class="ab-next" aria-label="Next step">Next <span aria-hidden="true">›</span></button>
     <button type="button" class="ab-skip" aria-label="Skip demo">Skip <span aria-hidden="true">✕</span></button>`,
  );
  bar.querySelector<HTMLButtonElement>(".ab-next")!.addEventListener("click", onNext);
  bar.querySelector<HTMLButtonElement>(".ab-skip")!.addEventListener("click", onSkip);
  return bar;
}

function setProgress(bar: HTMLElement, done: number, total: number) {
  bar.querySelector<HTMLElement>(".ab-track span")!.style.width = `${Math.round((done / total) * 100)}%`;
}

/* ---------- Cursor and typing ---------- */

const CURSOR_SVG = `<svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
  <path d="M5 3l14 7.5-6.2 1.6L9.5 18z" fill="#0d382c" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>
</svg>`;

function moveCursor(cursor: HTMLElement, rect: DOMRect) {
  cursor.style.transform = `translate(${rect.left + rect.width / 2}px, ${rect.top + rect.height / 2}px)`;
}

function ripple(cursor: HTMLElement) {
  if (prefersReducedMotion()) return;
  cursor.classList.remove("is-clicking");
  void cursor.offsetWidth;
  cursor.classList.add("is-clicking");
}

// Draws fake text over the message box so the demo never touches the real input.
async function ghostType(
  target: Element,
  text: string,
  before: Element,
  wait: (ms: number) => Promise<void>, // pausable delay between letters
  finishNow: () => boolean, // true when the visitor skipped ahead: show the full text at once
) {
  const r = target.getBoundingClientRect();
  const style = getComputedStyle(target);
  const transparent = "rgba(0, 0, 0, 0)";
  const ghost = el(IDS.ghost, "", before);
  Object.assign(ghost.style, {
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    padding: style.padding,
    font: style.font,
    color: style.color === transparent ? "#1f2937" : style.color,
    background: style.backgroundColor === transparent ? "#ffffff" : style.backgroundColor,
    borderRadius: style.borderRadius,
  });

  if (prefersReducedMotion()) {
    ghost.textContent = text;
    return;
  }
  for (let i = 1; i <= text.length; i++) {
    if (finishNow()) {
      ghost.textContent = text;
      return;
    }
    ghost.textContent = text.slice(0, i);
    await wait(TYPE_CHAR_MS);
  }
}

/* ---------- Player ---------- */

/**
 * Checks if the page was opened with ?tour=demo in the URL.
 * If present:
 * 1. Silently cleans the URL bar immediately without reload.
 * 2. Waits until the async Perfox chat widget has loaded into the DOM.
 * 3. Starts the tour automatically.
 */
export async function checkAutoStartTour() {
  if (typeof window === "undefined") return;

  const urlParams = new URLSearchParams(window.location.search);
  const tour = urlParams.get("tour");

  if (tour === "demo" || tour === "tour" || tour === "agent" || tour === "1") {
    // 1. Remove the marker right away without reloading or breaking browser history
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("tour");
    const newPath = cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : "") + cleanUrl.hash;
    window.history.replaceState({}, document.title, newPath);

    // 2. Wait for the Perfox widget launcher bubble to mount in the DOM (up to 8s)
    await waitForWidgetLauncher(8000).catch(() => null);

    // 3. Brief settle delay for entrance animation, then start the tour
    setTimeout(() => {
      startAgentGuide();
    }, 400);
  }
}

// "Watch demo": everything plays by itself.
export function startAgentDemo() {
  return runDemo(false);
}

// "Tour": the same walkthrough, but the visitor clicks the safe buttons themselves.
export function startAgentGuide() {
  return runDemo(true);
}

async function runDemo(interactive: boolean) {
  if (!claimGuide()) return;

  const controller = new AbortController();
  const { signal } = controller;
  const stop = () => controller.abort();
  let handOver = false;

  const spot = el(IDS.spot);
  const callout = buildCallout(() => {
    handOver = true;
    stop();
  });
  const cursor = el(IDS.cursor, `${CURSOR_SVG}<span class="ad-ripple"></span>`);

  // Fast readers can jump ahead (Next, the → key, or tapping the callout). Whatever the demo is
  // currently waiting on — reading time, typing, or the visitor's click — registers how to cut it short.
  let skipAhead: (() => void) | null = null;
  const advance = () => skipAhead?.();

  // Pausing: the ⏸ button on the card, or the visitor switching to another tab. Every timed wait
  // uses pausableTimer, so it freezes while paused and later continues with the time it had left.
  let userPaused = false;
  let paused = false;
  const pauseListeners = new Set<(paused: boolean) => void>();
  const pauseButton = callout.querySelector<HTMLButtonElement>(".ac-pause")!;
  const updatePauseButton = () => {
    pauseButton.innerHTML = paused ? PLAY_SVG : PAUSE_SVG;
    pauseButton.setAttribute("aria-label", paused ? "Resume demo" : "Pause demo");
    pauseButton.setAttribute("aria-pressed", String(paused));
  };
  const syncPause = () => {
    const next = userPaused || document.hidden;
    if (next === paused) return;
    paused = next;
    callout.classList.toggle("is-paused", paused);
    spot.classList.toggle("is-paused", paused);
    updatePauseButton();
    for (const listener of [...pauseListeners]) listener(paused);
  };
  pauseButton.addEventListener("click", (e) => {
    e.stopPropagation(); // pausing must never count as "tap the card to continue"
    userPaused = !userPaused;
    syncPause();
  });
  document.addEventListener("visibilitychange", syncPause);
  updatePauseButton();

  // Calls onDone after ms of un-paused time. Returns a cancel function.
  const pausableTimer = (ms: number, onDone: () => void) => {
    let remaining = ms;
    let startedAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () => {
      startedAt = Date.now();
      timer = setTimeout(() => {
        pauseListeners.delete(onPauseChange);
        onDone();
      }, remaining);
    };
    const onPauseChange = (nowPaused: boolean) => {
      if (nowPaused) {
        clearTimeout(timer);
        remaining -= Date.now() - startedAt;
      } else {
        run();
      }
    };
    pauseListeners.add(onPauseChange);
    if (!paused) run();
    return () => {
      clearTimeout(timer);
      pauseListeners.delete(onPauseChange);
    };
  };

  const pausableSleep = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      if (signal.aborted) return reject(abortError());
      const onAbort = () => {
        cancel();
        reject(abortError());
      };
      const cancel = pausableTimer(ms, () => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      });
      signal.addEventListener("abort", onAbort, { once: true });
    });

  const bar = buildBar(advance, stop);

  cursor.style.transform = `translate(${window.innerWidth / 2}px, ${window.innerHeight * 0.65}px)`;
  if (prefersReducedMotion()) cursor.style.display = "none";
  requestAnimationFrame(() => {
    spot.classList.add("is-visible");
    bar.classList.add("is-visible");
  });

  // What the spotlight and callout are currently attached to. Re-measured on resize.
  interface Focus {
    rect: () => DOMRect | null;
    mode: SpotMode;
    placement?: Placement;
  }
  let focus: Focus = { rect: () => null, mode: "dim" };
  const applySpot = () => moveSpot(spot, focus.rect(), focus.mode);
  const applyCallout = () => placeCallout(callout, focus.mode === "clear" ? null : focus.rect(), focus.placement);
  const focusOn = (next: Focus) => {
    focus = next;
    applySpot();
  };
  const relayout = () => {
    applySpot();
    applyCallout();
  };
  window.addEventListener("resize", relayout);
  focusOn(focus);

  // The button the visitor is asked to click (try-it mode only).
  let waitingFor: Element | null = null;
  // At the final card, any outside click closes the demo (in both modes).
  let atFinale = false;

  // Draws attention back to the glowing button when the visitor clicks somewhere else.
  const nudge = () => {
    spot.classList.remove("is-nudge");
    void spot.offsetWidth;
    spot.classList.add("is-nudge");
  };

  // Auto-play: any click outside the demo's own controls stops it.
  // Try-it: the visitor is meant to click, so stray clicks only nudge. Skip and Esc still stop it.
  const onPointerDown = (e: PointerEvent) => {
    const t = e.target as Node;
    if (bar.contains(t) || callout.contains(t)) return;
    if (!interactive || atFinale) return stop();
    if (!(waitingFor && e.composedPath().includes(waitingFor))) nudge();
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") stop();
    if (e.key === "ArrowRight") {
      e.preventDefault();
      advance();
    }
  };
  document.addEventListener("pointerdown", onPointerDown, true);
  document.addEventListener("keydown", onKeyDown, true);

  // Tapping the callout itself (not one of its buttons) also moves on. Uses the event path recorded
  // at click time, because a button may have re-rendered (e.g. ⏸ → ▶) before the click gets here.
  callout.addEventListener("click", (e) => {
    if (!e.composedPath().some((node) => node instanceof HTMLButtonElement)) advance();
  });

  // A reading pause: the visitor can cut it short (Next) or freeze it (⏸).
  const readWait = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      if (signal.aborted) return reject(abortError());
      const done = () => {
        cancel();
        signal.removeEventListener("abort", onAbort);
        if (skipAhead === done) skipAhead = null;
        resolve();
      };
      const onAbort = () => {
        cancel();
        if (skipAhead === done) skipAhead = null;
        reject(abortError());
      };
      const cancel = pausableTimer(ms, done);
      skipAhead = done;
      signal.addEventListener("abort", onAbort, { once: true });
    });

  // Typing the sample question; skipping shows the full text at once.
  const typeInto = async (target: Element, text: string) => {
    let finished = false;
    skipAhead = () => {
      finished = true;
    };
    try {
      await ghostType(target, text, callout, pausableSleep, () => finished);
    } finally {
      skipAhead = null;
    }
  };

  const showCallout = (content: CalloutContent) => {
    fillCallout(callout, content);
    applyCallout();
    callout.classList.add("is-visible");
  };
  const hideCallout = () => callout.classList.remove("is-visible");
  // Not pausable: the card is hidden while gliding, so a pause here would leave no ▶ to press.
  // The glide finishes, the next card appears, and the pause holds its reading time instead.
  const glide = () => sleep(prefersReducedMotion() ? 0 : MOVE_MS, signal);

  // Try-it mode: wait for the visitor to click the real button, press "Show me", or run out of time.
  const waitForVisitor = (target: Element) =>
    new Promise<"visitor" | "showme" | "timeout">((resolve, reject) => {
      const showMe = callout.querySelector<HTMLButtonElement>(".ac-showme")!;
      const finish = (how: "visitor" | "showme" | "timeout") => {
        cleanup();
        resolve(how);
      };
      // Clicks inside the widget come from its shadow DOM, so match on the full event path.
      const onClick = (e: MouseEvent) => {
        if (e.composedPath().includes(target)) finish("visitor");
      };
      const onShowMe = () => finish("showme");
      const onAbort = () => {
        cleanup();
        reject(abortError());
      };
      const cancelTimer = pausableTimer(TRY_TIMEOUT_MS, () => finish("timeout"));
      function cleanup() {
        cancelTimer();
        document.removeEventListener("click", onClick, true);
        showMe.removeEventListener("click", onShowMe);
        signal.removeEventListener("abort", onAbort);
        callout.classList.remove("is-waiting");
        waitingFor = null;
        if (skipAhead === onShowMe) skipAhead = null;
      }

      if (signal.aborted) return reject(abortError());
      waitingFor = target;
      skipAhead = onShowMe; // Next on a try-it step means "show me"
      callout.classList.add("is-waiting");
      applyCallout(); // the hint makes the callout taller
      document.addEventListener("click", onClick, true);
      showMe.addEventListener("click", onShowMe);
      signal.addEventListener("abort", onAbort, { once: true });
    });

  // After a real click: wait for the widget to finish animating, then grow the spotlight to show the result.
  const showReveal = async (reveal: Reveal) => {
    hideCallout();
    cursor.classList.remove("is-visible");
    if (reveal.area === "screen") {
      await settle(byLabel(WIDGET_SELECTORS.exitFullscreen), signal);
      focusOn({ rect: screenRect, mode: "clear", placement: reveal.placement });
    } else {
      await settle(findChatWindow, signal);
      const found = findChatWindow() !== null;
      focusOn({
        rect: () => findChatWindow()?.getBoundingClientRect() ?? null,
        mode: found ? "area" : "dim",
        placement: reveal.placement,
      });
    }
    await glide();
    showCallout(reveal);
    await readWait(reveal.hold ?? readingTime(reveal));
  };

  try {
    const playable = SCENES.filter((s) => !s.skip?.());
    // Count only scenes that can play: no target, a target that appears later, or one on screen now.
    const countRemaining = (from: number) =>
      playable.slice(from).filter((s) => !s.target || s.waitForTarget || s.target() !== null).length;
    let total = countRemaining(0);
    let shown = 0;

    for (const [index, scene] of playable.entries()) {
      // The typed text belongs to the message-box scene only.
      document.getElementById(IDS.ghost)?.remove();

      const target = scene.target ? await resolveTarget(scene.target, signal, scene.waitForTarget ? 2000 : 0) : null;
      if (scene.target && !target) continue;
      shown++;
      total = shown - 1 + countRemaining(index);
      setProgress(bar, shown - 1, total);

      // 1. Glide the spotlight and cursor to the target while the old callout fades out.
      hideCallout();
      const rect = target?.getBoundingClientRect() ?? null;
      focusOn({
        rect: () => target?.getBoundingClientRect() ?? null,
        mode: target ? "target" : "dim",
        placement: scene.placement,
      });
      if (rect) {
        cursor.classList.add("is-visible");
        moveCursor(cursor, rect);
      }
      await glide();

      // 2. Explain it right beside the target. The first callout also says how to go faster.
      callout.classList.toggle("show-tip", shown === 1);
      showCallout(scene);
      if (target && scene.click) ripple(cursor);
      if (target && scene.type) await typeInto(target, scene.type);

      // 3. Real click. Auto-play does it after a short pause; try-it mode lets the visitor do it.
      if (target && scene.press) {
        const visitorTurn = interactive && !scene.autoPress;
        let visitorClicked = false;
        if (visitorTurn) {
          cursor.classList.remove("is-visible"); // step aside so it's clear the visitor should click
          visitorClicked = (await waitForVisitor(target)) === "visitor";
        }

        if (!visitorClicked) {
          if (visitorTurn) {
            cursor.classList.add("is-visible");
            moveCursor(cursor, target.getBoundingClientRect());
            await glide();
          } else if (interactive) {
            // Tour "go back" steps: a short pause, then the demo clicks.
            await readWait(PRE_CLICK_MS);
          } else {
            // Long enough to read what is about to happen.
            await readWait(Math.max(PRE_CLICK_MS, readingTime(scene) - 800));
          }
          ripple(cursor);
          await sleep(180, signal);
          (target as HTMLElement).click();
        }
      }

      await scene.after?.(signal);
      if (scene.reveal) await showReveal(scene.reveal);
      await readWait(scene.hold ?? readingTime(scene));
    }

    // Finale: point at the message box and hand over to the visitor.
    // The progress bar and Skip are no longer needed; the card has its own way out.
    bar.classList.remove("is-visible");
    hideCallout();
    document.getElementById(IDS.ghost)?.remove();
    cursor.classList.remove("is-visible");
    await settle(byLabel(WIDGET_SELECTORS.messageBox), signal);
    const input = queryWidget(WIDGET_SELECTORS.messageBox);
    focusOn({
      rect: () => input?.getBoundingClientRect() ?? null,
      mode: input ? "target" : "dim",
      placement: "top",
    });
    await glide();
    atFinale = true;
    callout.classList.add("is-finished");
    showCallout(FINALE);
    await pausableSleep(END_HOLD_MS);
    handOver = true;
  } catch (err) {
    if (!(err instanceof DOMException && err.name === "AbortError")) console.error("[agent-demo]", err);
  } finally {
    window.removeEventListener("resize", relayout);
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("keydown", onKeyDown, true);
    document.removeEventListener("visibilitychange", syncPause);
    for (const id of Object.values(IDS)) document.getElementById(id)?.remove();
    restoreWidget();
    releaseGuide();

    // Leave the visitor in the chat, ready to type.
    if (handOver) {
      if (!isChatOpen()) await openChat();
      focusMessageBox();
    }
  }
}
