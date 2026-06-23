import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "../ui/button";
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react";
import { toast } from "react-hot-toast";
import FocusStepper from "./FocusStepper";
import { FOCUS_BTN_GHOST, FOCUS_BTN_OUTLINE, FOCUS_BTN_PRIMARY } from "./focusRoomStyles";

const WORK_DEFAULT = 25;
const BREAK_DEFAULT = 5;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function PomodoroTimer({ onWorkSessionComplete, embedded = false }) {
  const [workMinutes, setWorkMinutes] = useState(WORK_DEFAULT);
  const [breakMinutes, setBreakMinutes] = useState(BREAK_DEFAULT);
  const [phase, setPhase] = useState("idle");
  const [timeLeft, setTimeLeft] = useState(WORK_DEFAULT * 60);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const intervalRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => clearTimer, [clearTimer]);

  useEffect(() => {
    if (phase === "idle") return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearTimer();
          if (phase === "work") {
            setCompletedPomodoros((c) => c + 1);
            onWorkSessionComplete?.();
            toast.success("Focus block complete. Take a break!");
            setPhase("break");
            return breakMinutes * 60;
          }
          toast("Break over. Back to focus.", { icon: "🎯" });
          setPhase("work");
          return workMinutes * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [phase, workMinutes, breakMinutes, clearTimer, onWorkSessionComplete]);

  const start = () => {
    if (phase === "idle") {
      setPhase("work");
      setTimeLeft(workMinutes * 60);
    }
  };

  const pause = () => {
    clearTimer();
    setPhase("idle");
  };

  const reset = () => {
    clearTimer();
    setPhase("idle");
    setTimeLeft(workMinutes * 60);
  };

  const skipBreak = () => {
    if (phase !== "break") return;
    clearTimer();
    setPhase("work");
    setTimeLeft(workMinutes * 60);
    toast("Break skipped", { icon: "⏭️" });
  };

  const isRunning = phase !== "idle";

  return (
    <div className="space-y-3">
      {!embedded && (
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-purple-300/80">
            {phase === "break" ? "Break" : phase === "work" ? "Focus" : "Pomodoro"}
          </span>
          <span className="text-xs text-gray-500">{completedPomodoros} done</span>
        </div>
      )}

      {embedded && (
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{phase === "break" ? "Break" : phase === "work" ? "Focus" : "Ready"}</span>
          <span>{completedPomodoros} done</span>
        </div>
      )}

      <p
        className={`font-mono font-bold tabular-nums text-white ${embedded ? "text-3xl" : "text-4xl"}`}
      >
        {formatTime(timeLeft)}
      </p>

      <div className="flex flex-wrap gap-2">
        {!isRunning ? (
          <Button size="sm" className={`${FOCUS_BTN_PRIMARY} flex-1`} onClick={start}>
            <Play className="mr-1 h-4 w-4" />
            Start
          </Button>
        ) : (
          <Button size="sm" className={`${FOCUS_BTN_OUTLINE} flex-1`} onClick={pause}>
            <Pause className="mr-1 h-4 w-4" />
            Pause
          </Button>
        )}
        <Button size="sm" variant="ghost" className={FOCUS_BTN_GHOST} onClick={reset}>
          <RotateCcw className="h-4 w-4" />
        </Button>
        {phase === "break" && (
          <Button size="sm" variant="ghost" className={FOCUS_BTN_GHOST} onClick={skipBreak}>
            <SkipForward className="h-4 w-4" />
          </Button>
        )}
      </div>

      {phase === "idle" && (
        <div className="grid grid-cols-2 gap-2">
          <FocusStepper
            label="Focus (min)"
            value={workMinutes}
            min={5}
            max={90}
            onChange={(v) => {
              setWorkMinutes(v);
              setTimeLeft(v * 60);
            }}
          />
          <FocusStepper
            label="Break (min)"
            value={breakMinutes}
            min={1}
            max={30}
            onChange={setBreakMinutes}
          />
        </div>
      )}
    </div>
  );
}
