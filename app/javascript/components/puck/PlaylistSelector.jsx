import React, { useState, useEffect } from 'react';
import { get, put } from '@rails/request.js';
import Select from 'react-select';

const PlaylistSelector = ({ onChange, value = [] }) => {
  const [playlists, setPlaylists] = useState([]);
  const [releaseId, setReleaseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const userId = document.querySelector('meta[name="current-user-id"]')?.content;
        const releaseId = document.querySelector('meta[name="current-release-id"]')?.content;
        setReleaseId(releaseId);
        
        if (!userId) {
          console.error('No user ID found');
          setLoading(false);
          return;
        }

        const response = await get(`/${userId}/albums.json`);
        if (response.ok) {
          const data = await response.json;
          setPlaylists(data);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  const handleChange = async (selectedOptions) => {
    const newValue = selectedOptions ? selectedOptions.map(option => option.value) : [];
    onChange(newValue);

    if (!releaseId) {
      console.error('No release ID found');
      return;
    }

    setSaving(true);
    try {
      const response = await put(`/releases/${releaseId}`, {
        body: JSON.stringify({
          release: {
            playlist_ids: newValue
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update release');
      }
    } catch (error) {
      console.error('Error updating release:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-500">Loading playlists...</div>;
  }

  const options = playlists.map(playlist => ({
    value: playlist.id,
    label: playlist.title,
    data: playlist
  }));

  const selectedOptions = options.filter(option => 
    value.includes(option.value)
  );

  const customStyles = {
    control: (base) => ({
      ...base,
      borderColor: '#d1d5db',
      '&:hover': {
        borderColor: '#6b7280'
      }
    }),
    option: (base, state) => ({
      ...base,
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      backgroundColor: state.isSelected ? '#2563eb' : state.isFocused ? '#e5e7eb' : 'white',
      '&:active': {
        backgroundColor: '#dbeafe'
      }
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: '#e5e7eb'
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: '#374151'
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: '#6b7280',
      '&:hover': {
        backgroundColor: '#d1d5db',
        color: '#1f2937'
      }
    })
  };

  const formatOptionLabel = ({ data }) => (
    <div className="flex items-center space-x-3">
      {data.cover_url && (
        <img
          src={data.cover_url}
          alt=""
          className="h-8 w-8 object-cover rounded"
        />
      )}
      <div>
        <div className="font-medium">{data.title}</div>
        <div className="text-sm text-gray-500">
          {data.tracks_count} tracks
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Select Playlists
        </label>
        {saving && (
          <span className="text-sm text-gray-500">Saving...</span>
        )}
      </div>
      
      <Select
        isMulti
        value={selectedOptions}
        onChange={handleChange}
        options={options}
        styles={customStyles}
        formatOptionLabel={formatOptionLabel}
        placeholder="Select playlists..."
        className="react-select-container"
        classNamePrefix="react-select"
      />
    </div>
  );
};

export default PlaylistSelector;
