import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { post } from "@rails/request.js";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import UserCard from "../users/UserCard";
import { MinimalTrackCell } from "../tracks/TrackCell";
import PlaylistCard from '../playlists/PlaylistCard'

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";


export default function SearchView() {
  const { register, handleSubmit, formState } = useForm();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const onSubmit = async (data) => {
    setLoading(true);
    setResults(null);
    try {
      const response = await post("/search", {
        body: JSON.stringify({ q: data.q }),
        contentType: "application/json",
        responseKind: "json",
      });
      if (response.ok) {
        // Defensive: always set arrays for users, playlists, tracks
        const json = await response.json

        setResults({
          users: Array.isArray(json.users) ? json.users : [],
          playlists: Array.isArray(json.playlists) ? json.playlists : [],
          tracks: Array.isArray(json.tracks) ? json.tracks : [],
        });
      } else {
        toast({ description: "Search failed", variant: "destructive" });
      }
    } catch (e) {
      toast({ description: "Network error", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 mb-8">
        <Input
          {...register("q", { required: true })}
          placeholder="Search for artists, playlists, or tracks..."
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Searching..." : "Search"}
        </Button>
      </form>

      {results && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Top Result */}

          {/*
            Show first user, playlist, or track as top result
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-2">Top result</h2>
            
              {results.users && results.users.length > 0 ? (
                <UserCard user={results.users[0]} />
              ) : results.playlists && results.playlists.length > 0 ? (
                <PlaylistCard
                  playlist={results.playlists[0]}
                />
              ) : results.tracks && results.tracks.length > 0 ? (
                <MinimalTrackCell track={results.tracks[0]} />
              ) : (
                <div className="text-muted-foreground">No results found.</div>
              )}
            </div>
          */}


          {/* Songs */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Songs</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {results.tracks && results.tracks.length > 0 ? (
                results.tracks.map((track) => (
                  <MinimalTrackCell key={track.id} track={track} />
                ))
              ) : (
                <div className="text-muted-foreground col-span-full">No songs found.</div>
              )}
            </div>
          </div>

          {/* Artists */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Artists</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {results.users && results.users.length > 0 ? (
                results.users.map((user) => (
                  <UserCard key={user.id} user={user} />
                ))
              ) : (
                <div className="text-muted-foreground col-span-full">No artists found.</div>
              )}
            </div>
          </div>

          {/* Playlists */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-2">Playlists</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {results.playlists && results.playlists.length > 0 ? (
                results.playlists.map((playlist) => (
                  <PlaylistCard
                    playlist={playlist}
                    key={playlist.id}
                  />
                ))
              ) : (
                <div className="text-muted-foreground col-span-full">No playlists found.</div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
