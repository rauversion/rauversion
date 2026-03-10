import React, { useEffect, useRef, useState } from 'react';
import useAudioStore from '../stores/audioStore';
import { get } from '@rails/request.js';
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import { Link } from "react-router-dom";
import {
  Heart,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music2
} from "lucide-react"
import PlayerQueueSheet from "./player_queue_sheet"
import useTrackLikeAction from "@/hooks/useTrackLikeAction"

const ProgressBar = ({ progress, duration, currentTime, onSeek, formatTime }) => (
  <div className="flex items-center w-full max-w-2xl mx-auto">
    <span className="text-xs text-foreground/80 w-12 text-right">{formatTime(currentTime)}</span>
    <div className="relative w-full mx-2 group" onClick={onSeek}>
      <div className="h-1 bg-foreground/20 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary/80 to-primary transition-transform duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ left: `${progress}%` }}
      />
    </div>
    <span className="text-xs text-foreground/80 w-12">{formatTime(duration)}</span>
  </div>
);

const VolumeControl = ({ volume, isMuted, onVolumeChange, onToggleMute }) => (
  <div className="flex items-center space-x-2">
    <button
      onClick={onToggleMute}
      className="p-2 text-foreground hover:bg-foreground/10 rounded-full transition-colors"
    >
      {!isMuted ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </button>
    <div className="w-24 group relative">
      <input
        type="range"
        className="w-full h-1 bg-foreground/20 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 transition-opacity"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={onVolumeChange}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-primary rounded-full pointer-events-none"
        style={{ width: `${volume * 100}%` }}
      />
    </div>
  </div>
);

const TrackInfo = ({ playerData, onToggleLike, isLiking }) => {
  const track = playerData?.track
  const isLiked = Boolean(track?.like_id || track?.liked_by_current_user)

  return (
    <div className="flex items-center space-x-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative group"
      >
        {track?.artwork_url ? (
          <img
            alt={I18n.t("audio_player.cover_art_alt", { title: track.title })}
            className="w-14 h-14 rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-300"
            src={track.artwork_url}
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
            <Music2 className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
      </motion.div>

      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col md:w-auto w-[100px] min-w-0">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-medium text-sm text-foreground group overflow-hidden"
          >
            <Link
              to={track?.url}
              className="text-foreground hover:text-primary transition-colors whitespace-nowrap w-[200px] block overflow-hidden hover:overflow-visible"
              style={{
                animation: track?.title?.length > 24 ? 'marquee 10s linear infinite' : 'none'
              }}
              data-turbo-frame="_top"
            >
              {track?.title}
            </Link>
          </motion.div>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-xs text-muted-foreground"
          >
            <Link
              to={track?.user_url}
              className="hover:text-foreground transition-colors"
              data-turbo-frame="_top"
            >
              {track?.user_username}
            </Link>
          </motion.div>
        </div>

        {track?.id && (
          <button
            type="button"
            onClick={onToggleLike}
            disabled={isLiking}
            aria-label={isLiked ? I18n.t("audio_player.unlike") : I18n.t("audio_player.like")}
            title={isLiked ? I18n.t("audio_player.unlike") : I18n.t("audio_player.like")}
            className={cn(
              "shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
              isLiked
                ? "border-rose-500/30 bg-rose-500/10 text-rose-500"
                : "border-border bg-background/60 text-muted-foreground hover:bg-accent hover:text-foreground",
              isLiking && "cursor-wait opacity-70"
            )}
          >
            <Heart className={cn("h-4 w-4", isLiked && "fill-current")} />
          </button>
        )}
      </div>
    </div>
  )
};

const PlaybackControls = ({ onPrevious, onPlayPause, onNext, isPlaying }) => (
  <div className="flex items-center justify-center space-x-4 text-foreground">
    <button
      onClick={onPrevious}
      className="p-2 hover:bg-foreground/10 rounded-full transition-colors"
    >
      <SkipBack size={20} />
    </button>

    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onPlayPause}
      className="p-3 rounded-full bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
    >
      {!isPlaying ? <Play size={22} /> : <Pause size={22} />}
    </motion.button>

    <button
      onClick={onNext}
      className="p-2 hover:bg-foreground/10 rounded-full transition-colors"
    >
      <SkipForward size={20} />
    </button>
  </div>
);

export default function AudioPlayer({ id }) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(window.store?.getState()?.volume || 1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasHalfwayEventFired, setHasHalfwayEventFired] = useState(false);
  const debounceTimeoutRef = useRef(null);
  const { isPending: isLiking, toggleLike } = useTrackLikeAction()
  const {
    currentTrackId,
    currentTrackMeta,
    isPlaying,
    playNext,
    playPrevious,
    setCurrentTrackMeta,
  } = useAudioStore();
  const [playerData, setPlayerData] = useState(null);
  const activeTrackId = currentTrackId ?? id;

  const patchCurrentTrack = (patch) => {
    setPlayerData((previousData) => {
      if (!previousData?.track) return previousData

      return {
        ...previousData,
        track: {
          ...previousData.track,
          ...patch,
        },
      }
    })

    useAudioStore.setState((state) => {
      if (!state.currentTrackMeta) return state

      return {
        currentTrackMeta: {
          ...state.currentTrackMeta,
          ...patch,
        },
      }
    })
  }

  useEffect(() => {
    const fetchAndPlayTrack = async () => {
      if (!activeTrackId) {
        setPlayerData(null);
        setCurrentTrackMeta(null);
        return;
      }

      try {
        const response = await get(`/player.json?id=${activeTrackId}`, {
          responseKind: "json"
        });

        if (response.ok) {
          const data = await response.json;
          setPlayerData(data);
          setCurrentTrackMeta(data.track || null);
          useAudioStore.setState({ isPlaying: true });
        }
      } catch (error) {
        console.error('Error loading track:', error);
      }
    };

    fetchAndPlayTrack();
  }, [activeTrackId, setCurrentTrackMeta]);

  const handleToggleLike = async () => {
    await toggleLike({
      track: playerData?.track,
      onPatch: patchCurrentTrack,
    })
  }

  useEffect(() => {
    if (isPlaying) {
      setTimeout(() => {
        playAudio();
      }, 100);
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      const nextCurrentTime = audio.currentTime || 0;
      const nextDuration = audio.duration || 0;
      const percent = nextDuration > 0 ? (nextCurrentTime / nextDuration) * 100 : 0;

      setCurrentTime(nextCurrentTime);
      useAudioStore.setState({ currentTime: nextCurrentTime });
      checkHalfwayEvent(percent);
      dispatchAudioProgressEvent(nextCurrentTime, percent);
    };

    const handleLoadedMetadata = () => {
      const nextDuration = audio.duration || 0;
      setDuration(nextDuration);
      useAudioStore.setState({ duration: nextDuration });
    };

    const handleLoadedData = () => {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            useAudioStore.setState({ isPlaying: true });
          })
          .catch((error) => {
            console.error("Playback failed:", error);
            useAudioStore.setState({ isPlaying: false });
          });
      }
    };

    const handleEnded = () => {
      setHasHalfwayEventFired(false);
      handleNextSong();
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [activeTrackId]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const checkHalfwayEvent = (percent) => {
    if (percent >= 30 && !hasHalfwayEventFired) {
      console.log("Setting halfway event");
      setHasHalfwayEventFired(true);
    }
  };

  useEffect(() => {
    if (hasHalfwayEventFired && activeTrackId) {
      console.log("Tracking event after state update");
      trackEvent(activeTrackId);
    }
  }, [hasHalfwayEventFired, activeTrackId]);

  const trackEvent = async (trackId) => {
    try {
      const response = await get(`/tracks/${trackId}/events`);
      const data = await response.json;
      console.log("Event tracked:", data);
    } catch (error) {
      console.error("Error tracking event:", error);
    }
  };

  const dispatchAudioProgressEvent = (currentTime, percent) => {
    if (!activeTrackId) return;

    const ev = new CustomEvent(`audio-process-${activeTrackId}`, {
      detail: {
        position: currentTime,
        percent: parseFloat(percent.toFixed(2)) / 100
      }
    });
    document.dispatchEvent(ev);
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !activeTrackId) return;

    if (audioRef.current.paused) {
      useAudioStore.setState({ currentTrackId: activeTrackId, isPlaying: true });
    } else {
      useAudioStore.setState({ isPlaying: false });
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    if (!audioRef.current) return;

    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    window.store?.setState({ volume: newVolume });
    setIsMuted(newVolume === 0);
  };

  const handleToggleMute = () => {
    if (!audioRef.current) return;

    if (audioRef.current.volume > 0) {
      audioRef.current.volume = 0;
      setVolume(0);
      setIsMuted(true);
      window.store?.setState({ volume: 0 });
    } else {
      audioRef.current.volume = 1;
      setVolume(1);
      setIsMuted(false);
      window.store?.setState({ volume: 1 });
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const rawPercent = (e.clientX - rect.left) / rect.width;
    const percent = Math.min(Math.max(rawPercent, 0), 1);
    audioRef.current.currentTime = percent * audioRef.current.duration;
  };

  const updateSeek = (event) => {
    const { position } = event.detail;
    if (position !== undefined && !isNaN(position) && audioRef.current) {
      audioRef.current.currentTime = position;
      setCurrentTime(position);
      useAudioStore.setState({ currentTime: position });
    }
  };

  useEffect(() => {
    if (!activeTrackId) return;

    const eventName = `audio-process-mouseup-${activeTrackId}`;
    document.addEventListener(eventName, updateSeek);

    return () => {
      document.removeEventListener(eventName, updateSeek);
    };
  }, [activeTrackId]);

  const stopAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    useAudioStore.setState({ isPlaying: false });
  };

  const playAudio = async () => {
    if (!audioRef.current) return;

    try {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
        useAudioStore.setState({ isPlaying: true });
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      useAudioStore.setState({ isPlaying: false });
    }
  };

  const handleNextSong = () => {
    debounce(() => {
      stopAudio();
      setHasHalfwayEventFired(false);
      playNext();
    }, 200);
  };

  const handlePrevSong = () => {
    debounce(() => {
      stopAudio();
      setHasHalfwayEventFired(false);
      playPrevious();
    }, 200);
  };

  const debounce = (func, delay) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(func, delay);
  };

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    const mediaSession = navigator.mediaSession;

    if (!currentTrackMeta || typeof MediaMetadata === "undefined") {
      mediaSession.metadata = null;
      mediaSession.playbackState = "none";
      return;
    }

    const artwork = [
      currentTrackMeta.artwork_urls?.small && { src: currentTrackMeta.artwork_urls.small, sizes: "96x96" },
      currentTrackMeta.artwork_urls?.medium && { src: currentTrackMeta.artwork_urls.medium, sizes: "256x256" },
      currentTrackMeta.artwork_urls?.large && { src: currentTrackMeta.artwork_urls.large, sizes: "512x512" },
      currentTrackMeta.artwork_urls?.original && { src: currentTrackMeta.artwork_urls.original, sizes: "1024x1024" },
    ].filter(Boolean);

    mediaSession.metadata = new MediaMetadata({
      title: currentTrackMeta.title,
      artist: currentTrackMeta.artist_name || currentTrackMeta.user_username || "",
      album: currentTrackMeta.album_title || "Rauversion",
      artwork,
    });
  }, [currentTrackMeta]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    navigator.mediaSession.playbackState = activeTrackId
      ? (isPlaying ? "playing" : "paused")
      : "none";
  }, [activeTrackId, isPlaying]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    const mediaSession = navigator.mediaSession;
    const setHandler = (action, handler) => {
      try {
        mediaSession.setActionHandler(action, handler);
      } catch (error) {}
    };

    setHandler("play", () => {
      if (!activeTrackId) return;
      useAudioStore.getState().setIsPlaying(true);
    });

    setHandler("pause", () => {
      useAudioStore.getState().pause();
    });

    setHandler("previoustrack", () => {
      handlePrevSong();
    });

    setHandler("nexttrack", () => {
      handleNextSong();
    });

    setHandler("seekto", (details) => {
      if (!audioRef.current || typeof details.seekTime !== "number") return;

      audioRef.current.currentTime = details.seekTime;
      setCurrentTime(details.seekTime);
      useAudioStore.setState({ currentTime: details.seekTime });
    });

    setHandler("seekbackward", (details) => {
      if (!audioRef.current) return;

      const offset = details?.seekOffset || 10;
      const nextTime = Math.max((audioRef.current.currentTime || 0) - offset, 0);
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
      useAudioStore.setState({ currentTime: nextTime });
    });

    setHandler("seekforward", (details) => {
      if (!audioRef.current) return;

      const offset = details?.seekOffset || 10;
      const nextTime = Math.min((audioRef.current.currentTime || 0) + offset, duration || audioRef.current.duration || 0);
      audioRef.current.currentTime = nextTime;
      setCurrentTime(nextTime);
      useAudioStore.setState({ currentTime: nextTime });
    });

    return () => {
      ["play", "pause", "previoustrack", "nexttrack", "seekto", "seekbackward", "seekforward"].forEach((action) => {
        try {
          mediaSession.setActionHandler(action, null);
        } catch (error) {}
      });
    };
  }, [activeTrackId, duration]);

  useEffect(() => {
    if (
      typeof navigator === "undefined" ||
      !("mediaSession" in navigator) ||
      typeof navigator.mediaSession.setPositionState !== "function" ||
      !duration
    ) {
      return;
    }

    try {
      navigator.mediaSession.setPositionState({
        duration,
        playbackRate: audioRef.current?.playbackRate || 1,
        position: Math.min(currentTime, duration),
      });
    } catch (error) {}
  }, [currentTime, duration, currentTrackMeta?.id]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "fixed bottom-0 w-full z-50 text-foreground",
        "border-t border-border/60 bg-background/90 backdrop-blur-2xl backdrop-saturate-150",
        "shadow-[0_-8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.45)]",
      )}
    >
      {/* Mobile View */}
      <div className="flex sm:hidden items-center p-3 space-x-3">
        <TrackInfo
          playerData={playerData}
          onToggleLike={handleToggleLike}
          isLiking={isLiking}
        />
        <PlaybackControls
          onPrevious={handlePrevSong}
          onPlayPause={handlePlayPause}
          onNext={handleNextSong}
          isPlaying={isPlaying}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block p-4">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <TrackInfo
              playerData={playerData}
              onToggleLike={handleToggleLike}
              isLiking={isLiking}
            />

            <div className="flex-1 max-w-2xl mx-8">
              <PlaybackControls
                onPrevious={handlePrevSong}
                onPlayPause={handlePlayPause}
                onNext={handleNextSong}
                isPlaying={isPlaying}
              />
            </div>

            <div className="flex items-center space-x-4">
              <VolumeControl
                volume={volume}
                isMuted={isMuted}
                onVolumeChange={handleVolumeChange}
                onToggleMute={handleToggleMute}
              />

              <PlayerQueueSheet triggerClassName="p-2 text-foreground hover:bg-foreground/10 transition-colors" />
            </div>
          </div>

          <ProgressBar
            progress={progress}
            duration={duration}
            currentTime={currentTime}
            onSeek={handleSeek}
            formatTime={formatTime}
          />
        </div>

        <audio
          ref={audioRef}
          src={playerData?.track?.audio_url}
          data-track-id={id}
          id="audioElement"
        />
      </div>
    </motion.div>
  );
}
