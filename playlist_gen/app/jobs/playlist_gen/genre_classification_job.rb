module PlaylistGen
  class GenreClassificationJob < ApplicationJob
    queue_as :default

    # Rate limit: process one track at a time with scheduled delays
    def perform(track_id = nil, batch_size: 50, processed_count: 0)
      if track_id
        # Classify single track
        track = Track.find(track_id)
        track.classify_genre!
      else
        # Get next unclassified track
        track = Track.without_genre.first
        
        return unless track # No more tracks to classify
        return if processed_count >= batch_size # Batch complete
        
        # Classify this track
        track.classify_genre!
        
        # Schedule next classification with delay to avoid API throttling
        remaining = Track.without_genre.count
        if remaining > 0 && processed_count + 1 < batch_size
          self.class.set(wait: 1.second).perform_later(nil, batch_size: batch_size, processed_count: processed_count + 1)
        end
      end
    end
  end
end
