import { Minus, Plus } from "lucide-react";
import { cn } from "../../lib/utils";

export default function FocusStepper({
  label,
  value,
  onChange,
  min,
  max,
  className,
}) {
  const clamp = (next) => Math.min(max, Math.max(min, next));

  return (
    <div className={cn("space-y-1.5", className)}>
      <span className="text-xs text-gray-400">{label}</span>
      <div className="flex items-center overflow-hidden rounded-xl border border-white/10 bg-black/25">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={value <= min}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="flex-1 select-none text-center font-mono text-sm tabular-nums text-white">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={value >= max}
          className="flex h-9 w-9 shrink-0 items-center justify-center text-gray-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
