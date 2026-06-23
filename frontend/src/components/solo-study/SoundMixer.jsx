import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Volume2 } from "lucide-react";
import { Switch } from "../ui/switch";
import FocusSlider from "./FocusSlider";
import { FOCUS_INNER_PANEL_CLASS, FOCUS_LABEL_CLASS } from "./focusRoomStyles";

function SoundLayerControl({
  sound,
  layer,
  isReady,
  disabled,
  onToggle,
  onVolumeLive,
  onVolumeCommit,
}) {
  const [localVolume, setLocalVolume] = useState(layer.volume);
  const volumeRef = useRef(layer.volume);

  useEffect(() => {
    setLocalVolume(layer.volume);
    volumeRef.current = layer.volume;
  }, [layer.volume]);

  const waiting = layer.enabled && !isReady;

  return (
    <div className={`space-y-2 p-3 ${FOCUS_INNER_PANEL_CLASS}`}>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => onToggle(sound.id, sound.defaultVolume)}
          disabled={disabled}
          className={`flex min-w-0 flex-1 items-center gap-2 text-left ${
            layer.enabled ? "text-white" : "text-gray-400"
          }`}
        >
          <span className="shrink-0 text-lg">{sound.icon || "🔊"}</span>
          <span className="truncate text-sm font-medium">{sound.title}</span>
        </button>
        <Switch
          checked={layer.enabled}
          disabled={disabled}
          onCheckedChange={() => onToggle(sound.id, sound.defaultVolume)}
          className="shrink-0 data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-white/20"
        />
      </div>
      {waiting && (
        <p className="flex items-center gap-1.5 text-xs text-purple-300/90">
          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
          Starting audio…
        </p>
      )}
      {layer.enabled && !waiting && (
        <div className="flex items-center gap-3">
          <FocusSlider
            value={localVolume}
            min={0}
            max={100}
            disabled={disabled}
            onChange={(v) => {
              volumeRef.current = v;
              setLocalVolume(v);
              onVolumeLive(sound.id, v);
            }}
            onPointerUp={() => onVolumeCommit(sound.id, volumeRef.current)}
          />
          <span className="w-8 shrink-0 text-right text-xs tabular-nums text-gray-400">
            {localVolume}
          </span>
        </div>
      )}
    </div>
  );
}

function SoundMixer({
  categories = [],
  sounds = [],
  layers = {},
  readySoundIds = [],
  ambient = null,
  onLayersChange,
  onVolumeLive,
  onVolumeCommit,
  onAmbientToggle,
  onAmbientVolumeLive,
  onAmbientVolumeCommit,
  onUserActivate,
  disabled = false,
  embedded = false,
}) {
  const readySet = useMemo(() => new Set(readySoundIds), [readySoundIds]);

  const toggleSound = useCallback(
    (soundId, defaultVolume) => {
      onUserActivate?.();
      onLayersChange((prev) => {
        const current = prev[soundId] || { enabled: false, volume: defaultVolume ?? 50 };
        return {
          ...prev,
          [soundId]: { ...current, enabled: !current.enabled },
        };
      });
    },
    [onLayersChange, onUserActivate]
  );

  const grouped = useMemo(() => {
    const byCategory = {};
    for (const cat of categories) {
      byCategory[cat.id] = { label: cat.label, sounds: [] };
    }
    for (const sound of sounds) {
      const key = sound.category || "other";
      if (!byCategory[key]) {
        byCategory[key] = { label: sound.categoryLabel || "Other", sounds: [] };
      }
      byCategory[key].sounds.push(sound);
    }
    return Object.entries(byCategory).filter(([, g]) => g.sounds.length > 0);
  }, [categories, sounds]);

  const toggleAmbient = useCallback(() => {
    onUserActivate?.();
    onAmbientToggle?.();
  }, [onAmbientToggle, onUserActivate]);

  const activeCount = useMemo(() => {
    let count = Object.values(layers).filter((l) => l.enabled).length;
    if (ambient?.enabled) count += 1;
    return count;
  }, [ambient?.enabled, layers]);

  const poolReady = sounds.length === 0 || readySet.size >= sounds.length;

  if (sounds.length === 0 && !ambient) {
    return (
      <p className="py-2 text-center text-xs text-gray-500">
        No ambient sounds configured yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {!embedded && (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-white">
              <Volume2 className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-semibold">Sound Mixer</h3>
            </div>
            {activeCount > 0 && (
              <span className="text-xs text-purple-300">{activeCount} active</span>
            )}
          </div>
          <p className="text-xs text-gray-400">
            Layer rain, noise, or café ambience on top of your visual room. Mute or
            adjust room audio and each layer independently.
          </p>
        </>
      )}

      {embedded && (
        <p className="text-xs text-gray-400">
          {poolReady
            ? "Toggle room audio and layers, then adjust volume for each."
            : "Loading audio layers… toggles will start working as each layer warms up."}
        </p>
      )}

      {ambient && (
        <div className="space-y-2">
          <p className={FOCUS_LABEL_CLASS}>Room audio</p>
          <SoundLayerControl
            sound={{
              id: "ambient",
              title: ambient.title,
              icon: ambient.icon || "🎬",
              defaultVolume: ambient.defaultVolume ?? 100,
            }}
            layer={{
              enabled: ambient.enabled,
              volume: ambient.volume,
            }}
            isReady={ambient.ready !== false}
            disabled={disabled}
            onToggle={toggleAmbient}
            onVolumeLive={(_, volume) => onAmbientVolumeLive?.(volume)}
            onVolumeCommit={(_, volume) => onAmbientVolumeCommit?.(volume)}
          />
        </div>
      )}

      {grouped.map(([catId, group]) => (
        <div key={catId} className="space-y-2">
          <p className={FOCUS_LABEL_CLASS}>{group.label}</p>
          {group.sounds.map((sound) => {
            const layer = layers[sound.id] || {
              enabled: false,
              volume: sound.defaultVolume ?? 50,
            };
            return (
              <SoundLayerControl
                key={sound.id}
                sound={sound}
                layer={layer}
                isReady={readySet.has(sound.id)}
                disabled={disabled}
                onToggle={toggleSound}
                onVolumeLive={onVolumeLive}
                onVolumeCommit={onVolumeCommit}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default memo(SoundMixer);

export const SOUND_LAYERS_STORAGE_KEY = "solo-study-sound-layers";
export const AMBIENT_AUDIO_STORAGE_KEY = "solo-study-ambient-audio";

export function loadSavedAmbientAudio() {
  try {
    const raw = sessionStorage.getItem(AMBIENT_AUDIO_STORAGE_KEY);
    if (!raw) return { enabled: true, volume: 100 };
    const parsed = JSON.parse(raw);
    return {
      enabled: parsed.enabled !== false,
      volume: typeof parsed.volume === "number" ? parsed.volume : 100,
    };
  } catch {
    return { enabled: true, volume: 100 };
  }
}

export function loadSavedSoundLayers() {
  try {
    const raw = sessionStorage.getItem(SOUND_LAYERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
