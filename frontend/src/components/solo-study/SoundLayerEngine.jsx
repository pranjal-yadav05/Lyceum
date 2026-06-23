import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
} from "react";
import { getYouTubeSoundPlayerVars } from "../../data/soloStudyEnvironments";
import { loadYouTubeIframeApi, createYouTubeIframePlayer } from "../../lib/youtubeIframeApi";

function destroyPlayer(player, mount) {
  try {
    player?.destroy?.();
  } catch {
    /* already destroyed */
  }
  mount?.remove();
}

const YT = { PLAYING: 1, PAUSED: 2, BUFFERING: 3 };

function applyLayerVolume(player, layer, masterMuted) {
  if (!player?.setVolume) return;
  if (masterMuted) {
    player.mute();
    return;
  }
  player.unMute();
  player.setVolume(layer?.volume ?? 50);
}

function syncLayerPlayback(player, layer, masterMuted) {
  if (!player?.getPlayerState) return;
  if (!layer?.enabled) {
    try {
      player.pauseVideo();
    } catch {
      /* not ready */
    }
    return;
  }
  applyLayerVolume(player, layer, masterMuted);
  const state = player.getPlayerState();
  if (state !== YT.PLAYING && state !== YT.BUFFERING) {
    try {
      player.playVideo();
    } catch {
      /* not ready */
    }
  }
}

const SoundLayerEngine = forwardRef(function SoundLayerEngine(
  { sounds, layers, masterMuted, onReadyIdsChange },
  ref
) {
  const containerRef = useRef(null);
  const playersRef = useRef(new Map());
  const mountsRef = useRef(new Map());
  const readyRef = useRef(new Set());
  const creatingRef = useRef(new Set());
  const layersRef = useRef(layers);
  const masterMutedRef = useRef(masterMuted);
  const soundsRef = useRef(sounds);
  const cancelledRef = useRef(false);

  layersRef.current = layers;
  masterMutedRef.current = masterMuted;
  soundsRef.current = sounds;

  const publishReady = useCallback(() => {
    onReadyIdsChange?.([...readyRef.current]);
  }, [onReadyIdsChange]);

  const createPlayer = useCallback(
    async (sound, YT) => {
      if (
        playersRef.current.has(sound.id) ||
        creatingRef.current.has(sound.id) ||
        cancelledRef.current
      ) {
        return;
      }

      creatingRef.current.add(sound.id);

      const mount = document.createElement("div");
      mount.className =
        "absolute h-px w-px overflow-hidden opacity-0 pointer-events-none";
      containerRef.current?.appendChild(mount);
      mountsRef.current.set(sound.id, mount);

      const player = createYouTubeIframePlayer(YT, mount, {
        height: "1",
        width: "1",
        videoId: sound.youtubeId,
        playerVars: getYouTubeSoundPlayerVars(sound.youtubeId, sound.sourceUrl),
        events: {
          onReady: (event) => {
            creatingRef.current.delete(sound.id);
            if (cancelledRef.current) {
              destroyPlayer(event.target, mount);
              return;
            }
            readyRef.current.add(sound.id);
            publishReady();
            event.target.mute();
            syncLayerPlayback(
              event.target,
              layersRef.current[sound.id],
              masterMutedRef.current
            );
          },
          onStateChange: (event) => {
            if (event.data !== YT.PLAYING) return;
            applyLayerVolume(
              event.target,
              layersRef.current[sound.id],
              masterMutedRef.current
            );
          },
          onError: () => {
            creatingRef.current.delete(sound.id);
          },
        },
      });

      playersRef.current.set(sound.id, player);
    },
    [publishReady]
  );

  useImperativeHandle(ref, () => ({
    setLayerVolume(soundId, volume) {
      const layer = layersRef.current[soundId];
      if (!layer?.enabled) return;
      layersRef.current = {
        ...layersRef.current,
        [soundId]: { ...layer, volume },
      };
      const player = playersRef.current.get(soundId);
      if (player && readyRef.current.has(soundId)) {
        applyLayerVolume(
          player,
          layersRef.current[soundId],
          masterMutedRef.current
        );
      }
    },
    async prioritize(soundId) {
      const sound = soundsRef.current?.find((s) => s.id === soundId);
      if (!sound || readyRef.current.has(soundId)) return;
      const YT = await loadYouTubeIframeApi();
      if (cancelledRef.current) return;
      await createPlayer(sound, YT);
    },
  }));

  useEffect(() => {
    if (!sounds?.length) return undefined;

    cancelledRef.current = false;

    const initPool = async () => {
      const YT = await loadYouTubeIframeApi();
      if (cancelledRef.current) return;
      await Promise.all(sounds.map((sound) => createPlayer(sound, YT)));
    };

    initPool().catch(console.error);

    return () => {
      cancelledRef.current = true;
    };
  }, [sounds, createPlayer]);

  useLayoutEffect(() => {
    for (const sound of sounds ?? []) {
      const player = playersRef.current.get(sound.id);
      if (!player || !readyRef.current.has(sound.id)) continue;
      syncLayerPlayback(
        player,
        layersRef.current[sound.id],
        masterMutedRef.current
      );
    }
  }, [layers, masterMuted, sounds]);

  useEffect(() => {
    const players = playersRef.current;
    const mounts = mountsRef.current;
    const ready = readyRef.current;
    const creating = creatingRef.current;
    return () => {
      ready.clear();
      creating.clear();
      for (const [id, player] of players.entries()) {
        destroyPlayer(player, mounts.get(id));
      }
      players.clear();
      mounts.clear();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed h-px w-px overflow-hidden opacity-0"
      aria-hidden="true"
    />
  );
});

export default SoundLayerEngine;
