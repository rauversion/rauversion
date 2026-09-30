# Track Model Documentation

## Overview

The Track model is a central component of our application, responsible for managing and storing all the information related to a music track. This includes details about the track itself, its associated playlists, likes, comments, listening events, purchased items, and attachments.

## Features

### Track Details

Each track has a title, which is used to generate a friendly ID, or slug, for the track. This slug is used in the track's URL, making it more human-readable and SEO-friendly.

### Associations

The Track model has associations with several other models:

- `User`: Each track belongs to a user, who is considered the track's author or uploader.
- `TrackComments`: Tracks have many track comments, allowing users to comment on the track.
- `TrackPlaylists`: Tracks have many track playlists, which are essentially join records between tracks and playlists.
- `Playlists`: Through track playlists, tracks have many playlists. This allows a track to be included in multiple playlists.
- `ListeningEvents`: Tracks have many listening events, which are records of users listening to the track.
- `Reposts`: Tracks have many reposts, allowing users to share the track with their followers.
- `PurchasedItems`: Tracks have many purchased items, which are records of users purchasing the track.
- `Likes`: Tracks have many likes, allowing users to express their enjoyment of the track.
- `Comments`: Tracks have many comments, allowing users to discuss the track.

### Attachments

Tracks have several attachments:

- `Cover`: The cover image for the track.
- `Audio`: The audio file of the track.
- `MP3_Audio`: The MP3 version of the audio file.
- `Zip`: A ZIP file containing the track and any additional files.

### Public audio previews

The track editor's Permissions tab can limit public playback to an excerpt. The
settings live in `metadata`: `preview_enabled` (default `false`),
`preview_start_seconds` (default `0`), and `preview_duration_seconds` (default
`30`). Excerpts currently apply to audio tracks only. The selected window must
fit within the original; the converter also checks the source file directly.

`audio` remains the original used for authorized downloads and audio analysis.
`mp3_audio` is the only public audio copy: either the selected excerpt or the
full recording when previews are disabled. Public consumers must use
`playback_media`, which never falls back to the original. `duration` and the
waveform describe the public MP3; `original_duration` describes the source.

Changing the source or active preview settings detaches the previous MP3 and
clears its waveform in the save transaction, schedules deletion of the old blob
through Active Storage's purge job, and queues `TrackProcessorJob` after commit.
Playback is unavailable until a matching MP3 is generated. A source/settings
signature prevents outdated jobs from publishing their results. Workers must
process both track-processing and Active Storage purge jobs; previously issued
storage URLs may remain usable until deletion completes.

Disabling an existing preview requires the editor's confirmation dialog. API
updates must explicitly send `confirm_full_length: true` together with
`preview_enabled: false`; otherwise the update returns validation errors with
HTTP 422 and preserves the current preview. Confirmation triggers full-length
regeneration. Dialog and setting translations live in `track_preview.en.yml`
and `track_preview.es.yml` and are exported to the JavaScript locale bundle.

### Scopes

The Track model includes several scopes for querying tracks based on their attributes:

- `Published`: Returns all tracks that are not private.
- `Latests`: Returns all tracks, ordered by their ID in descending order.

## Conclusion

The Track model is a robust and flexible component of our application, providing a wide range of features for managing music tracks. Whether you're uploading a track, adding it to a playlist, or interacting with it through likes and comments, the Track model has you covered.
