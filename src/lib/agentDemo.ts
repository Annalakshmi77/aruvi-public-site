import {
  WIDGET_SELECTORS,
  claimGuide,
  closeChat,
  countAgentReplies,
  fillMessageBox,
  findAgentLauncher,
  findChatWindow,
  findCommonParent,
  focusMessageBox,
  isChatOpen,
  isVisible,
  isWidgetEvent,
  openChat,
  queryWidget,
  releaseGuide,
  waitForReply,
  waitForWidgetLauncher,
} from "@/lib/agentWidget";
import { svg } from "@/lib/agentIcons";

// Created in this order so later layers sit on top (all share the maximum z-index).
const IDS = {
  spot: "agent-demo-spot",
  ghost: "agent-demo-ghost",
  callout: "agent-demo-callout",
  cursor: "agent-demo-cursor",
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
  before?: (signal: AbortSignal) => Promise<void>; // set the page up first, e.g. scroll to a section
  after?: (signal: AbortSignal) => Promise<void>;
  reveal?: Reveal;
  hold?: number; // ms to stay after this scene; defaults to the time needed to read it
}

const byLabel = (selector: string) => () => queryWidget(selector);

// One real question to the agent, kept per run so Back never sends a question twice.
interface Exchange {
  sent: boolean;
  repliesBefore: number;
  reply: Element | null;
}

const newExchange = (): Exchange => ({ sent: false, repliesBefore: 0, reply: null });
const exchanges = [newExchange(), newExchange()];

interface AskScript {
  question: string;
  ask: CalloutContent;
  answer: CalloutContent;
  proof: CalloutContent & { find: () => Element | null };
  back: CalloutContent;
}

// Ask → send → wait for the reply → show it → show the same facts on the page → back to the chat.
function askAndProve(ex: Exchange, script: AskScript): Scene[] {
  return [
    {
      ...script.ask,
      target: byLabel(WIDGET_SELECTORS.messageBox),
      placement: "top",
      click: true,
      type: script.question,
      skip: () => ex.sent,
      after: async () => {
        ex.repliesBefore = countAgentReplies();
        fillMessageBox(script.question);
      },
      hold: 1200,
    },
    {
      title: "Send it",
      text: "The question goes to the assistant, for real.",
      target: byLabel(WIDGET_SELECTORS.send),
      placement: "top",
      press: true,
      skip: () => ex.sent,
      after: async () => {
        ex.sent = true;
      },
      hold: 0,
    },
    {
      title: "Finding the answer",
      text: "It understands the question and looks it up in the site's product information.",
      target: findChatWindow,
      placement: "left",
      skip: () => ex.reply !== null,
      after: async (signal) => {
        ex.reply = await waitForReply(ex.repliesBefore, signal);
      },
      hold: 0,
    },
    {
      ...script.answer,
      target: () => (isVisible(ex.reply) ? ex.reply : null),
      placement: "left",
    },
    {
      title: script.proof.title,
      text: script.proof.text,
      before: async (signal) => {
        await closeChat();
        script.proof.find()?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
        await settle(script.proof.find, signal, 2000);
      },
      target: script.proof.find,
      placement: "bottom",
      hold: 4800,
    },
    {
      ...script.back,
      before: async (signal) => {
        await openChat();
        throwIfAborted(signal);
      },
      target: findChatWindow,
      placement: "left",
    },
  ];
}

const findWidthsList = () => document.querySelector('[data-tour="widths-list"]');
const findCustomJobs = () => document.querySelector('[data-tour="custom-jobs"]');

