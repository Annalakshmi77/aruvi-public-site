import { driver, type Alignment, type Config, type DriveStep, type PopoverDOM, type Side } from "driver.js";
import "driver.js/dist/driver.css";
import {
  WIDGET_SELECTORS,
  claimGuide,
  findAgentLauncher,
  focusMessageBox,
  isChatOpen,
  openChat,
  queryWidget,
  releaseGuide,
  removeRing,
  showRing,
} from "@/lib/agentWidget";
import { ARROW_RIGHT, ICONS, svg, type IconName } from "@/lib/agentIcons";

const FALLBACK_ANCHOR_ID = "agent-tour-anchor";


// Invisible box over the usual bottom-right launcher spot, used when the real button can't be reached.
function createFallbackAnchor(): HTMLElement {
  let anchor = document.getElementById(FALLBACK_ANCHOR_ID);
  if (!anchor) {
    anchor = document.createElement("div");
    anchor.id = FALLBACK_ANCHOR_ID;
    Object.assign(anchor.style, {
      position: "fixed",
      right: "20px",
      bottom: "20px",
      width: "64px",
      height: "64px",
      borderRadius: "9999px",
      pointerEvents: "none",
    });
    document.body.appendChild(anchor);
  }
  return anchor;
}

function removeFallbackAnchor() {
  document.getElementById(FALLBACK_ANCHOR_ID)?.remove();
}

// Puts the icon badge beside the title and adds the progress bar as a popover renders.
function decorate(icon: IconName, progress: number) {
  return (popover: PopoverDOM) => {
    const head = document.createElement("div");
    head.className = "pt-head";
    head.innerHTML = `<span class="pt-icon">${svg(ICONS[icon], 16)}</span>`;
    popover.wrapper.insertBefore(head, popover.title);
    head.appendChild(popover.title);

    const bar = document.createElement("div");
    bar.className = "pt-bar";
    bar.innerHTML = `<span style="--pt-progress:${Math.round(progress * 100)}%"></span>`;
    popover.wrapper.insertBefore(bar, popover.wrapper.firstChild);
  };
}

interface ChatStep {
  selector: string;
  icon: IconName;
  title: string;
  description: string;
  side: Side;
  align: Alignment;
}

// Controls inside the open chat window, matched by the widget's own aria-labels.
const CHAT_STEPS: ChatStep[] = [
  {
    selector: WIDGET_SELECTORS.messageBox,
    icon: "message",
    title: "Type your question",
    description: "Ask anything — tape types, widths, custom printing, pricing or delivery times.",
    side: "top",
    align: "center",
  },
  {
    selector: WIDGET_SELECTORS.attach,
    icon: "paperclip",
    title: "Share your logo or artwork",
    description: "Attach a logo or design file and the assistant can help you plan a branded tape.",
    side: "top",
    align: "start",
  },
  {
    selector: WIDGET_SELECTORS.voiceNote,
    icon: "mic",
    title: "Send a voice note",
    description: "Prefer talking? Record a quick voice message instead of typing.",
    side: "top",
    align: "center",
  },
  {
    selector: WIDGET_SELECTORS.voiceMode,
    icon: "wave",
    title: "Talk live with the agent",
    description: "Start a voice conversation and get answers spoken back to you.",
    side: "top",
    align: "center",
  },
  {
    selector: WIDGET_SELECTORS.send,
    icon: "send",
    title: "Send your message",
    description: "Hit send (or press Enter) and the assistant replies right away.",
    side: "top",
    align: "end",
  },
  {
    selector: WIDGET_SELECTORS.newChat,
    icon: "plus",
    title: "Start a new chat",
    description: "Begin a fresh conversation whenever you switch topics.",
    side: "bottom",
    align: "center",
  },
  {
    selector: WIDGET_SELECTORS.history,
    icon: "history",
    title: "Your past chats",
    description: "Come back to earlier conversations and quotes at any time.",
    side: "bottom",
    align: "center",
  },
  {
    selector: WIDGET_SELECTORS.fullscreen,
    icon: "expand",
    title: "Go fullscreen",
    description: "Expand the chat for a bigger view.",
    side: "bottom",
    align: "end",
  },
];

function buildChatSteps(): DriveStep[] {
  const found = CHAT_STEPS.map((step) => ({ step, element: queryWidget(step.selector) })).filter(
    (s): s is { step: ChatStep; element: Element } => s.element !== null,
  );

  return found.map(({ step, element }, i) => ({
    element,
    popover: {
      title: step.title,
      description: step.description,
      side: step.side,
      align: step.align,
      onPopoverRender: decorate(step.icon, (i + 1) / found.length),
    },
  }));
}

const TOUR_CONFIG: Config = {
  allowClose: true,
  overlayColor: "#04221a",
  overlayOpacity: 0.72,
  stagePadding: 6,
  stageRadius: 12,
  popoverOffset: 14,
  popoverClass: "peacock-tour",
  nextBtnText: `Next ${ARROW_RIGHT}`,
  prevBtnText: "Back",
  onHighlighted: (element) => showRing(element),
  onDeselected: () => removeRing(),
};

// Second tour: runs on its own driver instance once the chat window is open.
async function startChatTour() {
  const chatReady = await openChat();

  const steps = chatReady ? buildChatSteps() : [];
  if (steps.length === 0) {
    releaseGuide();
    return;
  }
  const last = steps[steps.length - 1];
  last.popover = { ...last.popover, doneBtnText: `Start chatting ${ARROW_RIGHT}` };

  driver({
    ...TOUR_CONFIG,
    steps,
    onDestroyed: () => {
      releaseGuide();
      removeRing();
      // Put the cursor in the message box so the visitor can start typing straight away.
      focusMessageBox();
    },
  }).drive();
}

export function startAgentTour() {
  if (!claimGuide()) return;

  // Chat already open: skip the intro and go straight to the controls inside it.
  if (isChatOpen()) {
    void startChatTour();
    return;
  }

  let continueToChat = false;

  const introSteps: DriveStep[] = [
    {
      popover: {
        title: "Meet our tape assistant",
        description:
          "Not sure which tape, width or print you need? Our assistant can answer questions and help you get a quote.",
        onPopoverRender: decorate("sparkles", 0.5),
      },
    },
    {
      element: findAgentLauncher() ?? createFallbackAnchor(),
      popover: {
        title: "Chat with the agent",
        description: "Click here any time to open the chat. Press Next and we'll show you around inside.",
        side: "top",
        align: "end",
        doneBtnText: `Next ${ARROW_RIGHT}`,
        onPopoverRender: decorate("bot", 1),
        onNextClick: (_el, _step, { driver: tour }) => {
          continueToChat = true;
          tour.destroy();
        },
      },
    },
  ];

  driver({
    ...TOUR_CONFIG,
    steps: introSteps,
    onDestroyed: () => {
      removeFallbackAnchor();
      removeRing();
      if (continueToChat) void startChatTour();
      else releaseGuide();
    },
  }).drive();
}
