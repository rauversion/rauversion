import React, { useState, useEffect } from 'react';
import { get, patch } from '@rails/request.js';

const PlaylistSelector = ({ onChange, value }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const userId = document.querySelector('meta[name="current-user-id"]')?.content;
        if (!userId) {
          console.error('No user ID found');
          setLoading(false);
          return;
        }

        const response = await get(`/${userId}/playlists.json`);
        if (response.ok) {
          const data = await response.json();
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

  const handlePlaylistChange = async (playlistId, checked) => {
    const newValue = checked
      ? [...(value || []), playlistId]
      : (value || []).filter(id => id !== playlistId);

    onChange(newValue);

    if (!window.releaseId) {
      console.error('No release ID found');
      return;
    }

    setSaving(true);
    try {
      const response = await patch(`/releases/${window.releaseId}`, {
        body: JSON.stringify({
          release: {
            playlist_ids: newValue
          }
        }),
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content,
        }
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
      
      <div className="grid grid-cols-2 gap-3">
        {playlists.map((playlist) => (
          <label
            key={playlist.id}
            className="relative flex items-start p-3 border rounded-lg hover:bg-gray-50 cursor-pointer group"
          >
            <div className="flex items-center h-5">
              <input
                type="checkbox"
                checked={value?.includes(playlist.id)}
                onChange={(e) => handlePlaylistChange(playlist.id, e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-700 truncate group-hover:text-gray-900">
                {playlist.title}
              </div>
              <div className="text-sm text-gray-500">
                {playlist.tracks_count} tracks
              </div>
            </div>
            {playlist.cover_url && (
              <div className="ml-3 flex-shrink-0 h-12 w-12">
                <img
                  src={playlist.cover_url}
                  alt=""
                  className="h-full w-full object-cover rounded"
                />
              </div>
            )}
          </label>
        ))}
      </div>
    </div>
  );
};

export default PlaylistSelector;