const SCENES: Scene[] = [
  {
    title: "Meet Peacock Assist",
    text: "An AI assistant that answers from this website's own content: products, widths, colours, printing and prices.",
  },
  {
    title: "Open the chat",
    text: "Tap this bubble any time, on any page, to ask the assistant.",
    target: findAgentLauncher,
    placement: "left",
    press: true,
    skip: isChatOpen,
    after: async (signal) => {
      await openChat();
      throwIfAborted(signal);
    },
    reveal: {
      title: "Here's your assistant",
      text: "Ask in plain words, the way you'd ask a salesperson.",
      area: "chat",
      placement: "left",
    },
    hold: 0,
  },
  ...askAndProve(exchanges[0], {
    question: "What are the widths available?",
    ask: { title: "Ask a question", text: "No menus or keywords. Just type what you want to know." },
    answer: { title: "Here's the answer", text: "Every width we offer, answered in seconds." },
    proof: {
      title: "It's right here on the site",
      text: "The same widths the assistant just gave, straight from this page. It answers from the site's own content.",
      find: findWidthsList,
    },
    back: { title: "Now something more specific", text: "Let's ask about a custom printed tape." },
  }),
  ...askAndProve(exchanges[1], {
    question: "6 inch multicolor printed tape - special colors",
    ask: { title: "A detailed question", text: "Size, printing and colour in one go. It understands all three." },
    answer: { title: "Here's the answer", text: "Printing and colour options for that exact tape, in one reply." },
    proof: {
      title: "Also right here on the site",
      text: "Multi-colour printing and the special colours (Pink, Grey, Violet, Green), straight from the pricing section.",
      find: findCustomJobs,
    },
    back: {
      title: "Back to the chat",
      text: "No scrolling or searching. Customers just ask, and the assistant finds it on the site.",
    },
  }),
  {
    title: "Share your logo",
    text: "Attach artwork and get help planning a branded tape.",
    target: byLabel(WIDGET_SELECTORS.attach),
    placement: "top",
  },
  {
    title: "Prefer to talk?",
    text: "Send a voice note, or start a live voice conversation with the assistant.",
    target: () => findCommonParent(queryWidget(WIDGET_SELECTORS.voiceNote), queryWidget(WIDGET_SELECTORS.voiceMode)),
    placement: "top",
  },
  {
    title: "Open your history",
    text: "Every earlier conversation is saved here.",
    target: byLabel(WIDGET_SELECTORS.history),
    placement: "bottom",
    press: true,
    reveal: {
      title: "All your past chats",
      text: "Tap any one to pick up right where you left off.",
      area: "chat",
      placement: "left",
    },
    hold: 0,
  },
  {
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
    title: "New chat & fullscreen",
    text: "Start fresh when you switch topics, or expand the chat for a bigger view.",
    target: () => findCommonParent(queryWidget(WIDGET_SELECTORS.newChat), queryWidget(WIDGET_SELECTORS.fullscreen)),
    placement: "bottom",
  },
];

