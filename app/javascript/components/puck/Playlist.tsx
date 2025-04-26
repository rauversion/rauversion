import React, { useEffect, useState, useRef } from "react";
import { Play, Pause, MoreHorizontal } from 'lucide-react';
import useAudioStore from '../../stores/audioStore';
import ColorPicker from './ColorPicker';
import PlaylistSelector from './PlaylistSelectorSingle';
import { get } from '@rails/request.js';

interface Track {
  id: number;
  title: string;
  slug: string;
  description: string;
  duration: string;
  audio_url: string;
  cover_url: string;
  position: number;
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
  cover_url: object;
  tracks: Track[];
  likes_count: number;
  comments_count: number;
}

interface PlaylistProps {
  playlistId: string | number;
  accentColor?: string;
}

export default function PlaylistComponent({ playlistId, accentColor = "#1DB954" }: PlaylistProps) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Subscribe to audio store state
  const { currentTrackId, isPlaying } = useAudioStore();

  const audioElement = document.getElementById("audioElement") as HTMLAudioElement

  const audioPlaying = (): boolean => {
    return audioElement && !audioElement.paused;
  };

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
        if(data.error){
          throw new Error(data.error);
        }
        setPlaylist(data.playlist);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [playlistId]);

  useEffect(() => {
    if (playlist && playlist.tracks && currentTrackId) {
      const index = playlist.tracks.findIndex(track => track.id === currentTrackId);
      if (index !== -1) {
        setCurrentTrackIndex(index);
      }
    }
  }, [currentTrackId, playlist]);

  const setTracksToStore = (startIndex = 0) => {
    const tracks = playlist?.tracks.slice(startIndex).map(t => t.id + "") || [];
    useAudioStore.setState({ playlist: tracks });
  };


  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!playlist) return <div>No playlist found</div>;
  if (!playlist.user) return <div>No playlist user found</div>;

  return (
    <>{
      playlist && (
        <div className="rounded-lg p-4">
     
        <div className="flex items-start gap-6">
          {playlist.cover_url && (
            <img 
              src={playlist.cover_url.medium} 
              alt={playlist.title}
              className="w-[160px] h-[160px] rounded-md shadow-lg"
            />
          )}
          
          <div className="flex-1">
            <h2 className="text-default font-bold text-3xl mb-2">{playlist.title}</h2>
            <p className="text-default/80 mb-4">{playlist.user.full_name}</p>
            <div className="flex items-center gap-4">
              <a 
                // href={playlist.tracks[0] ? `/player?id=${playlist.tracks[0].slug}&t=true` : ''}
                // data-action="track-detector#addGroup" 
                onClick={(e) => {
                  if(audioPlaying()) {
                    //audioElement.pause();
                    useAudioStore.setState({ isPlaying: false });
                    e.preventDefault();
                  } else {
                    setTracksToStore(0);
                    useAudioStore.setState({ currentTrackId: playlist.tracks[0].id + "", isPlaying: true });
                  }
                }}
                //style={{ backgroundColor: accentColor }}
                className={`bg-black/10 cursor-pointer text-black font-semibold rounded-full p-3 hover:scale-105 transition`}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </a>
              {/*<a href={playlist.url} target="_blank" className="text-xs font-semibold px-4 py-1.5 rounded-full bg-transparent border border-white text-white hover:scale-105 transition">
                Listen on Rauversion
              </a>*/}
            </div>
          </div>
        </div>
  
        <div className="mt-8">
          <div className="space-y-1 bg-black/30 p-4 rounded-lg">
            {playlist.tracks && playlist.tracks.map((track, index) => (
              <div 
                key={`${track.id}-${index}`}
                className={`flex items-center justify-between p-2 rounded hover:bg-white hover:bg-opacity-10 group ${
                  currentTrackId === track.id ? 'bg-white bg-opacity-20' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`w-6 ${currentTrackId === track.id ? `text-[${accentColor}]` : 'text-white'}`}>
                    {index + 1}
                  </span>
                  
                  <a 
                    onClick={async (e) => {
                      e.preventDefault();
                      
                      if(audioPlaying()) {
                        audioElement.pause();
                        useAudioStore.setState({ currentTrackId: track.id + "", isPlaying: false });
                      } else {
                        useAudioStore.setState({ currentTrackId: track.id + "", isPlaying: true });
                      }

                      // Set the track in the store
                    }}
                    className="cursor-pointer"
                  >
                    {currentTrackId === track.id + "" && isPlaying ? 
                      <Pause size={20} /> : 
                      <Play size={20} />
                    }
                  </a>
  
                  <div>
                    <p className={`font-medium ${
                      currentTrackId === track.id ? `text-[${accentColor}]` : 'text-white'
                    }`}>
                      {track.title}
                    </p>
                    <p className="text-default text-sm">{track.user.full_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {
                    track.duration !== "xx;xx" && (
                      <span className="text-default text-sm">
                        {track.duration}
                      </span>
                    )
                  }
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
              className="text-xs font-semibold px-4 py-1.5 rounded-full bg-transparent border border-white text-white hover:scale-105 transition"
            >
              {playlist.buy_link_title || 'Buy Now'}
            </a>
          </div>
        )}
      </div>
      )
    }
    </>
  );
}

export const config = {
  fields: {
    playlistId: {
      type: "custom",
      render: PlaylistSelector,
      label: "Select Playlists"
    },
    accentColor: {
      type: "custom",
      label: "Accent Color",
      render: ColorPicker,
    }
  },
  defaultProps: {
    playlistId: "",
    accentColor: "#1DB954"
  },
}
