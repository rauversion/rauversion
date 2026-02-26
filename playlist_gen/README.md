# PlaylistGen

DJ Set Generator for Rekordbox library integration.

## Features

- Import Rekordbox XML collection
- Automatic DJ set generation based on BPM, key, and energy
- Export playlists to M3U format

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'playlist_gen', path: 'playlist_gen'
```

## API Endpoints

- `POST /api/v1/library_uploads` - Upload Rekordbox collection.xml
- `GET /api/v1/library_uploads/:id` - Check import status
- `POST /api/v1/sets/generate` - Generate a DJ set
- `GET /api/v1/playlists` - List generated playlists
- `GET /api/v1/playlists/:id` - Get playlist details
- `GET /api/v1/playlists/:id/export_m3u` - Export playlist to M3U
