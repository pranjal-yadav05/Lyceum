import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";
import {
  FOCUS_CARD_BODY_MAX_H,
  FOCUS_CARD_CLASS,
  FOCUS_CARD_HEADER_CLASS,
  FOCUS_ICON_CLASS,
  FOCUS_SCROLL_BODY_CLASS,
} from "./focusRoomStyles";

export default function FocusToolCard({
  title,
  icon: Icon,
  badge,
  defaultOpen = false,
  bodyClassName,
  children,
  className,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={cn(FOCUS_CARD_CLASS, className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          FOCUS_CARD_HEADER_CLASS,
          open ? "rounded-t-2xl" : "rounded-2xl"
        )}
        aria-expanded={open}
      >
        <span className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className={FOCUS_ICON_CLASS} />}
          <span className="truncate text-sm font-medium text-white">{title}</span>
          {badge != null && (
            <span className="shrink-0 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs text-purple-200">
              {badge}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div
          className={cn(
            "border-t border-white/10 px-4 pb-4 pt-3",
            FOCUS_SCROLL_BODY_CLASS,
            bodyClassName ?? FOCUS_CARD_BODY_MAX_H
          )}
        >
          {children}
        </div>
      )}
    </section>
  );
}
