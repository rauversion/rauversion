json.recordings @recordings do |recording|
  json.id recording.id
  json.title recording.title
  json.description recording.description
  json.duration recording.duration
  json.status recording.status
  json.processing_progress recording.processing_progress
  json.visibility recording.visibility
  json.allow_downloads recording.allow_downloads
  json.thumbnail_url recording.thumbnail_url
  json.play_url recording.play_url
  json.download_url recording.download_url if recording.allow_downloads
  json.share_url recording.share_url
  json.created_at recording.created_at
  json.updated_at recording.updated_at
end
