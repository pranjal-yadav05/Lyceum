import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Button } from "./ui/button";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Timer,
  ListChecks,
  Music,
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";
import AmbientPlayer from "./solo-study/AmbientPlayer";
import PomodoroTimer from "./solo-study/PomodoroTimer";
import SessionTodos from "./solo-study/SessionTodos";
import SoundMixer, {
  loadSavedAmbientAudio,
  loadSavedSoundLayers,
  AMBIENT_AUDIO_STORAGE_KEY,
  SOUND_LAYERS_STORAGE_KEY,
} from "./solo-study/SoundMixer";
import SoundLayerEngine from "./solo-study/SoundLayerEngine";
import FocusToolCard from "./solo-study/FocusToolCard";
import LoadingSpinner from "./LoadingSpinner";
import {
  FOCUS_DOCK_WIDTH,
  FOCUS_MIXER_BODY_MAX_H,
  FOCUS_PILL_BAR_CLASS,
  FOCUS_PILL_BTN_CLASS,
} from "./solo-study/focusRoomStyles";
import { loadYouTubeIframeApi } from "../lib/youtubeIframeApi";

const API_URL = process.env.REACT_APP_API_URL;

export default function SoloStudyRoom() {
  const { envId } = useParams();
  const navigate = useNavigate();
  const startTimeRef = useRef(null);
  const sessionSavedRef = useRef(false);
  const containerRef = useRef(null);
  const soundEngineRef = useRef(null);

  const [environment, setEnvironment] = useState(null);
  const [soundCategories, setSoundCategories] = useState([]);
  const [sounds, setSounds] = useState([]);
  const [soundLayers, setSoundLayers] = useState(loadSavedSoundLayers);
  const [ambientAudio, setAmbientAudio] = useState(loadSavedAmbientAudio);
  const [loading, setLoading] = useState(true);
  const [masterMuted, setMasterMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [readySoundIds, setReadySoundIds] = useState([]);

  useEffect(() => {
    loadYouTubeIframeApi().catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const [envRes, soundsRes] = await Promise.all([
          axios.get(`${API_URL}/focus-spaces/${envId}`),
          axios.get(`${API_URL}/focus-sounds`),
        ]);
        if (!cancelled) {
          setEnvironment(envRes.data);
          setSoundCategories(soundsRes.data.categories || []);
          const catalogSounds = soundsRes.data.sounds || [];
          setSounds(catalogSounds);
          setSoundLayers((prev) => {
            const next = { ...loadSavedSoundLayers(), ...prev };
            for (const sound of catalogSounds) {
              if (!next[sound.id]) {
                next[sound.id] = {
                  enabled: false,
                  volume: sound.defaultVolume ?? 50,
                };
              }
            }
            return next;
          });
          startTimeRef.current = new Date();
          sessionSavedRef.current = false;
        }
      } catch {
        if (!cancelled) {
          toast.error("Environment not found");
          navigate("/solo-study", { replace: true });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [envId, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.setItem(SOUND_LAYERS_STORAGE_KEY, JSON.stringify(soundLayers));
    }, 400);
    return () => clearTimeout(timer);
  }, [soundLayers]);

  useEffect(() => {
    const timer = setTimeout(() => {
      sessionStorage.setItem(AMBIENT_AUDIO_STORAGE_KEY, JSON.stringify(ambientAudio));
    }, 400);
    return () => clearTimeout(timer);
  }, [ambientAudio]);

  const saveSession = useCallback(() => {
    if (sessionSavedRef.current || !startTimeRef.current) return;
    sessionSavedRef.current = true;

    const endTime = new Date();
    const duration = Math.floor((endTime - startTimeRef.current) / 1000);
    if (duration < 60) return;

    axios
      .post(`${API_URL}/studySessions`, {
        type: "studysession",
        duration,
        startTime: startTimeRef.current.toISOString(),
        endTime: endTime.toISOString(),
      })
      .catch((err) => console.error("Failed to save study session:", err));
  }, []);

  const leaveRoom = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    setShowExitConfirm(false);
    saveSession();
    navigate("/solo-study");
    toast.success("Session saved. Great work!");
  }, [saveSession, navigate]);

  const requestExit = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setShowExitConfirm(true);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    if (!showExitConfirm) return undefined;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setShowExitConfirm(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showExitConfirm]);

  const activeSoundCount = useMemo(() => {
    let count = Object.values(soundLayers).filter((l) => l.enabled).length;
    if (ambientAudio.enabled) count += 1;
    return count;
  }, [ambientAudio.enabled, soundLayers]);

  const hasRoomAudio = environment?.type === "youtube" && !!environment?.youtubeId;
  const showSoundMixer = hasRoomAudio || sounds.length > 0;

  const handleSoundLayersChange = useCallback((updater) => {
    setSoundLayers((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      for (const id of Object.keys(next)) {
        if (next[id]?.enabled && !prev[id]?.enabled) {
          soundEngineRef.current?.prioritize?.(id);
        }
      }
      return next;
    });
  }, []);

  const activateRoomAudio = useCallback(() => {
    setMasterMuted(false);
  }, []);

  const handleAmbientToggle = useCallback(() => {
    setAmbientAudio((prev) => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const handleAmbientVolumeLive = useCallback((volume) => {
    setAmbientAudio((prev) => ({ ...prev, volume }));
  }, []);

  const handleAmbientVolumeCommit = useCallback((volume) => {
    setAmbientAudio((prev) => ({ ...prev, volume }));
  }, []);

  const handleVolumeLive = useCallback((soundId, volume) => {
    soundEngineRef.current?.setLayerVolume(soundId, volume);
  }, []);

  const handleVolumeCommit = useCallback((soundId, volume) => {
    setSoundLayers((prev) => ({
      ...prev,
      [soundId]: {
        ...(prev[soundId] || { enabled: true, volume: 50 }),
        enabled: prev[soundId]?.enabled ?? true,
        volume,
      },
    }));
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <LoadingSpinner />
      </div>
    );
  }

  if (!environment) return null;

  return (
    <div ref={containerRef} className="relative h-screen w-screen overflow-hidden bg-black">
      <AmbientPlayer
        environment={environment}
        masterMuted={masterMuted}
        ambientEnabled={ambientAudio.enabled}
        ambientVolume={ambientAudio.volume}
      />
      <SoundLayerEngine
        ref={soundEngineRef}
        sounds={sounds}
        layers={soundLayers}
        masterMuted={masterMuted}
        onReadyIdsChange={setReadySoundIds}
      />

      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 flex items-start justify-between gap-3 p-3 sm:p-4">
          <div className={`pointer-events-auto flex max-w-[min(100%,20rem)] items-center gap-2 py-1.5 pl-1.5 pr-3 ${FOCUS_PILL_BAR_CLASS}`}>
            <Button
              variant="ghost"
              size="sm"
              className={`${FOCUS_PILL_BTN_CLASS} h-8 shrink-0 px-2`}
              onClick={requestExit}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Exit</span>
            </Button>
            <div className="min-w-0 border-l border-white/10 pl-2">
              <p className="text-sm font-medium text-white truncate">{environment.title}</p>
            </div>
          </div>

          <div className={`pointer-events-auto flex items-center gap-0.5 p-1 ${FOCUS_PILL_BAR_CLASS}`}>
            <Button
              variant="ghost"
              size="icon"
              className={`${FOCUS_PILL_BTN_CLASS} h-8 w-8`}
              onClick={() => setMasterMuted((m) => !m)}
              title={masterMuted ? "Unmute all audio" : "Mute all audio"}
            >
              {masterMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`${FOCUS_PILL_BTN_CLASS} h-8 w-8`}
              onClick={toggleFullscreen}
              title="Toggle fullscreen"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div
          className={`pointer-events-auto absolute top-16 left-3 space-y-2 sm:top-[4.5rem] sm:left-4 ${FOCUS_DOCK_WIDTH}`}
        >
          <FocusToolCard title="Pomodoro" icon={Timer}>
            <PomodoroTimer embedded />
          </FocusToolCard>

          <FocusToolCard title="Session goals" icon={ListChecks}>
            <SessionTodos environmentId={environment.id} embedded />
          </FocusToolCard>
        </div>

        {showSoundMixer && (
          <div
            className={`pointer-events-auto absolute top-16 right-3 sm:top-[4.5rem] sm:right-4 ${FOCUS_DOCK_WIDTH}`}
          >
            <FocusToolCard
              title="Sound mixer"
              icon={Music}
              badge={activeSoundCount > 0 ? `${activeSoundCount} on` : undefined}
              bodyClassName={FOCUS_MIXER_BODY_MAX_H}
            >
              <SoundMixer
                categories={soundCategories}
                sounds={sounds}
                layers={soundLayers}
                readySoundIds={readySoundIds}
                ambient={
                  hasRoomAudio
                    ? {
                        title: environment.title,
                        enabled: ambientAudio.enabled,
                        volume: ambientAudio.volume,
                      }
                    : null
                }
                onLayersChange={handleSoundLayersChange}
                onVolumeLive={handleVolumeLive}
                onVolumeCommit={handleVolumeCommit}
                onAmbientToggle={handleAmbientToggle}
                onAmbientVolumeLive={handleAmbientVolumeLive}
                onAmbientVolumeCommit={handleAmbientVolumeCommit}
                onUserActivate={activateRoomAudio}
                embedded
              />
            </FocusToolCard>
          </div>
        )}
      </div>

      {showExitConfirm && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto bg-black/50 backdrop-blur-md p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="exit-dialog-title"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl p-6 text-center">
            <button
              type="button"
              onClick={() => setShowExitConfirm(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 id="exit-dialog-title" className="text-xl font-semibold text-white pr-6">
              End focus session?
            </h2>
            <p className="mt-3 text-sm text-gray-200 leading-relaxed">
              Your study time will be saved to your profile stats.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 rounded-lg shadow-lg"
                onClick={leaveRoom}
              >
                End session
              </Button>
              <Button
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg shadow-lg"
                onClick={() => setShowExitConfirm(false)}
                autoFocus
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
