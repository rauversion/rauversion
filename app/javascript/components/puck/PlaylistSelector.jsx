import React, { useState, useEffect } from 'react';

const PlaylistSelector = ({ onChange, value }) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        // Get the current user ID from the page data or URL
        const userId = document.querySelector('meta[name="current-user-id"]')?.content;
        if (!userId) {
          console.error('No user ID found');
          setLoading(false);
          return;
        }

        const response = await fetch(`/${userId}/playlists.json`);
        const data = await response.json();
        setPlaylists(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading playlists...</div>;
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Select Playlists
      </label>
      <div className="grid grid-cols-2 gap-2">
        {playlists.map((playlist) => (
          <label
            key={playlist.id}
            className="flex items-start space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={value?.includes(playlist.id)}
              onChange={(e) => {
                const newValue = e.target.checked
                  ? [...(value || []), playlist.id]
                  : (value || []).filter(id => id !== playlist.id);
                onChange(newValue);
              }}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium">{playlist.title}</div>
              <div className="text-sm text-gray-500">
                {playlist.playlist_type} • {new Date(playlist.release_date).getFullYear()}
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  );
};

export default PlaylistSelector;
