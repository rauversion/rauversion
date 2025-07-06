import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import PlaylistSelector from './PlaylistSelector';
import { get } from '@rails/request.js';
import CheckboxField from './CheckboxField';
import PlaylistComponent from './Playlist';
import ColorPicker from "./ColorPicker";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../ui/carousel"

const itemSizeVariants = {
  'responsive': 'md:basis-1/2 lg:basis-1/3',
  'third': 'basis-1/3',
  'half': 'basis-1/2'
};

const Slider = ({
  playlistIds = [],
  autoPlay = false,
  interval = 5000,
  itemsToShow = 4,
  orientation = "horizontal",
  itemSize = "responsive",
  accentColor = "#1DB954",
  color = "#444",
  openAsComponent = false
}) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState();
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);

  useEffect(() => {
    const fetchPlaylists = async () => {
      if (playlistIds.length === 0) return;

      try {
        // const response = await fetch(`/releases/${releaseId}.json`);
        const response = await get(`/playlists/albums.json?ids=${playlistIds.join(",")}`);
        const data = await response.json;
        setPlaylists(data.collection);
        // Set the first playlist as selected by default
        if (data.collection.length > 0) {
          setSelectedPlaylist(data.collection[0].id);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [playlistIds]);

  useEffect(() => {
    if (!api) {
      return
    }

    if (autoPlay) {
      const timer = setInterval(() => {
        api.scrollNext()
      }, interval);

      return () => clearInterval(timer);
    }
  }, [api, autoPlay, interval]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!playlists || playlists.length === 0) {
    return <div>No playlists available</div>;
  }

  const handlePlaylistClick = (playlistId) => {
    setSelectedPlaylist(playlistId);
  };

  return (
    <div className="w-full space-y-8">
      <Carousel
        orientation={orientation}
        setApi={setApi}
        className="w-full"
        opts={{
          align: "start",
          loop: true,
        }}
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {playlists.map((playlist) => (
            <CarouselItem key={playlist.id} className={`pl-2 md:pl-4 ${itemSizeVariants[itemSize]}`}>
              <div className="p-1">
                <div
                  className={`relative group aspect-square overflow-hidden bg-zinc-100 rounded-md cursor-pointer
                    ${selectedPlaylist === playlist.id ? `ring-2 ring-[${accentColor}]` : ''}`}
                  onClick={() => handlePlaylistClick(playlist.id)}
                >
                  <img
                    src={playlist.cover_url}
                    alt={playlist.title}
                    className="object-cover w-full h-full transition-all hover:scale-105"
                  />

                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div className="text-white">
                      <h3 className="font-semibold">{playlist.title}</h3>
                      <p className="text-sm text-zinc-300">{playlist.tracks_count} tracks</p>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>

      {selectedPlaylist && (
        <div className="mt-8">
          <PlaylistComponent
            playlistId={selectedPlaylist}
            accentColor={accentColor}
            color={color}
          />
        </div>
      )}
    </div>
  );
};

export const config = {
  fields: {
    playlistIds: {
      type: "custom",
      render: PlaylistSelector,
      label: "Select Playlists"
    },
    autoPlay: {
      type: "custom",
      render: CheckboxField,
      label: "Enable Auto Play"
    },
    interval: {
      type: "number",
      label: "Slide Interval (ms)"
    },
    itemSize: {
      type: "select",
      label: "Item Size",
      options: [
        { label: "Responsive (50% - 33%)", value: "responsive" },
        { label: "One Third", value: "third" },
        { label: "Half Width", value: "half" }
      ],
      defaultValue: "responsive"
    },
    orientation: {
      type: "select",
      label: "Orientation",
      options: [
        { label: "Horizontal", value: "horizontal" },
        { label: "Vertical", value: "vertical" }
      ],
      defaultValue: "horizontal"
    },
    accentColor: {
      type: "custom",
      label: "Accent Color",
      render: ColorPicker,
    },
    color: {
      type: "custom",
      label: "Text Color",
      render: ColorPicker,
    },
    openAsComponent: {
      type: "custom",
      render: CheckboxField,
      label: "Open as React Component"
    }
  },
  defaultProps: {
    playlistIds: [],
    autoPlay: false,
    interval: 5000,
    itemsToShow: 4,
    orientation: "horizontal",
    itemSize: "responsive",
    accentColor: "#1DB954",
    color: "#1DB954",
    openAsComponent: false
  }
};

export default Slider;