const FINALE: CalloutContent = {
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
  for (; ;) {
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

/* ---------- Callout: one speech bubble, with the robot mascot beside it ---------- */

const PAUSE_SVG = svg('<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>', 12);
const PLAY_SVG = svg('<path d="M7 4.5v15l12-7.5z"/>', 12);

// Floating robot on a glowing portal, with sparks rising from it. It sits to the left of the card
// (below it on phones), and its bubble tail points at it, so the card reads as the robot talking.
const MASCOT_HTML = `<div class="ac-mascot" aria-hidden="true">
  <div class="ac-portal">
    <svg viewBox="0 0 140 50" class="ac-portal-rings">
      <defs>
        <radialGradient id="ac-portal-disc" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffe6b0" stop-opacity="0.95" />
          <stop offset="35%" stop-color="#ff8a2b" stop-opacity="0.8" />
          <stop offset="70%" stop-color="#ff3d6e" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#ff3d6e" stop-opacity="0" />
        </radialGradient>
        <filter id="ac-portal-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <ellipse cx="70" cy="25" rx="46" ry="13" class="ac-portal-ring" filter="url(#ac-portal-glow)" />
      <ellipse cx="70" cy="25" rx="30" ry="8" fill="url(#ac-portal-disc)" />
      <ellipse cx="70" cy="25" rx="14" ry="4" fill="#ffffff" opacity="0.9" filter="blur(1px)" />
    </svg>
    <div class="ac-portal-beam"></div>
    <span class="ac-spark s1"></span>
    <span class="ac-spark s2"></span>
    <span class="ac-spark s3"></span>
    <span class="ac-spark s4"></span>
    <span class="ac-spark s5"></span>
  </div>
  <div class="ac-mascot-glow"></div>
  <div class="ac-mascot-float">
    <img src="/tour-mascot.png" alt="" class="ac-mascot-img" loading="eager" />
  </div>
</div>`;

// Room the mascot takes up outside the card: to its left on wide screens, below it on phones.
const MASCOT_LEFT = 146;
const MASCOT_BELOW = 128;
const isNarrow = () => window.innerWidth <= 640;

// One card: copy on top, Back / Next along its bottom edge.
// On a try-it step, "Show me" takes Next's place so the button says what it will do.
function buildCallout(onStartChat: () => void, onBack: () => void, onNext: () => void, onClose: () => void) {
  const callout = el(
    IDS.callout,
    `<div class="ac-bubble">
       <span class="ac-tail" aria-hidden="true"></span>
       <button type="button" class="ac-pause" aria-label="Pause demo"></button>
       <button type="button" class="ac-close" aria-label="Close tour">&times;</button>
       <div class="ac-copy" aria-live="polite">
         <div class="ac-title">
           <span class="ac-sparkle" aria-hidden="true">✨</span>
           <span class="ac-heading"></span>
         </div>
         <div class="ac-text"></div>
       </div>
       <div class="ac-try">
         <span class="ac-hint">
           <span class="ac-hint-dot" aria-hidden="true"></span>
           <strong>Your turn</strong>
           <span class="ac-hint-text">Click the glowing button</span>
         </span>
       </div>
       <div class="ac-nav">
         <button type="button" class="ac-prev">← Back</button>
         <button type="button" class="ac-showme">Show me →</button>
         <button type="button" class="ac-next">Next →</button>
         <button type="button" class="ac-start">Start Chatting ✨</button>
       </div>
     </div>
     ${MASCOT_HTML}`,
  );
  callout.querySelector<HTMLButtonElement>(".ac-start")!.addEventListener("click", onStartChat);
  callout.querySelector<HTMLButtonElement>(".ac-prev")!.addEventListener("click", onBack);
  callout.querySelector<HTMLButtonElement>(".ac-next")!.addEventListener("click", onNext);
  callout.querySelector<HTMLButtonElement>(".ac-close")!.addEventListener("click", onClose);
  return callout;
}

function fillCallout(callout: HTMLElement, content: CalloutContent) {
  callout.querySelector(".ac-heading")!.textContent = content.title;
  callout.querySelector(".ac-text")!.textContent = content.text;
}

// Places the card beside the target. The mascot hangs outside the card, so it counts as part of
// the card's footprint: the card never covers the target and the mascot never leaves the screen.
function placeCallout(callout: HTMLElement, rect: DOMRect | null, preferred?: Placement) {
  const gap = 18;
  const margin = 16;
  // The visible area without the page scrollbar, so the card never slides under it.
  const vw = document.documentElement.clientWidth || window.innerWidth;
  const vh = document.documentElement.clientHeight || window.innerHeight;
  const w = callout.offsetWidth;
  const h = callout.offsetHeight;
  const extraLeft = isNarrow() ? 0 : MASCOT_LEFT;
  const extraBelow = isNarrow() ? MASCOT_BELOW : 0;
  const clampX = (x: number) => Math.min(Math.max(x, margin + extraLeft), vw - w - margin);
  const clampY = (y: number) => Math.min(Math.max(y, margin), vh - h - extraBelow - margin);

  if (!rect) {
    // Centred on screen, or pinned near the top when asked (e.g. over the fullscreen chat).
    const y = preferred === "top" ? margin + 12 : (vh - h - extraBelow) / 2;
    callout.style.transform = `translate(${clampX((vw - w + extraLeft) / 2)}px, ${clampY(y)}px)`;
    return;
  }

  const fits: Record<Placement, boolean> = {
    top: rect.top - gap - h - extraBelow >= margin,
    bottom: rect.bottom + gap + h + extraBelow <= vh - margin,
    left: rect.left - gap - w - extraLeft >= margin,
    right: rect.right + gap + extraLeft + w <= vw - margin,
  };
  const order: Placement[] = [preferred ?? "top", "top", "bottom", "left", "right"];
  const side = order.find((s) => fits[s]) ?? "top";

  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let x: number;
  let y: number;
  if (side === "top" || side === "bottom") {
    x = cx - w / 2;
    y = side === "top" ? rect.top - gap - h - extraBelow : rect.bottom + gap;
  } else {
    x = side === "left" ? rect.left - gap - w : rect.right + gap + extraLeft;
    y = cy - h / 2;
  }
  callout.style.transform = `translate(${clampX(x)}px, ${clampY(y)}px)`;
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
  for (const ex of exchanges) Object.assign(ex, newExchange());

  const controller = new AbortController();
  const { signal } = controller;
  const stop = () => controller.abort();
  let handOver = false;

  // Each step gets its own signal, so Back can cut a step short without ending the demo.
  // Stopping the demo aborts whichever step is running.
  let step = new AbortController();
  let stepSignal = step.signal;
  const newStep = () => {
    step = new AbortController();
    stepSignal = step.signal;
    if (signal.aborted) step.abort();
  };
  signal.addEventListener("abort", () => step.abort(), { once: true });

  // Fast readers can jump ahead (Next or the → key). Whatever the demo is currently waiting on —
  // reading time, typing, or the visitor's click — registers how to cut it short.
  let skipAhead: (() => void) | null = null;
  const advance = () => skipAhead?.();

  // Back (‹ or the ← key) abandons the current step; the player then picks the card to return to.
  let wantBack = false;
  let scenesDone = false;
  // At the final card, any outside click closes the demo (in both modes).
  let atFinale = false;
  const goBack = () => {
    if (scenesDone || prevButton.disabled || wantBack) return;
    wantBack = true;
    step.abort();
  };

  const spot = el(IDS.spot);
  const callout = buildCallout(
    () => {
      handOver = true;
      stop();
    },
    goBack,
    advance,
    stop,
  );
  const prevButton = callout.querySelector<HTMLButtonElement>(".ac-prev")!;
  // Progress line along the top of the footer. The demo's own "go back" clicks and skipped scenes
  // aren't counted; they keep the progress of the step before them.
  const counted = SCENES.map((s) => !s.autoPress && !s.skip?.());
  const totalSteps = counted.filter(Boolean).length;
  const showStep = (index: number) => {
    const n = Math.max(1, counted.slice(0, index + 1).filter(Boolean).length);
    callout.style.setProperty("--ac-progress", `${Math.round((n / totalSteps) * 100)}%`);
  };
  const cursor = el(IDS.cursor, `${CURSOR_SVG}<span class="ad-ripple"></span>`);

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
  pauseButton.addEventListener("click", () => {
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
      const s = stepSignal;
      if (s.aborted) return reject(abortError());
      const onAbort = () => {
        cancel();
        reject(abortError());
      };
      const cancel = pausableTimer(ms, () => {
        s.removeEventListener("abort", onAbort);
        resolve();
      });
      s.addEventListener("abort", onAbort, { once: true });
    });

  cursor.style.transform = `translate(${window.innerWidth / 2}px, ${window.innerHeight * 0.65}px)`;
  if (prefersReducedMotion()) cursor.style.display = "none";
  requestAnimationFrame(() => spot.classList.add("is-visible"));

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
  // The site-proof step spotlights part of the page, so it has to follow the visitor's scrolling.
  window.addEventListener("scroll", relayout, { passive: true });
  focusOn(focus);

  // The button the visitor is asked to click (try-it mode only).
  let waitingFor: Element | null = null;

  // Draws attention back to the glowing button when the visitor clicks somewhere else.
  const nudge = () => {
    spot.classList.remove("is-nudge");
    void spot.offsetWidth;
    spot.classList.add("is-nudge");
  };

  // Input guard. Listening on window in the capture phase runs before anything inside the widget's
  // shadow DOM, so a blocked click never reaches the widget (e.g. History can't collapse the chat
  // mid-tour). Let through: the demo's own controls, the button a try-it step asks for, the demo's
  // own scripted clicks (not isTrusted), and everything once the final card is up.
  // Auto-play: a click on the page outside the widget still stops the demo, as before.
  const isOwnControl = (path: EventTarget[]) => path.includes(callout);
  const isAllowedTarget = (path: EventTarget[]) => waitingFor !== null && path.includes(waitingFor);
  const onPointerEvent = (e: Event) => {
    if (!e.isTrusted) return;
    const path = e.composedPath();
    if (isOwnControl(path) || isAllowedTarget(path)) return;
    if (atFinale || (!interactive && !isWidgetEvent(e))) {
      if (e.type === "pointerdown") stop();
      return;
    }
    // Touch: stop it reaching the widget but keep native scrolling; the click that follows is blocked anyway.
    if (!e.type.startsWith("touch")) e.preventDefault();
    e.stopImmediatePropagation();
    if (e.type === "pointerdown") nudge();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.type === "keydown") {
      if (e.key === "Escape") return stop();
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        e.stopImmediatePropagation(); // don't move the caret or a slider inside the widget
        if (e.key === "ArrowRight") advance();
        else goBack();
        return;
      }
    }
    // Keyboard inside the widget (Enter / Space on a focused button, typing) is blocked too.
    // Tab still moves focus, and the button a try-it step asks for still works.
    if (atFinale || e.key === "Tab" || !isWidgetEvent(e) || isAllowedTarget(e.composedPath())) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  const POINTER_EVENTS = [
    "pointerdown",
    "pointerup",
    "mousedown",
    "mouseup",
    "click",
    "dblclick",
    "auxclick",
    "contextmenu",
    "touchstart",
    "touchend",
  ];
  const KEY_EVENTS = ["keydown", "keypress", "keyup"];
  for (const type of POINTER_EVENTS) window.addEventListener(type, onPointerEvent, { capture: true, passive: false });
  for (const type of KEY_EVENTS) window.addEventListener(type, onKey as EventListener, true);

  // A reading pause: the visitor can cut it short (Next) or freeze it (⏸).
  const readWait = (ms: number) =>
    new Promise<void>((resolve, reject) => {
      const s = stepSignal;
      if (s.aborted) return reject(abortError());
      const done = () => {
        cancel();
        s.removeEventListener("abort", onAbort);
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
      s.addEventListener("abort", onAbort, { once: true });
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
  const glide = () => sleep(prefersReducedMotion() ? 0 : MOVE_MS, stepSignal);

  // Try-it mode: wait for the visitor to click the real button, press "Show me", or run out of time.
  const waitForVisitor = (target: Element) =>
    new Promise<"visitor" | "showme" | "timeout">((resolve, reject) => {
      const s = stepSignal;
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
        s.removeEventListener("abort", onAbort);
        callout.classList.remove("is-waiting");
        waitingFor = null;
        if (skipAhead === onShowMe) skipAhead = null;
      }

      if (s.aborted) return reject(abortError());
      waitingFor = target;
      skipAhead = onShowMe; // Next (→ key) on a try-it step means "show me"
      callout.classList.add("is-waiting");
      applyCallout(); // the hint makes the callout taller
      document.addEventListener("click", onClick, true);
      showMe.addEventListener("click", onShowMe);
      s.addEventListener("abort", onAbort, { once: true });
    });

  // After a real click: wait for the widget to finish animating, then grow the spotlight to show the result.
  const showReveal = async (reveal: Reveal) => {
    hideCallout();
    cursor.classList.remove("is-visible");
    if (reveal.area === "screen") {
      await settle(byLabel(WIDGET_SELECTORS.exitFullscreen), stepSignal);
      focusOn({ rect: screenRect, mode: "clear", placement: reveal.placement });
    } else {
      await settle(findChatWindow, stepSignal);
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

  // Back lands only on cards worth returning to: not the demo's own "go back" clicks
  // (close history, leave fullscreen), and not scenes that no longer apply (opening an open chat).
  const isLanding = (i: number) => !SCENES[i].autoPress && !SCENES[i].skip?.();
  // Once a scene's real click has happened, its result is on screen; Back then replays that scene.
  let pressed = false;
  const canGoBack = (i: number) => (pressed && isLanding(i)) || SCENES.slice(0, i).some((_, j) => isLanding(j));
  const updateBack = (i: number) => {
    prevButton.disabled = !canGoBack(i);
  };

  // Plays one scene: spotlight, card, optional typing / click, optional reveal, reading time.
  const playScene = async (index: number) => {
    const scene = SCENES[index];
    if (scene.skip?.()) return;

    // The typed text belongs to the message-box scene only.
    document.getElementById(IDS.ghost)?.remove();
    if (scene.before) {
      hideCallout();
      cursor.classList.remove("is-visible");
      await scene.before(stepSignal);
    }

    const target = scene.target ? await resolveTarget(scene.target, stepSignal, scene.waitForTarget ? 2000 : 0) : null;
    if (scene.target && !target) return;
    updateBack(index);
    showStep(index);

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
    } else {
      cursor.classList.remove("is-visible");
    }
    await glide();

    // 2. Explain it right beside the target.
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
        await sleep(180, stepSignal);
        (target as HTMLElement).click();
      }
      pressed = true;
      updateBack(index);
    }

    await scene.after?.(stepSignal);
    if (scene.reveal) await showReveal(scene.reveal);
    await readWait(scene.hold ?? readingTime(scene));
  };

  // Puts the widget back to its plain chat view, then picks the card Back should land on.
  const backTarget = async (from: number) => {
    hideCallout();
    document.getElementById(IDS.ghost)?.remove();
    restoreWidget();
    // The site-proof step closes the chat; every other card needs it open.
    if (!isChatOpen()) await openChat();
    await settle(findChatWindow, signal);
    if (pressed && isLanding(from)) return from;
    for (let j = from - 1; j >= 0; j--) if (isLanding(j)) return j;
    return 0;
  };

  try {
    let index = 0;
    while (index < SCENES.length) {
      newStep();
      pressed = false;
      try {
        await playScene(index);
        index++;
      } catch (err) {
        if (!wantBack || signal.aborted) throw err;
        wantBack = false;
        index = await backTarget(index);
      }
    }

    // Finale: point at the message box and hand over to the visitor.
    newStep();
    scenesDone = true;
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
    callout.style.setProperty("--ac-progress", "100%");
    showCallout(FINALE);
    await pausableSleep(END_HOLD_MS);
    handOver = true;
  } catch (err) {
    if (!(err instanceof DOMException && err.name === "AbortError")) console.error("[agent-demo]", err);
  } finally {
    window.removeEventListener("resize", relayout);
    window.removeEventListener("scroll", relayout);
    for (const type of POINTER_EVENTS) window.removeEventListener(type, onPointerEvent, true);
    for (const type of KEY_EVENTS) window.removeEventListener(type, onKey as EventListener, true);
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
