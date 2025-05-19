"use client";
import React, { useEffect, useState, useRef } from "react";
import { Play, Pause } from "lucide-react";
import { get } from "@rails/request.js";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import ReactSelectPlaylistSelector from "./ReactSelectPlaylistSelector";
import type { BlockDefinition, BlockRendererProps, PropertyEditorProps } from "./types";
import { ChromePicker } from "react-color"
import * as Popover from "@radix-ui/react-popover"

interface Track {
  id: number;
  title: string;
  slug: string;
  description: string;
  duration: string;
  audio_url: string;
  cover_url: string;
  position: number;
  user: { full_name: string };
}

interface Playlist {
  id: number;
  title: string;
  slug: string;
  url: string;
  description: string;
  playlist_type: string;
  private: boolean;
  buy: boolean;
  buy_link: string;
  buy_link_title: string;
  created_at: string;
  updated_at: string;
  user: { id: number; username: string; full_name: string; avatar_url: string };
  label?: any;
  cover_url: { medium: string };
  tracks: Track[];
  likes_count: number;
  comments_count: number;
}

export const playlistBlock: BlockDefinition = {
  type: "playlist",
  label: "Playlist",
  icon: <Play size={16} />,
  defaultProperties: {
    playlistId: "",
    accentColor: "#1DB954",
    backgroundColor: "#ffffff",
    borderColor: "#e5e7eb",
    shadow: true,
  },

  render: ({ block }: BlockRendererProps) => {
    const { playlistId, accentColor } = block.properties;
    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
      if (!playlistId) {
        setPlaylist(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);

      get(`/playlists/${playlistId}.json`)
        .then((response: any) => response.json)
        .then((data: any) => {
          if (data.error) throw new Error(data.error);
          setPlaylist(data.playlist);
        })
        .catch((err: any) => setError(err.message || "An error occurred"))
        .finally(() => setLoading(false));
    }, [playlistId]);

    const playTrack = (trackId: string) => {
      setCurrentTrackId(trackId);
      setIsPlaying(true);
      if (audioRef.current) {
        audioRef.current.src =
          playlist?.tracks.find((t) => t.id + "" === trackId)?.audio_url || "";
        audioRef.current.play();
      }
    };

    const pauseTrack = () => {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!playlist) return <div>No playlist found</div>;
    if (!playlist.user) return <div>No playlist user found</div>;

    return (
      <div
        className={cn(
          "rounded-lg p-4",
          block.properties.shadow ? "shadow-lg" : "",
        )}
        style={{
          background: block.properties.backgroundColor || "#ffffff",
          border: `1px solid ${block.properties.borderColor || "#e5e7eb"}`,
        }}
      >
        <audio ref={audioRef} />
        <div className="flex items-start gap-6">
          {playlist.cover_url && (
            <img
              src={playlist.cover_url.medium}
              alt={playlist.title}
              className="w-[160px] h-[160px] rounded-md shadow-lg"
            />
          )}
          <div className="flex-1">
            <h2 className="font-bold text-3xl mb-2">{playlist.title}</h2>
            <p className="mb-4">{playlist.user.full_name}</p>
            <div className="flex items-center gap-4">
              <Button
                style={{ backgroundColor: accentColor, color: "#fff" }}
                className="rounded-full p-3 hover:scale-105 transition"
                onClick={() => {
                  if (isPlaying) {
                    pauseTrack();
                  } else if (playlist.tracks[0]) {
                    playTrack(playlist.tracks[0].id + "");
                  }
                }}
              >
                {isPlaying ? <Pause size={24} /> : <Play size={24} />}
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-8">
          <div className="space-y-1 bg-muted p-4 rounded-lg">
            {playlist.tracks &&
              playlist.tracks.map((track, index) => (
                <div
                  key={`${track.id}-${index}`}
                  className={cn(
                    "flex items-center justify-between p-2 rounded group",
                    currentTrackId === track.id + "" && "bg-primary/10"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        "w-6",
                        currentTrackId === track.id + "" ? "text-primary" : "text-foreground"
                      )}
                    >
                      {index + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        currentTrackId === track.id + "" && isPlaying
                          ? pauseTrack()
                          : playTrack(track.id + "")
                      }
                    >
                      {currentTrackId === track.id + "" && isPlaying ? (
                        <Pause size={20} />
                      ) : (
                        <Play size={20} />
                      )}
                    </Button>
                    <div>
                      <p
                        className={cn(
                          "font-medium",
                          currentTrackId === track.id + "" ? "text-primary" : "text-foreground"
                        )}
                      >
                        {track.title}
                      </p>
                      <p className="text-muted-foreground text-sm">{track.user?.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {track.duration !== "xx;xx" && (
                      <span className="text-muted-foreground text-sm">{track.duration}</span>
                    )}
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
              className="text-xs font-semibold px-4 py-1.5 rounded-full bg-transparent border border-primary text-primary hover:scale-105 transition"
            >
              {playlist.buy_link_title || "Buy Now"}
            </a>
          </div>
        )}
      </div>
    );
  },

  propertyEditor: ({ properties, onChange }: PropertyEditorProps) => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="playlist-id">Playlist</Label>
        <ReactSelectPlaylistSelector
          value={properties.playlistId}
          onChange={(val: string) => onChange("playlistId", val)}
        />
      </div>
      <div>
        <Label>Accent Color</Label>
        <div className="flex items-center gap-2 mb-2">
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-label="Pick color"
                className="w-8 h-8 rounded border border-gray-300 shadow-sm flex-shrink-0"
                style={{
                  background: properties.accentColor || "#1DB954",
                }}
              />
            </Popover.Trigger>
            <Popover.Content
              side="right"
              align="start"
              className="z-50 bg-white rounded shadow-lg p-2"
              sideOffset={8}
            >
              <ChromePicker
                color={properties.accentColor || "#1DB954"}
                onChange={(color: { hex: string; rgb: { r: number; g: number; b: number; a: number } }) => {
                  const { r, g, b, a } = color.rgb
                  const value = a !== undefined && a < 1 ? `rgba(${r},${g},${b},${a})` : color.hex
                  onChange("accentColor", value)
                }}
                styles={{
                  default: {
                    picker: {
                      width: "180px",
                      boxShadow: "none",
                    },
                  },
                }}
              />
            </Popover.Content>
          </Popover.Root>
          <Input
            value={properties.accentColor || "#1DB954"}
            onChange={e => onChange("accentColor", e.target.value)}
            placeholder="#1DB954"
            type="text"
            className="w-24"
          />
        </div>
      </div>
      <div>
        <Label>Border Color</Label>
        <div className="flex items-center gap-2 mb-2">
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-label="Pick color"
                className="w-8 h-8 rounded border border-gray-300 shadow-sm flex-shrink-0"
                style={{
                  background: properties.borderColor || "#e5e7eb",
                }}
              />
            </Popover.Trigger>
            <Popover.Content
              side="right"
              align="start"
              className="z-50 bg-white rounded shadow-lg p-2"
              sideOffset={8}
            >
              <ChromePicker
                color={properties.borderColor || "#e5e7eb"}
                onChange={(color: { hex: string; rgb: { r: number; g: number; b: number; a: number } }) => {
                  const { r, g, b, a } = color.rgb
                  const value = a !== undefined && a < 1 ? `rgba(${r},${g},${b},${a})` : color.hex
                  onChange("borderColor", value)
                }}
                styles={{
                  default: {
                    picker: {
                      width: "180px",
                      boxShadow: "none",
                    },
                  },
                }}
              />
            </Popover.Content>
          </Popover.Root>
          <Input
            value={properties.borderColor || "#e5e7eb"}
            onChange={e => onChange("borderColor", e.target.value)}
            placeholder="#e5e7eb"
            type="text"
            className="w-24"
          />
        </div>
      </div>
      <div>
        <Label>Shadow</Label>
        <div className="flex items-center gap-2">
          <input
            id="playlist-shadow"
            type="checkbox"
            checked={!!properties.shadow}
            onChange={e => onChange("shadow", e.target.checked)}
            className="w-4 h-4"
          />
          <Label htmlFor="playlist-shadow" className="text-sm">Show shadow</Label>
        </div>
      </div>
      <div>
        <Label>Background Color</Label>
        <div className="flex items-center gap-2 mb-2">
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-label="Pick color"
                className="w-8 h-8 rounded border border-gray-300 shadow-sm flex-shrink-0"
                style={{
                  background: properties.backgroundColor || "#ffffff",
                }}
              />
            </Popover.Trigger>
            <Popover.Content
              side="right"
              align="start"
              className="z-50 bg-white rounded shadow-lg p-2"
              sideOffset={8}
            >
              <ChromePicker
                color={properties.backgroundColor || "#ffffff"}
                onChange={(color: { hex: string; rgb: { r: number; g: number; b: number; a: number } }) => {
                  const { r, g, b, a } = color.rgb
                  const value = a !== undefined && a < 1 ? `rgba(${r},${g},${b},${a})` : color.hex
                  onChange("backgroundColor", value)
                }}
                styles={{
                  default: {
                    picker: {
                      width: "180px",
                      boxShadow: "none",
                    },
                  },
                }}
              />
            </Popover.Content>
          </Popover.Root>
          <Input
            value={properties.backgroundColor || "#ffffff"}
            onChange={e => onChange("backgroundColor", e.target.value)}
            placeholder="#ffffff"
            type="text"
            className="w-24"
          />
        </div>
      </div>
    </div>
  ),
};

export default playlistBlock;
