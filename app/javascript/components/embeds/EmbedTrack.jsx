import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { get } from "@rails/request.js";
import TrackItem from "../users/TrackItem";
import useAudioStore from '@/stores/audioStore';
import { useAudioPlaying } from '@/hooks/useAudioPlaying';

export default function EmbedTrack() {
  const { id } = useParams();
  const [track, setTrack] = useState(null);
  const [loading, setLoading] = useState(true);

  const isPlaying = useAudioPlaying();
  const { currentTrackId } = useAudioStore();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    get(`/tracks/${id}.json`)
      .then((response) => response.json)
      .then((data) => {
        if (isMounted) {
          setTrack(data.track || data);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Play/pause logic using global audio store (like TrackShow)
  const handlePlay = (trackId) => {
    if (currentTrackId === `${trackId}` && isPlaying) {
      useAudioStore.setState({ isPlaying: false });
    } else {
      useAudioStore.setState({ currentTrackId: trackId + "", isPlaying: true });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-muted-foreground">Loading...</span>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-red-500">Track not found.</span>
      </div>
    );
  }

  return (
    <div className="bg-default rounded shadow p-6 w-full max-w-xl">
      <TrackItem
        track={track}
        currentTrackId={track.id}
        isPlaying={isPlaying && currentTrackId === `${track.id}`}
        onPlay={handlePlay}
        embed={true}
        host={window.location.origin}
      />
    </div>
  );
}
