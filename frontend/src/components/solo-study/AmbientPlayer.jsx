import { memo, useEffect, useRef, useState } from "react";
import {
  getYouTubeAmbientPlayerVars,
  isYouTubeLiveSource,
} from "../../data/soloStudyEnvironments";
import { loadYouTubeIframeApi, createYouTubeIframePlayer } from "../../lib/youtubeIframeApi";

function destroyPlayer(player) {
  try {
    player?.destroy?.();
  } catch {
    /* already destroyed */
  }
}

const AMBIENT_FRAME_CLASS =
  "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130vw] h-[73.125vw] min-h-[130vh] min-w-[231.11vh] overflow-hidden select-none [&_iframe]:pointer-events-none [&_iframe]:border-0 [&_iframe]:select-none";

const YT = { PLAYING: 1, PAUSED: 2, BUFFERING: 3, ENDED: 0, CUED: 5, UNSTARTED: -1 };
const STALL_STATES = new Set([YT.PAUSED, YT.ENDED, YT.CUED, YT.UNSTARTED]);

function ChromeMasks() {
  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[3] h-[14%] min-h-[56px] bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
      <div className="pointer-events-none absolute bottom-0 right-0 z-[3] h-[12%] w-[18%] min-h-[48px] min-w-[96px] bg-gradient-to-tl from-black/85 via-black/40 to-transparent" />
    </>
  );
}

function LoadingCover({ visible }) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-[4] bg-black transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    />
  );
}

function AmbientPlayer({
  environment,
  masterMuted,
  ambientEnabled = true,
  ambientVolume = 100,
}) {
  const mountRef = useRef(null);
  const playerRef = useRef(null);
  const masterMutedRef = useRef(masterMuted);
  const ambientEnabledRef = useRef(ambientEnabled);
  const ambientVolumeRef = useRef(ambientVolume);
  const [awaitingFirstFrame, setAwaitingFirstFrame] = useState(true);

  masterMutedRef.current = masterMuted;
  ambientEnabledRef.current = ambientEnabled;
  ambientVolumeRef.current = ambientVolume;

  const applyAmbientAudio = (player) => {
    if (!player?.mute) return;
    if (masterMutedRef.current || !ambientEnabledRef.current) {
      player.mute();
      return;
    }
    player.unMute();
    player.setVolume(ambientVolumeRef.current);
  };

  const isLive = isYouTubeLiveSource(environment?.sourceUrl);

  useEffect(() => {
    setAwaitingFirstFrame(true);
  }, [environment?.youtubeId]);

  useEffect(() => {
    if (environment?.type !== "youtube" || !environment?.youtubeId) return undefined;

    const mountEl = mountRef.current;
    if (!mountEl) return undefined;

    let cancelled = false;

    const resumeIfStalled = (target) => {
      if (cancelled || !target?.playVideo) return;
      const state = target.getPlayerState?.();
      if (state === YT.PLAYING || state === YT.BUFFERING) return;
      target.playVideo();
    };

    const startInitial = (target) => {
      if (cancelled || !target?.playVideo) return;
      target.mute();
      target.playVideo();
    };

    const handleState = (target, state) => {
      if (state === YT.PLAYING) {
        setAwaitingFirstFrame(false);
        applyAmbientAudio(target);
        return;
      }

      if (state === YT.BUFFERING) return;

      if (STALL_STATES.has(state)) {
        resumeIfStalled(target);
      }
    };

    const init = async () => {
      const YTApi = await loadYouTubeIframeApi();
      if (cancelled || !mountRef.current) return;

      const player = createYouTubeIframePlayer(YTApi, mountEl, {
        videoId: environment.youtubeId,
        width: "100%",
        height: "100%",
        playerVars: getYouTubeAmbientPlayerVars(environment.youtubeId, { isLive }),
        events: {
          onReady: (event) => {
            if (cancelled) {
              destroyPlayer(event.target);
              return;
            }
            playerRef.current = event.target;
            startInitial(event.target);
          },
          onStateChange: (event) => {
            handleState(event.target, event.data);
          },
          onError: () => {},
        },
      });
      playerRef.current = player;
    };

    init().catch(console.error);

    const watchdog = window.setInterval(() => {
      const player = playerRef.current;
      if (!player?.getPlayerState) return;
      const state = player.getPlayerState();
      if (STALL_STATES.has(state)) {
        resumeIfStalled(player);
      }
    }, 3000);

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      resumeIfStalled(playerRef.current);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(watchdog);
      document.removeEventListener("visibilitychange", onVisible);
      destroyPlayer(playerRef.current);
      playerRef.current = null;
    };
  }, [environment?.type, environment?.youtubeId, environment?.sourceUrl, isLive]);

  useEffect(() => {
    applyAmbientAudio(playerRef.current);
  }, [masterMuted, ambientEnabled, ambientVolume]);

  if (!environment) return null;

  if (environment.type === "youtube" && environment.youtubeId) {
    return (
      <div className={AMBIENT_FRAME_CLASS} aria-hidden="true">
        <div
          ref={mountRef}
          className={`h-full w-full transition-opacity duration-300 ${
            awaitingFirstFrame ? "opacity-0" : "opacity-100"
          }`}
          tabIndex={-1}
        />
        <ChromeMasks />
        <LoadingCover visible={awaitingFirstFrame} />
      </div>
    );
  }

  if (environment.type === "url" && environment.url) {
    return (
      <iframe
        title={environment.title}
        src={environment.url}
        tabIndex={-1}
        className="pointer-events-none absolute inset-0 h-full w-full select-none border-0"
        allow="autoplay"
      />
    );
  }

  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#1a1339] via-[#2a1f5a] to-[#0f0a1f]" />
  );
}

export default memo(AmbientPlayer);
