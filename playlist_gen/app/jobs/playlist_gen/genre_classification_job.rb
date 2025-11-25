module PlaylistGen
  class GenreClassificationJob < ApplicationJob
    queue_as :default

    def perform(track_id = nil, batch_size: 50)
      if track_id
        # Classify single track
        track = Track.find(track_id)
        track.classify_genre!
      else
        # Classify batch of untagged tracks
        Track.without_genre.limit(batch_size).find_each do |track|
          track.classify_genre!
          sleep(0.5) # Rate limiting to avoid API throttling
        end
      end
    end
  end
end
