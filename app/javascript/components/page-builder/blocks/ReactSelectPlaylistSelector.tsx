"use client";
import React from "react";
import AsyncSelect from "react-select/async";

interface PlaylistOption {
  value: string;
  label: string;
}

interface ReactSelectPlaylistSelectorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function ReactSelectPlaylistSelector({ value, onChange }: ReactSelectPlaylistSelectorProps) {
  const loadOptions = (inputValue: string, callback: (options: PlaylistOption[]) => void) => {
    fetch(`/playlists.json?search=${encodeURIComponent(inputValue)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.collection)) {
          callback(
            data.collection.map((playlist: any) => ({
              value: playlist.id + "",
              label: playlist.title,
            }))
          );
        } else {
          callback([]);
        }
      })
      .catch(() => callback([]));
  };

  return (
    <AsyncSelect
      cacheOptions
      defaultOptions
      loadOptions={loadOptions}
      value={value ? { value, label: value } : null}
      onChange={(opt) => onChange(opt ? opt.value : "")}
      placeholder="Select a playlist..."
      isClearable
      styles={{
        menu: (provided) => ({ ...provided, zIndex: 9999 }),
      }}
    />
  );
}
