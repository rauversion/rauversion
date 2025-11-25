module PlaylistGen
  class Track < ApplicationRecord
    has_many :playlist_tracks, dependent: :destroy
    has_many :playlists, through: :playlist_tracks

    has_neighbors :embedding

    validates :title, presence: true
    validates :external_id, uniqueness: { scope: :source }, allow_nil: true
    validates :bpm, numericality: { greater_than: 0 }, allow_nil: true
    validates :energy, inclusion: { in: 1..10 }, allow_nil: true
    validates :duration_seconds, numericality: { greater_than_or_equal_to: 0 }, allow_nil: true

    scope :by_bpm_range, ->(min, max) { where(bpm: min..max) }
    scope :by_genres, ->(genres) { where("LOWER(genre) IN (?)", genres.map(&:downcase)) }
    scope :by_energy_range, ->(min, max) { where(energy: min..max) }
    scope :by_source, ->(source) { where(source: source) }
    scope :without_genre, -> { where(genre: [nil, "", "Other"]) }
    scope :with_genre, -> { where.not(genre: [nil, "", "Other"]) }

    # Classify genre using AI
    def classify_genre!
      GenreClassifier.call(self)
    end

    # Generate text representation for embedding
    def to_embedding_text
      parts = []
      parts << "Title: #{title}" if title.present?
      parts << "Artist: #{artist}" if artist.present?
      parts << "Genre: #{genre}" if genre.present?
      parts << "BPM: #{bpm}" if bpm.present?
      parts << "Key: #{key}" if key.present?
      parts << "Energy: #{energy}/10" if energy.present?
      parts.join(". ")
    end

    # Generate and store embedding
    def generate_embedding!
      return if to_embedding_text.blank?

      response = openai_client.embeddings(
        parameters: {
          model: "text-embedding-3-small",
          input: to_embedding_text
        }
      )

      embedding_vector = response.dig("data", 0, "embedding")
      update!(embedding: embedding_vector) if embedding_vector
    rescue Faraday::Error, OpenAI::Error => e
      Rails.logger.error "Failed to generate embedding for Track #{id}: #{e.message}"
      nil
    end

    # Find similar tracks by embedding
    def self.search_by_prompt(prompt, limit: 20)
      return none if prompt.blank?

      response = openai_client.embeddings(
        parameters: {
          model: "text-embedding-3-small",
          input: prompt
        }
      )

      query_embedding = response.dig("data", 0, "embedding")
      return none unless query_embedding

      where.not(embedding: nil)
           .nearest_neighbors(:embedding, query_embedding, distance: "cosine")
           .limit(limit)
    rescue Faraday::Error, OpenAI::Error => e
      Rails.logger.error "Failed to search by prompt: #{e.message}"
      none
    end

    private

    def openai_client
      @openai_client ||= OpenAI::Client.new
    end

    def self.openai_client
      @openai_client ||= OpenAI::Client.new
    end
  end
end
