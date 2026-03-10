import React from "react";
import useAudioStore from "../stores/audioStore";
import { ScrollArea } from "./ui/scroll-area";
import { Play, Pause, X, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import usePlayerQueueTracks from "@/hooks/usePlayerQueueTracks";

const PlayerSidebar = () => {
  const { tracks, loading } = usePlayerQueueTracks();
  const { currentTrackId, isPlaying, play } = useAudioStore();

  const removeTrack = (trackId) => {
    const { playlist } = useAudioStore.getState();
    const newPlaylist = playlist.filter(id => id !== trackId);
    useAudioStore.setState({ playlist: newPlaylist });
  };

  const clearPlaylist = () => {
    useAudioStore.setState({ playlist: [] });
  };

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        Loading queue...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      <div className="p-4 border-b border-border/70 bg-muted/30 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Queue</h2>
        {tracks.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearPlaylist}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {tracks.length === 0 && (
            <div className="p-4 text-sm text-muted-foreground">
              Queue is empty.
            </div>
          )}

          {tracks.map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-2 px-2 py-1 hover:bg-accent/70 rounded-lg group cursor-pointer transition-colors"
            >
              <button
                onClick={() => play(track.id)}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <div className="w-10 h-10 relative group">
                  <img
                    src={track.cover_url.small}
                    alt={track.title}
                    className="w-full h-full object-cover rounded"
                  />
                  <div className={`absolute inset-0 flex items-center justify-center bg-black/40 ${
                    `${currentTrackId}` === `${track.id}` ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  } transition-opacity`}>
                    {`${currentTrackId}` === `${track.id}` && isPlaying ? (
                      <Pause size={20} className="text-white" />
                    ) : (
                      <Play size={20} className="text-white" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className={`truncate text-sm font-medium ${
                    `${currentTrackId}` === `${track.id}` ? 'text-primary' : 'text-foreground'
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
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
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
