import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { get } from "@rails/request.js";
import useAudioStore from "../../stores/audioStore";
import useAuthStore from "../../stores/authStore";
import { format } from "date-fns";
import { Play, Pause, Settings, Lock, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import PlaylistListItem from "../users/PlaylistItem";
import PlaylistEdit from "./PlaylistEdit";
import PlaylistSkeleton from "./PlaylistSkeleton";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/ui/share-dialog";
import { Comments } from "@/components/comments/Comments";
import MusicPurchase from "@/components/shared/MusicPurchase";
import { ShowMoreText } from "@/components/ui/show_more";
export default function PlaylistShow() {
  const { slug } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const {
    currentTrackId,
    isPlaying,
    audioPlaying,
    play,
    pause,
    setPlaylist: setAudioPlaylist,
    formatTime,
    addMultipleToPlaylist,
  } = useAudioStore();
  const { currentUser } = useAuthStore();
  const fetchPlaylist = async () => {
    try {
      const response = await get(`/playlists/${slug}.json`);
      if (response.ok) {
        const data = await response.json;
        setPlaylist(data.playlist);
        // Set the playlist in the audio store
        setAudioPlaylist(data.playlist.tracks);
      }
    } catch (error) {
      console.error("Error fetching playlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (playlist && playlist.tracks) {
      addMultipleToPlaylist(playlist.tracks);
    }
  }, [playlist]);

  useEffect(() => {
    fetchPlaylist();
  }, [slug, setAudioPlaylist]);

  const handlePlay = () => {
    if (playlist?.tracks?.[0]) {
      play(playlist.tracks[0].id);
    }
  };

  const handleTrackPlay = (trackId) => {
    if (currentTrackId === trackId && isPlaying) {
      pause();
    } else {
      pause();
      play(trackId);
    }
  };

  if (loading || !playlist) {
    return <PlaylistSkeleton />;
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      {/* Header Section */}
      <motion.div
        className="relative bg-gradient-to-b from-muted to-background p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Cover Art */}
            <motion.div
              className="w-full md:w-[340px] flex-shrink-0 relative group"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden shadow-xl">
                <img
                  src={playlist.cover_url.cropped_image}
                  alt={playlist.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 transition-opacity duration-300 group-hover:opacity-100 opacity-0" />
              </div>
            </motion.div>

            {/* Playlist Info */}
            <div className="flex-grow">
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm uppercase text-brand-500 font-medium mb-2">
                      {playlist.playlist_type}
                    </h2>
                    <h1 className="text-4xl font-bold mb-3 tracking-tight">
                      {playlist.title}
                    </h1>
                  </div>

                  {currentUser?.id === playlist.user.id && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="ml-4"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditOpen(true)}
                        className="text-muted-foreground hover:text-foreground hover:bg-white/10"
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-muted-foreground">
                  <Link
                    to={`/${playlist.user.username}`}
                    className="hover:text-foreground transition-colors flex items-center gap-2 group"
                  >
                    <motion.img
                      src={playlist.user.avatar_url?.small}
                      alt={playlist.user.username}
                      className="w-6 h-6 rounded-full ring-2 ring-transparent group-hover:ring-brand-500 transition-all"
                      whileHover={{ scale: 1.1 }}
                    />
                    <span className="group-hover:text-brand-500 transition-colors">
                      {playlist.user.username}
                    </span>
                  </Link>
                  {/* Label info */}
                  {playlist.label && (
                    <>
                      <span className="hidden sm:block text-zinc-600">•</span>
                      <Link
                        to={`/${playlist.label.username}`}
                        className="hover:text-foreground transition-colors flex items-center gap-2 group"
                      >
                        <span className="font-semibold group-hover:text-brand-500 transition-colors">
                          {playlist.label.name}
                        </span>
                        <span className="text-xs text-zinc-500 group-hover:text-brand-400">
                          @{playlist.label.username}

                        </span>
                      </Link>
                    </>
                  )}
                  <span className="hidden sm:block text-zinc-600">•</span>
                  <span>
                    {format(
                      new Date(playlist.release_date || new Date()),
                      "MMMM d, yyyy"
                    )}
                  </span>
                </div>
              </motion.div>

              <motion.div
                className="flex flex-wrap gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <motion.button
                  onClick={() =>
                    isPlaying && currentTrackId === playlist.tracks[0]?.id
                      ? pause()
                      : handlePlay()
                  }
                  className={cn(
                    "relative flex items-center justify-center",
                    "w-14 h-14 rounded-full",
                    "bg-brand-500 text-white",
                    "transition-all duration-300",
                    "hover:bg-brand-400 hover:shadow-lg hover:shadow-brand-500/25",
                    "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-background"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPlaying &&
                    playlist.tracks?.find((o) => o.id === currentTrackId) ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Pause className="w-7 h-7" />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Play className="w-7 h-7 ml-1" />
                    </motion.div>
                  )}
                </motion.button>

                <div className="flex flex-wrap gap-2">
                  <ShareDialog
                    url={`${window.location.origin}/${playlist.user.username}/playlists/${playlist.slug}`}
                    title={playlist.title}
                    description={`Listen to ${playlist.title} by ${playlist.user.username} on Rauversion`}
                  >
                    <motion.button
                      className={cn(
                        "px-4 py-2 rounded-full",
                        "border border-white/10",
                        "text-foreground",
                        "flex items-center gap-2",
                        "transition-all duration-300",
                        "hover:bg-white/10 hover:border-white/20"
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16 6 12 2 8 6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                      </svg>
                      <span className="hidden sm:inline">Share</span>
                    </motion.button>
                  </ShareDialog>

                  <motion.button
                    className={cn(
                      "px-4 py-2 rounded-full",
                      "border border-white/10",
                      "text-foreground",
                      "flex items-center gap-2",
                      "transition-all duration-300",
                      "hover:bg-white/10 hover:border-white/20"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart size={20} />
                    <span className="hidden sm:inline">3 Me gusta</span>
                  </motion.button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Description Section */}
      {playlist.description && (
        <motion.div
          className="max-w-7xl mx-auto px-8 pb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <ShowMoreText text={playlist.description} maxHeight={100} />
        </motion.div>
      )}

      {/* Tracks Section */}
      <motion.div
        className="max-w-7xl mx-auto p-8 pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold">Tracks</h2>
            {playlist.private && (
              <div className="bg-brand-500/10 text-brand-500 text-sm px-3 py-1 rounded-full inline-flex items-center gap-1">
                <Lock size={14} />
                <span>Private</span>
              </div>
            )}
          </div>
          <MusicPurchase resource={playlist} type="Playlist" variant="mini" />
        </div>

        <div
          className={cn(
            "bg-white/5 backdrop-blur-sm",
            "rounded-xl p-4 space-y-1",
            "shadow-lg shadow-black/5"
          )}
        >
          {playlist.tracks.map((track, index) => (
            <PlaylistListItem
              key={track.id}
              track={track}
              index={index}
              currentTrackId={currentTrackId}
              isPlaying={isPlaying}
              onPlay={() => handleTrackPlay(track.id)}
            />
          ))}
        </div>
      </motion.div>

      {/* Comments Section */}
      <motion.div
        className="max-w-7xl mx-auto p-8 border-t border-white/5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <h2 className="text-xl font-bold mb-4">Comments</h2>
        </motion.div>

        <motion.div
          className={cn(
            "bg-white/5 backdrop-blur-sm",
            "rounded-xl p-6",
            "shadow-lg shadow-black/5"
          )}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <Comments resourceType="playlist" resourceId={playlist.slug} />
        </motion.div>
      </motion.div>

      {playlist && currentUser?.id === playlist.user.id && (
        <PlaylistEdit
          playlist={playlist}
          open={editOpen}
          onOpenChange={setEditOpen}
          onOk={fetchPlaylist}
        />
      )}

      {/* Bottom Padding for Mobile */}
      <div className="h-20 md:h-0" />
    </div>
  );
}
