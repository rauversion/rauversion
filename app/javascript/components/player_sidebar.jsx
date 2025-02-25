import React, { useEffect, useState } from "react";
import useAudioStore from "../stores/audioStore";
import { ScrollArea } from "./ui/scroll-area";
import { Play, Pause, X, Trash2 } from "lucide-react";
import { Button } from "./ui/button";

const PlayerSidebar = () => {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentTrackId, isPlaying, play } = useAudioStore();
  const audioElement = document.getElementById("audioElement");

  const audioPlaying = () => {
    return audioElement && !audioElement.paused;
  };

  const setTracksToStore = (startIndex = 0) => {
    const tracksToPlay = tracks.slice(startIndex).map(t => t.id) || [];
    useAudioStore.setState({ playlist: tracksToPlay });
  };

  const removeTrack = (trackId) => {
    const { playlist } = useAudioStore.getState();
    const newPlaylist = playlist.filter(id => id !== trackId);
    useAudioStore.setState({ playlist: newPlaylist });
  };

  const clearPlaylist = () => {
    useAudioStore.setState({ playlist: [] });
  };

  useEffect(() => {
    const fetchTracks = async () => {
      try {
        const { playlist } = useAudioStore.getState();
        if (!playlist || playlist.length === 0) {
          setTracks([]);
          return;
        }
        
        const queryParams = new URLSearchParams();
        playlist.forEach(id => queryParams.append('ids[]', id));
        
        const response = await fetch(`/player/tracklist.json?${queryParams.toString()}`);
        const data = await response.json();
        setTracks(data.tracks);
      } catch (error) {
        console.error("Error fetching tracks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTracks();
  }, [useAudioStore.getState().playlist]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-semibold">Queue</h2>
        {tracks.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearPlaylist}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="flex items-center gap-2 px-2 py-1 hover:bg-accent rounded-lg group cursor-pointer"
            >
              <button
                // href={`/player?id=${track.slug}&t=true`}
                onClick={()=> play(track.id) }
                className="flex items-center gap-2 flex-1"
              >
                <div className="w-10 h-10 relative group">
                  {/*<img
                    src={track.cover_url}
                    alt={track.title}
                    className="w-full h-full object-cover rounded"
                  />*/}
                  <div className={`absolute inset-0 flex items-center justify-center bg-black/40 ${
                    currentTrackId === track.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  } transition-opacity`}>
                    {currentTrackId === track.id && isPlaying ? (
                      <Pause size={20} className="text-white" />
                    ) : (
                      <Play size={20} className="text-white" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className={`truncate text-sm font-medium ${
                    currentTrackId === track.id ? 'text-primary' : ''
                  }`}>
                    {track.title}
                  </span>
                  <span className="text-xs text-left text-muted-foreground truncate">
                    {track.user.username}
                  </span>
                </div>
              </button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeTrack(track.id)}
                className="opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default PlayerSidebar;