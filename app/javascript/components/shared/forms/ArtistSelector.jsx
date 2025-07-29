import React, { useState, useEffect } from "react";
import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use_debounce";
import { get } from "@rails/request.js";

export default function ArtistSelector({ control, setValue, watch, name = "artist_ids" }) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const selectedArtists = watch(name) || [];
  const debouncedQuery = useDebounce(query, 500);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery && debouncedQuery.length > 2) {
        setLoading(true);
        try {
          const response = await get('/account_connections/user_search.json', {
            query: { q: debouncedQuery }
          });
          const data = await response.json;
          setSearchResults(data.collection || []);
        } catch (error) {
          console.error('Error searching artists:', error);
          toast({ title: "Error", description: "Failed to search artists", variant: "destructive" });
          setSearchResults([]);
        }
        setLoading(false);
      } else {
        setSearchResults([]);
      }
    };
    fetchResults();
  }, [debouncedQuery, toast]);

  const addArtist = (artist) => {
    if (!selectedArtists.some((a) => a.id === artist.id)) {
      setValue(name, [...selectedArtists, artist]);
    }
  };

  const removeArtist = (artistId) => {
    setValue(name, selectedArtists.filter((a) => a.id !== artistId));
  };

  const handleCheckbox = (artist, checked) => {
    if (checked) {
      addArtist(artist);
    } else {
      removeArtist(artist.id);
    }
  };

  return (
    <div className="mb-4">
      <Label>Artists</Label>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for artists by username or email"
        className="mt-2"
      />
      {loading && <div className="text-xs text-muted-foreground mt-1">Searching...</div>}
      {searchResults.length > 0 && (
        <div className="border rounded mt-2 bg-popover p-2 max-h-60 overflow-y-auto divide-y">
          {searchResults.map((artist) => (
            <div
              key={artist.id}
              className="flex items-center justify-between px-2 py-2 hover:bg-accent cursor-pointer rounded"
            >
              <div className="flex items-center gap-2">
                {artist.avatar_url?.medium && (
                  <img
                    src={new URL(artist.avatar_url.medium, window.location.origin).toString()}
                    alt={artist.username}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                )}
                <div>
                  <div className="font-medium">{artist.username}</div>
                  <div className="text-xs text-muted-foreground">{artist.full_name || artist.email}</div>
                </div>
              </div>
              <Checkbox
                checked={!!selectedArtists.find((a) => a.id === artist.id)}
                onCheckedChange={(checked) => handleCheckbox(artist, checked)}
                aria-label={`Select ${artist.username}`}
              />
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-2">
        {selectedArtists.map((artist) => (
          <div key={artist.id} className="flex items-center bg-muted px-2 py-1 rounded">
            {artist.avatar_url?.small && (
              <img
                src={new URL(artist.avatar_url.small, window.location.origin).toString()}
                alt={artist.username}
                className="h-5 w-5 rounded-full object-cover mr-1"
              />
            )}
            <span>{artist.username}</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => removeArtist(artist.id)}
              className="ml-1"
              aria-label="Remove artist"
            >
              <X size={16} />
            </Button>
          </div>
        ))}
      </div>
      <Controller
        name={name}
        control={control}
        defaultValue={[]}
        render={() => null}
      />
    </div>
  );
}
