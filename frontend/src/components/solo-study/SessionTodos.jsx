import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Check, Plus, Trash2 } from "lucide-react";
import { API_URL } from "../../config/env";
import {
  FOCUS_BTN_GHOST,
  FOCUS_BTN_PRIMARY,
  FOCUS_INPUT_CLASS,
  FOCUS_LIST_ROW_CLASS,
  FOCUS_SCROLL_BODY_CLASS,
} from "./focusRoomStyles";

const LEGACY_STORAGE_PREFIX = "solo-study-todos-";

function readLegacyTasks(environmentId) {
  const keys = new Set();
  if (environmentId) keys.add(`${LEGACY_STORAGE_PREFIX}${environmentId}`);

  try {
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(LEGACY_STORAGE_PREFIX)) keys.add(key);
    }
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(LEGACY_STORAGE_PREFIX)) keys.add(key);
    }
  } catch {
    /* storage unavailable */
  }

  const merged = new Map();
  for (const key of keys) {
    try {
      const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;
      for (const task of parsed) {
        if (task?.id && task?.text && !merged.has(task.id)) {
          merged.set(task.id, {
            id: task.id,
            text: task.text,
            done: Boolean(task.done),
          });
        }
      }
    } catch {
      /* skip invalid entry */
    }
  }

  return [...merged.values()];
}

function clearLegacyTasks() {
  try {
    const toRemove = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(LEGACY_STORAGE_PREFIX)) toRemove.push(key);
    }
    for (const key of toRemove) sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export default function SessionTodos({ environmentId, embedded = false }) {
  const [tasks, setTasks] = useState([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const hydratedRef = useRef(false);
  const skipSaveRef = useRef(true);

  useEffect(() => {
    let cancelled = false;
    hydratedRef.current = false;
    skipSaveRef.current = true;

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_URL}/me/focus-goals`, {
          withCredentials: true,
        });
        if (cancelled) return;

        let next = Array.isArray(data.tasks) ? data.tasks : [];

        if (next.length === 0) {
          const legacy = readLegacyTasks(environmentId);
          if (legacy.length > 0) {
            next = legacy;
            await axios.put(
              `${API_URL}/me/focus-goals`,
              { tasks: legacy },
              { withCredentials: true }
            );
            clearLegacyTasks();
          }
        }

        setTasks(next);
      } catch {
        if (!cancelled) {
          setTasks(readLegacyTasks(environmentId));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          hydratedRef.current = true;
          window.setTimeout(() => {
            skipSaveRef.current = false;
          }, 0);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [environmentId]);

  useEffect(() => {
    if (!hydratedRef.current || skipSaveRef.current) return undefined;

    const timer = window.setTimeout(() => {
      axios
        .put(`${API_URL}/me/focus-goals`, { tasks }, { withCredentials: true })
        .catch((err) => console.error("Failed to save focus goals:", err));
    }, 400);

    return () => window.clearTimeout(timer);
  }, [tasks]);

  const addTask = (e) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setTasks((prev) => [...prev, { id: crypto.randomUUID(), text, done: false }]);
    setDraft("");
  };

  const toggleTask = (id) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const removeTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const completed = tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-3">
      {!embedded && (
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-purple-300/80">
            Session goals
          </span>
          {tasks.length > 0 && (
            <span className="text-xs text-gray-500">
              {completed}/{tasks.length}
            </span>
          )}
        </div>
      )}

      {embedded && tasks.length > 0 && (
        <p className="text-xs text-gray-400">
          {completed}/{tasks.length} complete
        </p>
      )}

      <form onSubmit={addTask} className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="What will you finish?"
          className={`${FOCUS_INPUT_CLASS} h-9 text-sm`}
          disabled={loading}
        />
        <Button
          type="submit"
          size="sm"
          className={`${FOCUS_BTN_PRIMARY} h-9 w-9 shrink-0 px-0`}
          disabled={loading}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <div className={`max-h-36 ${FOCUS_SCROLL_BODY_CLASS}`}>
        <ul className="space-y-2 pr-2">
          {loading ? (
            <li className="text-sm italic text-gray-500">Loading your goals…</li>
          ) : tasks.length === 0 ? (
            <li className="text-sm italic text-gray-500">
              Add goals — they&apos;ll stay on your account until you remove them
            </li>
          ) : (
            tasks.map((task) => (
              <li
                key={task.id}
                className={`group flex items-center gap-2 px-2 py-1.5 ${FOCUS_LIST_ROW_CLASS}`}
              >
                <button
                  type="button"
                  onClick={() => toggleTask(task.id)}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    task.done
                      ? "border-purple-500 bg-purple-600"
                      : "border-white/20 hover:border-purple-400/60"
                  }`}
                  aria-label={task.done ? "Mark incomplete" : "Mark complete"}
                >
                  {task.done && <Check className="h-3 w-3 text-white" />}
                </button>
                <span
                  className={`flex-1 text-sm ${
                    task.done ? "text-gray-500 line-through" : "text-gray-200"
                  }`}
                >
                  {task.text}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTask(task.id)}
                  className={`${FOCUS_BTN_GHOST} h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100`}
                  aria-label="Remove goal"
                >
                  <Trash2 className="h-3.5 w-3.5 text-gray-400 hover:text-red-400" />
                </Button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
