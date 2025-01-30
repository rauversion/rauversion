import React, { useState, useEffect } from 'react';
import { get, put } from '@rails/request.js';
import AsyncSelect from 'react-select/async';

const PlaylistSelector = ({ onChange, value = [] }) => {
  const [playlistIds, setPlaylistIds] = useState(value);
  const [playlists, setPlaylists] = useState([]);
  const [releaseId, setReleaseId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPlaylistIds(value);
  }, [value]);

  useEffect(() => {
    const releaseId = document.querySelector('meta[name="current-release-id"]')?.content;
    setReleaseId(releaseId);
  }, []);

  const loadOptions = async (inputValue, callback) => {
    try {
      const userId = document.querySelector('meta[name="current-user-id"]')?.content;
      if (!userId) {
        console.error('No user ID found');
        return;
      }

      const response = await get(`/${userId}/albums.json?`);
      if (response.ok) {
        const data = await response.json;
        const options = data.collection.map(playlist => ({
          value: playlist.id,
          label: playlist.title,
          coverUrl: playlist.cover_url
        }));
        setPlaylists(options);
        callback(options);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      callback([]);
    }
  };

  const handleChange = async (newSelectedOptions) => {
    const newValue = newSelectedOptions ? newSelectedOptions.map(option => option.value) : [];
    onChange(newValue);
 };

  const customStyles = {
    option: (provided, state) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px',
    }),
    multiValue: (provided) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      backgroundColor: 'rgb(243 244 246)',
    }),
  };

  const formatOptionLabel = ({ label, coverUrl }) => (
    <div className="flex items-center gap-2">
      {coverUrl && (
        <img 
          src={coverUrl} 
          alt={label} 
          className="w-8 h-8 object-cover rounded"
        />
      )}
      <span>{label}</span>
    </div>
  );

  return (
    <div className="w-full">
      <AsyncSelect
        isMulti
        cacheOptions
        defaultOptions
        value={playlists.filter(playlist => playlistIds.includes(playlist.value)) }
        onChange={handleChange}
        loadOptions={(inputValue) => new Promise((resolve) => loadOptions(inputValue, resolve))}
        isLoading={saving}
        styles={customStyles}
        formatOptionLabel={formatOptionLabel}
        placeholder="Search and select playlists..."
        noOptionsMessage={() => "No playlists found"}
        loadingMessage={() => "Loading playlists..."}
        className="min-w-[200px]"
      />
    </div>
  );
};

export default PlaylistSelector;
