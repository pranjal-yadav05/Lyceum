import { cn } from "../../lib/utils";

export default function FocusSlider({
  value,
  onChange,
  onPointerUp,
  min = 0,
  max = 100,
  disabled = false,
  className,
}) {
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("relative flex h-5 flex-1 items-center", className)}>
      <div className="pointer-events-none absolute inset-x-0 h-1 rounded-full bg-white/10" />
      <div
        className="pointer-events-none absolute left-0 h-1 rounded-full bg-purple-500/80"
        style={{ width: `${percent}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onPointerUp}
        className="focus-room-slider relative z-10 h-5 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
      />
    </div>
  );
}
