import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { get } from "@rails/request.js";
import { PlaylistCard } from "../users/Playlists";
import useAudioStore from "../../stores/audioStore";

export default function EmbedPlaylist() {
  const { id } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  const { currentTrackId, isPlaying, play, pause, setPlaylist: setAudioPlaylist } = useAudioStore();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    get(`/playlists/${id}.json`)
      .then((response) => response.json)
      .then((data) => {
        if (isMounted) {
          setPlaylist(data.playlist || data);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handlePlayTrack = (track, playlistObj) => {
    if (currentTrackId === track.id) {
      if (isPlaying) {
        pause();
      } else {
        play(track.id);
        const tracks = playlistObj?.tracks.map(t => t.id + "") || [];
        useAudioStore.setState({ playlist: tracks });
      }
    } else {
      setAudioPlaylist(playlistObj.tracks);
      play(track.id);
      const tracks = playlistObj?.tracks.map(t => t.id + "") || [];
      useAudioStore.setState({ playlist: tracks });
    }
  };

  const handlePlayPlaylist = (playlistObj) => {
    if (isPlaying) {
      pause();
    } else {
      if (playlistObj.tracks && playlistObj.tracks.length > 0) {
        setAudioPlaylist(playlistObj.tracks);
        const tracks = playlistObj?.tracks.map(t => t.id + "") || [];
        useAudioStore.setState({ playlist: tracks });
        play(playlistObj.tracks[0].id);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-gray-500">Loading...</span>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-red-500">Playlist not found.</span>
      </div>
    );
  }

  return (
    <>
      <PlaylistCard
        embed={true}
        host={window.location.origin}
        playlist={playlist}
        currentTrackId={currentTrackId}
        isPlaying={isPlaying}
        handlePlayTrack={handlePlayTrack}
        handlePlayPlaylist={handlePlayPlaylist}
      />
    </>
  );
}
