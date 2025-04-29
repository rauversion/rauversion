import React from "react";
import { Link } from "react-router-dom";
import { ShareDialog } from "@/components/ui/share-dialog";
import { cn } from "@/lib/utils";

export default function PlaylistCard({ playlist, skipCover }) {
  const shareUrl = `${window.location.origin}/playlists/${playlist.slug}`;

  return (
    <div className="group">
      <div className="relative aspect-square overflow-hidden rounded-lg mb-4 bg-neutral-900">
        {!skipCover && playlist.cover_url?.cropped_image && <Link to={`/playlists/${playlist.slug}`}>
          <img
            src={playlist.cover_url.cropped_image}
            alt={playlist.title}
            className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
        </Link>}

        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <ShareDialog
            url={shareUrl}
            title={playlist.title}
            description={`Listen to ${playlist.title} by ${playlist.user.username} on Rauversion`}
          />
        </div>
      </div>

      <Link to={`/playlists/${playlist.slug}`} className="block">
        <h3 className="font-bold mb-1 hover:text-primary transition-colors">
          {playlist.title}
        </h3>
        <p className="text-sm text-gray-400">
          By {playlist.user.username} • {playlist.tracks_count} tracks
        </p>
      </Link>
    </div>
  );
}
