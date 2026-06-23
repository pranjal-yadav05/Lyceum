/**
 * Focus Room UI — Lyceum glass-overlay design tokens
 *
 * Visual language for solo focus rooms: full-screen ambient video with floating
 * glass panels. Purple accent on dark frosted surfaces.
 *
 * Usage guide: see FOCUS_ROOM_UI.md in this folder.
 */

/** Floating tool card shell (Pomodoro, goals, sound mixer) */
export const FOCUS_CARD_CLASS =
  "overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-xl backdrop-blur-lg";

/** Top header pill bars (exit title, volume/fullscreen) */
export const FOCUS_PILL_BAR_CLASS =
  "rounded-full border border-white/20 bg-white/10 shadow-xl backdrop-blur-lg select-none";

/** Icon/text buttons inside pill bars */
export const FOCUS_PILL_BTN_CLASS =
  "select-none rounded-full text-white hover:bg-white/15 hover:text-white focus-visible:ring-0 focus-visible:bg-white/15 focus-visible:text-white active:bg-white/20";

/** Card section header toggle */
export const FOCUS_CARD_HEADER_CLASS =
  "flex w-full select-none items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none active:bg-white/10";

/** Nested list row inside a card */
export const FOCUS_LIST_ROW_CLASS =
  "rounded-xl border border-white/5 bg-black/20";

/** Inner panel for sound layer rows */
export const FOCUS_INNER_PANEL_CLASS =
  "rounded-xl border border-white/15 bg-black/20";

/** Text inputs on glass backgrounds */
export const FOCUS_INPUT_CLASS =
  "rounded-xl border-white/15 bg-black/25 text-white shadow-none placeholder:text-gray-500 focus-visible:border-purple-500/40 focus-visible:ring-1 focus-visible:ring-purple-500/50";

export const FOCUS_BTN_PRIMARY =
  "rounded-xl bg-purple-600 text-white shadow-none hover:bg-purple-700 focus-visible:ring-1 focus-visible:ring-purple-400/60";

export const FOCUS_BTN_OUTLINE =
  "rounded-xl border-white/20 bg-white/5 text-white shadow-none hover:bg-white/10 hover:text-white focus-visible:ring-1 focus-visible:ring-purple-400/40";

export const FOCUS_BTN_GHOST =
  "rounded-xl text-white shadow-none hover:bg-white/10 hover:text-white focus-visible:bg-white/10 focus-visible:ring-0";

/** Radix ScrollArea thumb override */
export const FOCUS_SCROLLBAR_CLASS =
  "w-1.5 border-l-0 p-0 [&>div]:rounded-full [&>div]:bg-purple-500/40 hover:[&>div]:bg-purple-500/60";

/** Accent icon tint for card headers */
export const FOCUS_ICON_CLASS = "h-4 w-4 shrink-0 text-purple-400";

/** Category label inside cards */
export const FOCUS_LABEL_CLASS =
  "text-xs font-medium uppercase tracking-wide text-purple-400";

/** Floating dock width constraint */
export const FOCUS_DOCK_WIDTH = "w-[min(calc(100vw-1.5rem),18rem)]";

/** Scrollable card body — pair with .focus-room-scroll in index.css */
export const FOCUS_SCROLL_BODY_CLASS =
  "overflow-y-auto overscroll-contain focus-room-scroll pr-1";

/** Default expanded card height */
export const FOCUS_CARD_BODY_MAX_H = "max-h-[min(40vh,280px)]";

/** Taller scroll region for sound mixer */
export const FOCUS_MIXER_BODY_MAX_H = "max-h-[min(calc(100vh-7rem),32rem)]";
