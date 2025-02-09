import React, { useEffect, useRef, useState } from 'react';
import useAudioStore from '../stores/audioStore';
import { get } from '@rails/request.js';

import PlayerSidebar from "./player_sidebar"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet"
import { List } from "lucide-react"

export default function AudioPlayer({ id, url, peaks, height }) {
  const audioRef = useRef(null);
  //const [isPlaying, setIsPlaying] = useState(false);
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
          // Wait a bit for the audio source to be updated
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
      audioRef.current.pause();
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
      setHasHalfwayEventFired(true);
      const trackId = currentTrackId
      if(trackId) trackEvent(trackId);
    }
  };

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
      // audioRef.current.play();
      useAudioStore.setState({ currentTrackId: currentTrackId, isPlaying: true });
    } else {
      // audioRef.current.pause();
      // setIsPlaying(false);
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

  const getNextTrackIndex = () => {
    const { playlist, currentTrackId } = useAudioStore.getState();
    const currentIndex = playlist.indexOf(currentTrackId + "");
    
    if (currentIndex === -1 || currentIndex === playlist.length - 1) return playlist[0];
    return playlist[currentIndex + 1];

  };

  const getPreviousTrackIndex = () => {
    const { playlist, currentTrackId } = useAudioStore.getState();
    const currentIndex = playlist.indexOf(currentTrackId + "");
    

    if (currentIndex <= 0) return null;
    
    return playlist[currentIndex - 1];
  };

  const debounce = (func, delay) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(func, delay);
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
        // setIsPlaying(true);
        useAudioStore.setState({ isPlaying: true });
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      // setIsPlaying(false);
      useAudioStore.setState({ isPlaying: false });
    }
  };

  const handleNextSong = () => {
    debounce(async () => {
      stopAudio();
      setHasHalfwayEventFired(false);

      playNext()
      /*const nextTrack = getNextTrackIndex();

      const nextTrackId = nextTrack
      if (nextTrackId) {
        useAudioStore.setState({ currentTrackId: nextTrackId });
      } else {
        console.log("No more songs in queue");
      }*/
    }, 200);
  };

  const handlePrevSong = () => {
    debounce(async () => {
      stopAudio();
      setHasHalfwayEventFired(false);

      playPrevious()
      /*const prevTrack = getPreviousTrackIndex();
      const prevTrackId = prevTrack?.id;
      if (prevTrackId) {
        useAudioStore.setState({ currentTrackId: prevTrackId });
      } else {
        console.log("No previous song in queue");
      }*/
    }, 200);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div id="main-player" className="z-50 fixed bottom-0 w-full h-[6rem]-- py-2 bg-transparent sm:bg-default border-t dark:border-none border-muted-">
      {/* Mobile View */}
      <div className="flex sm:hidden items-center bg-subtle px-2 rounded-lg p-2 shadow-lg w-full- max-w-md- mx-auto- mx-2">
        {/* Album Art */}
        <div className="flex-shrink-0">
          <a data-turbo-frame="_top" href={playerData?.track?.url}>
            {playerData?.track?.artwork_url ? (
              <img 
                alt={`${playerData.track.title} Cover Art`} 
                className="w-12 h-12 rounded-md object-cover" 
                src={playerData.track.artwork_url}
              />
            ) : (
              <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M12 8v8"></path>
                  <path d="M8 12h8"></path>
                </svg>
              </div>
            )}
          </a>
        </div>

        {/* Track Information */}
        <div className="ml-3 flex-grow">
          <div className="font-semibold text-sm w-[212px] truncate" data-controller="marquee">
            <span data-marquee-target="marquee" className="inline-block w-full">
              <a data-turbo-frame="_top" href={playerData?.track?.url}>
                {playerData?.track?.title}
              </a>
            </span>
          </div>

          <div className="text-gray-400 text-xs truncate">
            <a data-turbo-frame="_top" href={playerData?.track?.user_url}>
              {playerData?.track?.user_username}
            </a>
          </div>
        </div>

        {/* Rest of the mobile controls */}
        <div className="flex items-center space-x-2">
          <button className="text-default" onClick={handlePrevSong}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
          </button>
          
          <button className="text-default" onClick={handlePlayPause}>
            {!isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play">
                <polygon points="6 3 20 12 6 21 6 3"></polygon>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pause">
                <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                <rect x="6" y="4" width="4" height="16" rx="1"></rect>
              </svg>
            )}
          </button>

          <button className="text-default" onClick={handleNextSong}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between pt-2 px-2">
          {/* Album Art and Track Info */}
          <div className="flex items-center space-x-2 w-[168px] md:w-auto">
            <a data-turbo-frame="_top" href={playerData?.track?.url}>
              {playerData?.track?.artwork_url ? (
                <img 
                  alt={`${playerData.track.title} Cover Art`} 
                  className="w-12 h-12 rounded-md object-cover" 
                  src={playerData.track.artwork_url}
                />
              ) : (
                <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 8v8"></path>
                    <path d="M8 12h8"></path>
                  </svg>
                </div>
              )}
            </a>
            
            <div className="text-default">
              <div className="font-semibold text-sm w-[129px] truncate marquee-active" data-controller="marquee">
                <span data-marquee-target="marquee" className="inline-block w-full">
                  <a data-turbo-frame="_top" href={playerData?.track?.url}>
                    {playerData?.track?.title}
                  </a>
                </span>
              </div>
              <div className="text-xs text-gray-400 truncate w-48">
                <a data-turbo-frame="_top" href={playerData?.track?.user_url}>
                  {playerData?.track?.user_username}
                </a>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4">
            <button className="text-default hidden sm:block" onClick={handlePrevSong}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
            </button>

            <button className="text-default bg-muted rounded-full p-2" onClick={handlePlayPause}>
              {!isPlaying ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-play">
                  <polygon points="6 3 20 12 6 21 6 3"></polygon>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pause">
                  <rect x="14" y="4" width="4" height="16" rx="1"></rect>
                  <rect x="6" y="4" width="4" height="16" rx="1"></rect>
                </svg>
              )}
            </button>

            <button className="text-default hidden sm:block" onClick={handleNextSong}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right">
                <path d="m9 18 6-6-6-6"></path>
              </svg>
            </button>
          </div>

          {/* Volume and Settings */}
          <div className="items-center space-x-4 hidden sm:flex">
            <div className="text-default cursor-pointer" onClick={handleToggleMute}>
              {!isMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-2">
                  <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"></path>
                  <path d="M16 9a5 5 0 0 1 0 6"></path>
                  <path d="M19.364 18.364a9 9 0 0 0 0-12.728"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-volume-off">
                  <path d="M16 9a5 5 0 0 1 .95 2.293"></path>
                  <path d="M19.364 5.636a9 9 0 0 1 1.889 9.96"></path>
                  <path d="m2 2 20 20"></path>
                  <path d="m7 7-.587.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298V11"></path>
                  <path d="M9.828 4.172A.686.686 0 0 1 11 4.657v.686"></path>
                </svg>
              )}
            </div>

            <input
              type="range"
              className="w-24 h-1 bg-gray-700 rounded-full"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
            />
          </div>

          {/* Queue */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="rounded-full p-2 hover:bg-accent">
                <List className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-default">
              <SheetHeader>
                <SheetTitle>Queue</SheetTitle>
                <SheetDescription>
                  Your current playlist queue
                </SheetDescription>
              </SheetHeader>
              <div className="h-[calc(100vh-120px)]">
                <PlayerSidebar />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Track Progress Bar */}
        <div className="flex items-center space-x-2 mb-2 justify-center">
          <span className="text-default text-xs">{formatTime(currentTime)}</span>
          <div
            className="w-2/4 relative h-1 bg-gray-700 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="absolute top-0 left-0 h-1 bg-green-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-default text-xs">{formatTime(duration)}</span>
        </div>

        {/* Audio Element */}
        <audio
          ref={audioRef}
          src={playerData?.track?.audio_url}
          data-track-id={id}
          id="audioElement"
        />
      </div>
    </div>
  );
}