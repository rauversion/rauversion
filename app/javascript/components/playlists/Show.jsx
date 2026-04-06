import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { get, post } from "@rails/request.js";
import useAudioStore from "../../stores/audioStore";
import useAuthStore from "../../stores/authStore";
import { format } from "date-fns";
import { Play, Pause, Settings, Lock, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getUserDisplayName } from "@/utils/userDisplayName";
import PlaylistListItem from "../users/PlaylistItem";
import PlaylistEdit from "./PlaylistEdit";
import PlaylistSkeleton from "./PlaylistSkeleton";
import { Button } from "@/components/ui/button";
import { ShareDialog } from "@/components/ui/share-dialog";
import { Comments } from "@/components/comments/Comments";
import MusicPurchase from "@/components/shared/MusicPurchase";
import { ShowMoreText } from "@/components/ui/show_more";
import { useToast } from "@/hooks/use-toast";
export default function PlaylistShow() {
  const { slug } = useParams();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likingTrackIds, setLikingTrackIds] = useState([]);
  const {
    currentTrackId,
    currentTrackMeta,
    isPlaying,
    play,
    pause,
    setPlaylist: setAudioPlaylist,
  } = useAudioStore();
  const { currentUser } = useAuthStore();
  const { toast } = useToast();

  const fetchPlaylist = async () => {
    try {
      const response = await get(`/playlists/${slug}.json`);
      if (response.ok) {
        const data = await response.json;
        setPlaylist(data.playlist);
        setLikes(data.playlist.likes_count || 0);
        setIsLiked(Boolean(data.playlist.like_id));
      }
    } catch (error) {
      console.error("Error fetching playlist:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaylist();
  }, [slug]);

  const playlistTrackIds = playlist?.tracks?.map((track) => `${track.id}`) || [];
  const activePlaylistTrack = playlist?.tracks?.find(
    (track) => `${track.id}` === `${currentTrackId}`
  );
  const isPlaylistActive = Boolean(activePlaylistTrack);

  const handlePlay = () => {
    if (!playlist?.tracks?.length) return;

    setAudioPlaylist(playlistTrackIds);

    if (isPlaylistActive && isPlaying) {
      pause();
      return;
    }

    play(activePlaylistTrack ? activePlaylistTrack.id : playlist.tracks[0].id);
  };

  const handleTrackPlay = (trackId) => {
    setAudioPlaylist(playlistTrackIds);

    if (`${currentTrackId}` === `${trackId}` && isPlaying) {
      pause();
    } else {
      pause();
      play(trackId);
    }
  };

  const handleTrackLike = async (track) => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like tracks",
        variant: "destructive",
      });
      return;
    }

    if (!track?.slug || likingTrackIds.includes(track.id)) return;

    setLikingTrackIds((currentIds) => [...currentIds, track.id]);

    try {
      const response = await post(`/tracks/${track.slug}/likes`, {
        responseKind: "json",
      });

      if (!response.ok) {
        const error = await response.json;
        throw new Error(error.message || error.error || "Error liking track");
      }

      const { liked, resource } = await response.json;

      setPlaylist((currentPlaylist) => {
        if (!currentPlaylist) return currentPlaylist;

        return {
          ...currentPlaylist,
          tracks: currentPlaylist.tracks.map((currentTrack) =>
            currentTrack.id === track.id
              ? {
                ...currentTrack,
                like_id: liked,
                liked_by_current_user: liked,
                likes_count: resource.likes_count || 0,
              }
              : currentTrack
          ),
        };
      });

      if (`${currentTrackMeta?.id}` === `${track.id}`) {
        useAudioStore.setState((state) => ({
          currentTrackMeta: {
            ...state.currentTrackMeta,
            like_id: liked,
            liked_by_current_user: liked,
            likes_count: resource.likes_count || 0,
          },
        }));
      }

      toast({
        title: "Success",
        description: liked ? "Track liked!" : "Unliked track!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Error liking track",
        variant: "destructive",
      });
    } finally {
      setLikingTrackIds((currentIds) => currentIds.filter((id) => id !== track.id));
    }
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication required",
        description: "Please sign in to like playlists",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await post(`/playlists/${playlist.slug}/likes`, {
        responseKind: "json",
      });

      if (response.ok) {
        const { liked, resource } = await response.json;
        setLikes(resource.likes_count || 0);
        setIsLiked(liked);
        toast({
          title: "Success",
          description: !liked ? "Unliked playlist!" : "Playlist liked!",
        });
      } else {
        const error = await response.json;
        toast({
          title: "Error",
          description: error.message || error.error || "Error liking playlist",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error liking playlist",
        variant: "destructive",
      });
    }
  };

  if (loading || !playlist) {
    return <PlaylistSkeleton />;
  }

  return (
    <div className="@container/playlist-page min-h-screen bg-background text-foreground">
      {/* Header Section */}
      <motion.div
        className="relative bg-gradient-to-b from-secondary to-background p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mx-auto max-w-7xl @container/playlist-hero">
          <div className="flex items-start gap-4 @sm/playlist-hero:gap-5 @3xl/playlist-hero:gap-6 @4xl/playlist-hero:gap-8">
            {/* Cover Art */}
            <motion.div
              className="relative w-[112px] flex-shrink-0 group @sm/playlist-hero:w-[128px] @md/playlist-hero:w-[144px] @lg/playlist-hero:w-[168px] @2xl/playlist-hero:w-[180px] @3xl/playlist-hero:w-[220px] @4xl/playlist-hero:w-[280px] @5xl/playlist-hero:w-[340px]"
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
            <div className="min-w-0 flex-grow">
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="flex items-start justify-between gap-3 @sm/playlist-hero:gap-4">
                  <div className="min-w-0">
                    <h2 className="mb-1 text-[11px] font-medium uppercase tracking-[0.18em] text-brand-500 @sm/playlist-hero:mb-2 @sm/playlist-hero:text-sm">
                      {playlist.playlist_type}
                    </h2>
                    <h1 className="mb-2 line-clamp-3 text-2xl font-bold tracking-tight @sm/playlist-hero:mb-3 @sm/playlist-hero:text-3xl @lg/playlist-hero:text-4xl @5xl/playlist-hero:text-5xl">
                      {playlist.title}
                    </h1>
                  </div>

                  {currentUser?.id === playlist.user.id && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="@sm/playlist-hero:ml-4"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditOpen(true)}
                        className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-white/10 hover:text-foreground"
                      >
                        <Settings className="h-5 w-5" />
                      </Button>
                    </motion.div>
                  )}
                </div>
                <div className="space-y-1.5 text-sm text-muted-foreground @sm/playlist-hero:space-y-2 @sm/playlist-hero:text-base">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <Link
                      to={`/${playlist.user.username}`}
                      className="hover:text-foreground transition-colors flex items-center gap-2 group"
                    >
                      <motion.img
                        src={playlist.user.avatar_url?.small}
                        alt={getUserDisplayName(playlist.user)}
                        className="w-6 h-6 rounded-full ring-2 ring-transparent group-hover:ring-brand-500 transition-all"
                        whileHover={{ scale: 1.1 }}
                      />
                      <span className="group-hover:text-brand-500 transition-colors">
                        {getUserDisplayName(playlist.user)}
                      </span>
                    </Link>
                    {playlist.label && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <Link
                          to={`/${playlist.label.username}`}
                          className="hover:text-foreground transition-colors flex items-center gap-2 group"
                        >
                          <span className="font-semibold group-hover:text-brand-500 transition-colors">
                            {getUserDisplayName(playlist.label)}
                          </span>
                          <span className="text-xs text-muted-foreground group-hover:text-brand-400">
                            @{playlist.label.username}
                          </span>
                        </Link>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>
                      {format(
                        new Date(playlist.release_date || new Date()),
                        "MMMM d, yyyy"
                      )}
                    </span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="flex items-center gap-2.5 @sm/playlist-hero:gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <motion.button
                  onClick={handlePlay}
                  className={cn(
                    "relative flex items-center justify-center",
                    "h-11 w-11 shrink-0 rounded-full @sm/playlist-hero:h-14 @sm/playlist-hero:w-14",
                    "bg-brand-500 text-white",
                    "transition-all duration-300",
                    "hover:bg-brand-400 hover:shadow-lg hover:shadow-brand-500/25",
                    "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-background"
                  )}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPlaying && isPlaylistActive ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Pause className="h-5 w-5 @sm/playlist-hero:h-7 @sm/playlist-hero:w-7" />
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Play className="ml-0.5 h-5 w-5 @sm/playlist-hero:h-7 @sm/playlist-hero:w-7" />
                    </motion.div>
                  )}
                </motion.button>

                <div className="flex min-w-0 flex-1 gap-2">
                  <ShareDialog
                    url={`${window.location.origin}/${playlist.user.username}/playlists/${playlist.slug}`}
                    title={playlist.title}
                    description={`Listen to ${playlist.title} by ${getUserDisplayName(playlist.user)} on Rauversion`}
                  >
                    <motion.button
                      className={cn(
                        "flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm @sm/playlist-hero:flex-none @sm/playlist-hero:px-4 @sm/playlist-hero:text-base",
                        "border border-white/10",
                        "text-foreground",
                        "transition-all duration-300",
                        "hover:bg-white/10 hover:border-white/20"
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                      >
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16 6 12 2 8 6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                      </svg>
                      <span className="truncate">Share</span>
                    </motion.button>
                  </ShareDialog>

                  <motion.button
                    onClick={handleLike}
                    className={cn(
                      "flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm @sm/playlist-hero:flex-none @sm/playlist-hero:gap-2 @sm/playlist-hero:px-4 @sm/playlist-hero:text-base",
                      "border border-white/10",
                      isLiked ? "text-brand-500 border-brand-500/20 bg-brand-500/10" : "text-foreground",
                      "transition-all duration-300",
                      isLiked ? "hover:bg-brand-500/20" : "hover:bg-white/10 hover:border-white/20"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart size={20} className={isLiked ? "fill-current" : ""} />
                    <span className="truncate">{likes}</span>
                    <span className="hidden @2xl/playlist-hero:inline">Me gusta</span>
                    <span className="sr-only">Like playlist</span>
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
          className="mx-auto max-w-7xl px-6 pb-8 @sm/playlist-page:px-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <ShowMoreText text={playlist.description} maxHeight={100} />
        </motion.div>
      )}

      {/* Tracks Section */}
      <motion.div
        className="mx-auto max-w-7xl p-6 pt-4 @sm/playlist-page:p-8 @sm/playlist-page:pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="mb-6 flex flex-col items-start justify-between gap-4 @md/playlist-page:flex-row @md/playlist-page:items-center">
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
              key={`${track.id}-${index}`}
              track={track}
              index={index}
              currentTrackId={currentTrackId}
              isPlaying={isPlaying}
              onPlay={() => handleTrackPlay(track.id)}
              onLike={handleTrackLike}
              liking={likingTrackIds.includes(track.id)}
            />
          ))}
        </div>
      </motion.div>

      {/* Comments Section */}
      <motion.div
        className="mx-auto max-w-7xl border-t border-white/5 p-6 @sm/playlist-page:p-8"
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
      <div className="h-20 @md/playlist-page:h-0" />
    </div>
  );
}
