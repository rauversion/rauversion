import React, { useState, useEffect } from 'react';
import { get, put, patch } from '@rails/request.js';

const PlaylistSelector = ({ onChange, value = [] }) => {
  const [playlists, setPlaylists] = useState([]);
  const [releaseId, setReleaseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');


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

  const handlePlaylistAdd = async () => {
    if (!selectedPlaylistId || value.includes(selectedPlaylistId)) return;

    const newValue = [...value, selectedPlaylistId];
    onChange(newValue);
    setSelectedPlaylistId('');

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

  const handlePlaylistRemove = async (playlistId) => {
    const newValue = value.filter(id => id !== playlistId);
    onChange(newValue);

    if (!releaseId) {
      console.error('No release ID found');
      return;
    }

    setSaving(true);
    try {
      const response = await patch(`/releases/${releaseId}`, {
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

  const getPlaylistById = (id) => playlists.find(p => p.id === id);

  if (loading) {
    return <div className="text-gray-500">Loading playlists...</div>;
  }

  const availablePlaylists = playlists.filter(p => !value.includes(p.id));

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
      
      <div className="flex gap-2">
        <select
          value={selectedPlaylistId}
          onChange={(e) => setSelectedPlaylistId(e.target.value)}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">Select a playlist...</option>
          {availablePlaylists.map((playlist) => (
            <option key={playlist.id} value={playlist.id}>
              {playlist.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handlePlaylistAdd}
          disabled={!selectedPlaylistId}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          Add
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {value.map((playlistId) => {
          const playlist = getPlaylistById(playlistId);
          if (!playlist) return null;

          return (
            <div
              key={playlist.id}
              className="flex items-center justify-between p-3 border rounded-lg bg-white"
            >
              <div className="flex items-center space-x-3">
                {playlist.cover_url && (
                  <img
                    src={playlist.cover_url}
                    alt=""
                    className="h-10 w-10 object-cover rounded"
                  />
                )}
                <div>
                  <div className="font-medium text-gray-900">{playlist.title}</div>
                  <div className="text-sm text-gray-500">
                    {playlist.tracks_count} tracks
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePlaylistRemove(playlist.id)}
                className="inline-flex items-center p-1.5 border border-transparent rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlaylistSelector;
