import React from "react";
import { useParams, Link } from "react-router-dom";
import useAudioStore from "../../stores/audioStore";
import { Play, Pause, Lock } from "lucide-react";
import MusicPurchase from "../shared/MusicPurchase";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import PlaylistListItem from "./PlaylistItem";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function PlaylistCard({
  playlist,
  index,
  isLast,
  lastElementRef,
  currentTrackId,
  isPlaying,
  handlePlayTrack,
  handlePlayPlaylist,
}) {
  const cardRef = isLast ? lastElementRef : null;

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={cn(
        "my-4 p-4 rounded-xl",
        "bg-white/5 backdrop-blur-sm",
        "shadow-lg shadow-black/5",
        "transition-all duration-300",
        "hover:bg-white/10 hover:shadow-xl hover:shadow-black/10",
        "sm:mx-4 mx-2"
      )}
    >
      <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
        <motion.div
          className="w-48 h-48 flex-shrink-0 relative group rounded-lg overflow-hidden sm:sticky top-4"
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <img
            src={playlist.cover_url.cropped_image}
            alt={playlist.title}
            className="w-full h-full object-center object-cover transition-opacity duration-300 group-hover:opacity-75"
          />
          <motion.button
            onClick={() => handlePlayPlaylist(playlist)}
            className={cn(
              "absolute inset-0 flex items-center justify-center",
              "bg-black/50 transition-all duration-300",
              "opacity-0 group-hover:opacity-100"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying &&
              playlist.tracks?.some((track) => track.id === currentTrackId) ? (
              <Pause className="w-16 h-16 text-white" />
            ) : (
              <Play className="w-16 h-16 text-white" />
            )}
          </motion.button>
        </motion.div>

        <div className="flex-grow min-w-0">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-xl font-bold tracking-tight text-default line-clamp-1">
                  <Link
                    to={`/playlists/${playlist.slug}`}
                    className="hover:text-brand-500 transition-colors"
                  >
                    {playlist.title}
                  </Link>
                </h3>

                {playlist.playlist_type === "album" &&
                  playlist.release_date && (
                    <span className="text-sm text-zinc-400 font-medium">
                      Album •{" "}
                      {new Date(playlist.release_date).toLocaleDateString(
                        undefined,
                        { month: "long", year: "numeric" }
                      )}
                    </span>
                  )}
              </div>

              <div className="flex items-center gap-2 flex-wrap sm:justify-start justify-center">
                <motion.button
                  onClick={() => handlePlayPlaylist(playlist)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "inline-flex items-center px-4 py-2",
                    "text-sm font-medium rounded-full",
                    "bg-brand-500 text-white",
                    "transition-all duration-300",
                    "hover:bg-brand-400 hover:shadow-lg hover:shadow-brand-500/25",
                    "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-background"
                  )}
                >
                  {isPlaying &&
                    playlist.tracks?.some(
                      (track) => track.id === currentTrackId
                    ) ? (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Play
                    </>
                  )}
                </motion.button>

                {playlist.private && (
                  <div className="bg-brand-500/10 text-brand-500 text-sm px-3 py-1 rounded-full inline-flex items-center gap-1">
                    <Lock size={14} />
                    <span>Private</span>
                  </div>
                )}
              </div>
            </div>

            {playlist.description && (
              <p className="text-zinc-400 text-sm line-clamp-2">
                {playlist.description}
              </p>
            )}

            <p className="text-zinc-400 text-sm font-medium">
              {playlist.tracks_count} tracks
            </p>

            <div className="bg-black/20 rounded-xl p-4 space-y-1">
              {playlist.tracks?.map((track, index) => (
                <PlaylistListItem
                  key={track.id}
                  track={track}
                  index={index}
                  currentTrackId={currentTrackId}
                  isPlaying={isPlaying}
                  onPlay={() => handlePlayTrack(track, playlist)}
                />
              ))}
              <div className="mt-4 flex justify-end">
                <MusicPurchase
                  resource={playlist}
                  type="Playlist"
                  variant="mini"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function UserPlaylists({ namespace = "playlists" }) {
  const { username } = useParams();
  const { currentTrackId, isPlaying, play, pause, setPlaylist } =
    useAudioStore();

  const {
    items: playlists,
    loading,
    lastElementRef,
  } = useInfiniteScroll(`/${username}/${namespace}.json`);

  const handlePlayTrack = (track, playlist) => {
    if (currentTrackId === track.id) {
      if (isPlaying) {
        pause();
      } else {
        play(track.id);
      }
    } else {
      setPlaylist(playlist.tracks);
      play(track.id);
    }
  };

  const handlePlayPlaylist = (playlist) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      setPlaylist(playlist.tracks);
      play(playlist.tracks[0].id);
    }
  };

  return (
    <div className="pb-8">
      {playlists.map((playlist, index) => (
        <PlaylistCard
          key={playlist.id}
          playlist={playlist}
          index={index}
          isLast={playlists.length === index + 1}
          lastElementRef={lastElementRef}
          currentTrackId={currentTrackId}
          isPlaying={isPlaying}
          handlePlayTrack={handlePlayTrack}
          handlePlayPlaylist={handlePlayPlaylist}
        />
      ))}

      {loading && (
        <motion.div
          className="flex justify-center p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-brand-500 border-t-transparent"></div>
        </motion.div>
      )}

      {playlists.length === 0 && !loading && (
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-zinc-400 text-lg">No {namespace} found</p>
        </motion.div>
      )}
    </div>
  );
}
