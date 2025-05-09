import React, { useEffect, useState, useRef } from "react";
import { Play, Pause, MoreHorizontal } from 'lucide-react';

interface Track {
  id: number;
  title: string;
  description: string;
  duration: number;
  audio_url: string;
  cover_url: string;
  position: number;
  author: User;
}

interface User {
  id: number;
  username: string;
  full_name: string;
  avatar_url: string;
}

interface PlaylistMetadata {
  buy_link: string;
  buy_link_title: string;
  buy: boolean;
  record_label: string;
}

interface Playlist {
  id: number;
  title: string;
  slug: string;
  url: string;
  description: string;
  playlist_type: string;
  private: boolean;
  // metadata: PlaylistMetadata;
  buy: boolean;
  buy_link: string;
  buy_link_title: string;
  created_at: string;
  updated_at: string;
  user: User;
  label?: User;
  cover_url: string;
  tracks: Track[];
  likes_count: number;
  comments_count: number;
  author: User;
}

interface PlaylistProps {
  playlistId: string | number;
}

export default function PlaylistComponent({ playlistId }: PlaylistProps) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!playlistId) {
        setPlaylist(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/playlists/${playlistId}.json`);
        if (!response.ok) {
          throw new Error('Failed to fetch playlist');
        }
        const data = await response.json();
        setPlaylist(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [playlistId]);

  useEffect(() => {
    if (playlist && currentTrackIndex >= 0) {
      const track = playlist.tracks[currentTrackIndex];
      if (audioRef.current && track.audio_url) {
        audioRef.current.src = track.audio_url;
        if (isPlaying) {
          audioRef.current.play();
        }
      }
    }
  }, [currentTrackIndex, playlist, isPlaying]);

  const handleTrackPlay = (index: number) => {
    if (currentTrackIndex === index) {
      togglePlayPause();
    } else {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (loading) return <div className="text-muted-foreground">Loading...</div>;
  if (error) return <div className="text-destructive">Error: {error}</div>;
  if (!playlist) return <div className="text-muted-foreground">No playlist found</div>;

  return (
    <div className="h-screen rounded-lg p-4 bg-muted/50">
      <audio ref={audioRef} />
      <div className="flex items-start gap-6">
        {playlist.cover_url && (
          <img 
            src={playlist.cover_url} 
            alt={playlist.title}
            className="w-[160px] h-[160px] rounded-md shadow-lg"
          />
        )}
        
        <div className="flex-1">
          <h2 className="text-foreground font-bold text-3xl mb-2">{playlist.title}</h2>
          <p className="text-muted-foreground mb-4">{playlist.user.full_name}</p>
          <div className="flex items-center gap-4">
            <button 
              onClick={togglePlayPause}
              className="bg-[#1DB954] text-black font-semibold rounded-full p-3 hover:scale-105 transition"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <a href={playlist.url} target="_blank" className="text-xs font-semibold px-4 py-1.5 rounded-full bg-transparent border border-border text-foreground hover:scale-105 transition">
              Listen on Rauversion
            </a>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="space-y-1 h-[calc(100vh-211px)] overflow-y-auto">
          {playlist.tracks.map((track, index) => (
            <div 
              key={track.id}
              className="flex items-center justify-between p-2 rounded hover:bg-muted group"
            >
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground w-6">{index + 1}</span>
                
                <button 
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground transition"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTrackPlay(index);
                  }}
                >
                  {currentTrackIndex === index && isPlaying ? 
                    <Pause size={20} /> : 
                    <Play size={20} />
                  }
                </button>

                <div>
                  <p className="text-foreground font-medium">{track.title}</p>
                  <p className="text-muted-foreground text-sm">{track.author.full_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">{track.duration}</span>

              </div>
            </div>
          ))}
        </div>
      </div>

      {playlist.buy && (
        <div className="mt-6 text-center">
          <a 
            href={playlist.buy_link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-4 py-1.5 rounded-full bg-transparent border border-border text-foreground hover:scale-105 transition"
          >
            {playlist.buy_link_title || 'Buy Now'}
          </a>
        </div>
      )}
    </div>
  );
}
