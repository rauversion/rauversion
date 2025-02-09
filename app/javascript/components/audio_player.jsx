import React, { useEffect, useRef, useState } from 'react';
import useAudioStore from '../stores/audioStore';
import { get } from '@rails/request.js';
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"
import { 
  List,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music2
} from "lucide-react"
import PlayerSidebar from "./player_sidebar"

const ProgressBar = ({ progress, duration, currentTime, onSeek, formatTime }) => (
  <div className="flex items-center w-full max-w-2xl mx-auto">
    <span className="text-xs text-white/80 w-12 text-right">{formatTime(currentTime)}</span>
    <div className="relative w-full mx-2 group" onClick={onSeek}>
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
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
    <span className="text-xs text-white/80 w-12">{formatTime(duration)}</span>
  </div>
);

const VolumeControl = ({ volume, isMuted, onVolumeChange, onToggleMute }) => (
  <div className="flex items-center space-x-2">
    <button 
      onClick={onToggleMute}
      className="p-2 hover:bg-white/10 rounded-full transition-colors"
    >
      {!isMuted ? <Volume2 size={20} /> : <VolumeX size={20} />}
    </button>
    <div className="w-24 group relative">
      <input
        type="range"
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 transition-opacity"
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

const TrackInfo = ({ playerData }) => (
  <div className="flex items-center space-x-4">
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative group"
    >
      {playerData?.track?.artwork_url ? (
        <img 
          alt={`${playerData.track.title} Cover Art`} 
          className="w-14 h-14 rounded-xl object-cover shadow-lg group-hover:shadow-xl transition-all duration-300"
          src={playerData.track.artwork_url}
        />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center">
          <Music2 className="w-6 h-6 text-white/40" />
        </div>
      )}
      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
    </motion.div>
    
    <div className="flex flex-col">
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-medium text-sm group overflow-hidden"
      >
        <a 
          href={playerData?.track?.url}
          className="hover:text-primary transition-colors whitespace-nowrap w-[200px] block overflow-hidden hover:overflow-visible"
          style={{
            animation: playerData?.track?.title?.length > 24 ? 'marquee 10s linear infinite' : 'none'
          }}
          data-turbo-frame="_top"
        >
          {playerData?.track?.title}
        </a>
      </motion.div>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-xs text-white/60"
      >
        <a 
          href={playerData?.track?.user_url}
          className="hover:text-white/80 transition-colors"
          data-turbo-frame="_top"
        >
          {playerData?.track?.user_username}
        </a>
      </motion.div>
    </div>
  </div>
);

const PlaybackControls = ({ onPrevious, onPlayPause, onNext, isPlaying }) => (
  <div className="flex items-center justify-center space-x-4">
    <button 
      onClick={onPrevious}
      className="p-2 hover:bg-white/10 rounded-full transition-colors"
    >
      <SkipBack size={20} />
    </button>
    
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onPlayPause}
      className="p-3 bg-default hover:bg-default/90 rounded-full transition-colors"
    >
      {!isPlaying ? <Play size={22} /> : <Pause size={22} />}
    </motion.button>
    
    <button 
      onClick={onNext}
      className="p-2 hover:bg-white/10 rounded-full transition-colors"
    >
      <SkipForward size={20} />
    </button>
  </div>
);

export default function AudioPlayer({ id, url, peaks, height }) {
  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(window.store?.getState()?.volume || 1);
  const [isMuted, setIsMuted] = useState(false);
  const [hasHalfwayEventFired, setHasHalfwayEventFired] = useState(false);
  const debounceTimeoutRef = useRef(null);
  const { currentTrackId, isPlaying, playNext, playPrevious } = useAudioStore();
  const [playerData, setPlayerData] = useState(null);

  useEffect(() => {
    const fetchAndPlayTrack = async () => {
      if (!currentTrackId) return;
      
      try {
        const response = await get(`/player.json?id=${currentTrackId}`, {
          responseKind: "json"
        });
        
        if(response.ok) {
          const data = await response.json;
          setPlayerData(data);
          useAudioStore.setState({ isPlaying: true});
        }
      } catch (error) {
        console.error('Error loading track:', error);
      }
    };

    fetchAndPlayTrack();
  }, [currentTrackId]);

  useEffect(() => {
    if(isPlaying) {
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
      setCurrentTime(audio.currentTime);
      const percent = (audio.currentTime / audio.duration) * 100;
      checkHalfwayEvent(percent);
      dispatchAudioProgressEvent(audio.currentTime, percent);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
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

    document.addEventListener(`audio-process-mouseup-${id}`, updateSeek);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("ended", handleEnded);
      document.removeEventListener(`audio-process-mouseup-${id}`, updateSeek);
    };
  }, [id]);

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
    if (hasHalfwayEventFired && currentTrackId) {
      console.log("Tracking event after state update");
      trackEvent(currentTrackId);
    }
  }, [hasHalfwayEventFired, currentTrackId]);

  const trackEvent = async (trackId) => {
    try {
      const response = await fetch(`/tracks/${trackId}/events`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content
        },
      });
      const data = await response.json;
      console.log("Event tracked:", data);
    } catch (error) {
      console.error("Error tracking event:", error);
    }
  };

  const dispatchAudioProgressEvent = (currentTime, percent) => {
    const ev = new CustomEvent(`audio-process-${id}`, {
      detail: {
        position: currentTime,
        percent: parseFloat(percent.toFixed(2))/100
      }
    });
    document.dispatchEvent(ev);
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (audioRef.current.paused) {
      useAudioStore.setState({ currentTrackId: currentTrackId, isPlaying: true });
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
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * audioRef.current.duration;
  };

  const updateSeek = (event) => {
    const { position } = event.detail;
    if (position !== undefined && !isNaN(position) && audioRef.current) {
      audioRef.current.currentTime = position;
    }
  };

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

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "fixed bottom-0 w-full z-50",
        "before:absolute before:inset-0 before:backdrop-blur-2xl before:backdrop-saturate-200 before:bg-black/30 before:-z-10",
        "border-t border-white/5",
      )}
    >
      {/* Mobile View */}
      <div className="flex sm:hidden items-center p-3 space-x-3">
        <TrackInfo playerData={playerData} />
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
            <TrackInfo playerData={playerData} />
            
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

              <Sheet>
                <SheetTrigger asChild>
                  <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                    <List size={20} />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-default">
                  <SheetHeader>
                    <SheetTitle>Queue</SheetTitle>
                    <SheetDescription>Your current playlist queue</SheetDescription>
                  </SheetHeader>
                  <div className="h-[calc(100vh-120px)]">
                    <PlayerSidebar />
                  </div>
                </SheetContent>
              </Sheet>
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
