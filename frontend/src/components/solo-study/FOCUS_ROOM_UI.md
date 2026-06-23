# Focus Room UI

Design tokens and patterns for **Solo Focus Spaces** (`/solo-study/:envId`). Import from `focusRoomStyles.js` when building or restyling room components.

## Visual language

| Principle | Implementation |
|-----------|----------------|
| Glass panels | `bg-white/10 backdrop-blur-lg border border-white/20` |
| Corners | `rounded-2xl` cards, `rounded-xl` inner controls, `rounded-full` pill bars |
| Accent | Purple (`purple-400` icons, `purple-600` primary actions) |
| Text | White headings, `gray-400` secondary, `gray-500` hints |
| Background | Full-screen ambient video; UI floats above at `z-10` |

## Token reference

| Token | Use for |
|-------|---------|
| `FOCUS_CARD_CLASS` | Standalone collapsible tool cards |
| `FOCUS_PILL_BAR_CLASS` | Top exit bar, volume/fullscreen bar |
| `FOCUS_PILL_BTN_CLASS` | Buttons inside pill bars |
| `FOCUS_CARD_HEADER_CLASS` | Card accordion header |
| `FOCUS_INPUT_CLASS` | Text fields (goals, etc.) |
| `FOCUS_BTN_PRIMARY` | Start, submit, confirm |
| `FOCUS_BTN_OUTLINE` | Pause, secondary actions |
| `FOCUS_BTN_GHOST` | Icon-only / tertiary |
| `FOCUS_INNER_PANEL_CLASS` | Nested rows (sound layers) |
| `FOCUS_LIST_ROW_CLASS` | Todo rows |
| `FOCUS_SCROLLBAR_CLASS` | Pass to Radix `ScrollBar` |
| `FOCUS_DOCK_WIDTH` | Standard card column width |

## Layout (SoloStudyRoom)

- **Top-left:** exit + environment title pill
- **Top-right:** master mute + fullscreen pill
- **Left column:** Pomodoro, Session goals (separate cards, collapsed by default)
- **Right column:** Sound mixer (separate card, collapsed by default)
- Cards use `pointer-events-auto`; overlay wrapper is `pointer-events-none`

## Components to reuse

- `FocusToolCard` — accordion glass card
- `FocusStepper` — +/- numeric control (no native spinners)
- `FocusSlider` — custom range (no native track/thumb)
- `Switch` from `ui/switch` with `data-[state=checked]:bg-purple-600`

## YouTube embeds

- Background video: `AmbientPlayer` + `getYouTubeAmbientPlayerVars()` — always `mute: 1` for autoplay
- Live streams (`sourceUrl` contains `/live/`): omit `loop` / `playlist` params
- Sound layers: `SoundLayerEngine` — same player vars, hidden 1×1 players
- Never unmute before playback starts; user gesture (volume toggle or enabling a sound) unlocks audio
- **Chrome suppression:** poster cover whenever state ≠ PLAYING; permanent bottom/corner gradient masks; 2s watchdog resumes stalled players; iframe scaled to 130% with `pointer-events-none`

## Do not use in focus rooms

- Native number inputs or unstyled `<input type="range">`
- Native overflow scrollbars (`overflow-y-auto` without `ScrollArea`)
- Default shadcn `rounded-md` buttons without focus-room overrides
- Merged multi-tool panels — keep one card per tool for minimal visual footprint
