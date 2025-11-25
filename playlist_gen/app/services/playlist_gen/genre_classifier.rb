module PlaylistGen
  class GenreClassifier
    ALLOWED_GENRES = [
      "House",
      "Deep House",
      "Tech House",
      "Techno",
      "Melodic Techno",
      "Minimal",
      "Electro",
      "Breaks",
      "Drum & Bass",
      "Dubstep",
      "Trance",
      "Hard Techno",
      "Hardcore",
      "Ambient",
      "Downtempo",
      "Experimental",
      "Electronica",
      "Leftfield",
      "Progressive House",
      "Indie Dance",
      "Other"
    ].freeze

    SYSTEM_PROMPT = <<~PROMPT
      Eres un experto en música electrónica y en catálogos de DJ (Beatport, Bandcamp, Discogs, Juno, etc.). 
      Tu tarea es CLASIFICAR el género de un track usando únicamente sus metadatos: título, artista, BPM, tonalidad, ruta de archivo y cualquier pista contenida en el nombre de la carpeta o release.

      Reglas generales:

      1. Piensa como un DJ y como un curador de sello:
         - Si el título o la carpeta contienen palabras como "Techno", "House", "Dubstep", "Drum & Bass", etc., eso es una pista muy fuerte.
         - Los BPM también son una pista:
           - ~80–90: hip hop / downtempo / trap
           - ~100–115: slow, balearic, some deep/nu disco
           - ~115–125: house, deep house, minimal
           - ~125–135: tech house, techno, trance
           - ~140+: hard techno, hardcore, DnB, etc.
         - El artista o el nombre del release también pueden delatar el género (por ejemplo sellos de techno conocidos, compilados tipo "Darknet (Best Of 2015)" suelen ser techno / dark techno, etc.).

      2. Trabaja con una TAXONOMÍA acotada de géneros. 
         Usa preferentemente uno de estos valores EXACTOS como `genre`:
         - "House"
         - "Deep House"
         - "Tech House"
         - "Techno"
         - "Melodic Techno"
         - "Minimal"
         - "Electro"
         - "Breaks"
         - "Drum & Bass"
         - "Dubstep"
         - "Trance"
         - "Hard Techno"
         - "Hardcore"
         - "Ambient"
         - "Downtempo"
         - "Experimental"
         - "Electronica"
         - "Leftfield"
         - "Progressive House"
         - "Indie Dance"
         - "Other"

         Si no estás razonablemente seguro, usa "Other".

      3. Si el input ya trae un género:
         - Úsalo como pista, pero corrígelo si es muy evidente que otro encaja mejor.
         - Por ejemplo, si el archivo está en un compilado claramente Techno (carpeta, sello, contexto) y el género viene vacío, probablemente sea "Techno".

      4. Responde ÚNICAMENTE con un JSON válido (sin markdown ni explicaciones adicionales) con esta estructura:
         {
           "genre": "<valor exacto de la lista>",
           "confidence": <número entre 0.0 y 1.0>,
           "reasoning": "<breve explicación de tu razonamiento>"
         }
    PROMPT

    def self.call(track)
      new(track).call
    end

    def self.classify_untagged(limit: 100)
      tracks = Track.where(genre: [nil, "", "Other"]).limit(limit)
      results = []
      
      tracks.find_each do |track|
        result = call(track)
        results << { track_id: track.id, result: result }
      end
      
      results
    end

    def initialize(track)
      @track = track
    end

    def call
      response = openai_client.chat(
        parameters: {
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: build_user_prompt }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        }
      )

      content = response.dig("choices", 0, "message", "content")
      result = JSON.parse(content)

      # Validate genre is in allowed list
      unless ALLOWED_GENRES.include?(result["genre"])
        result["genre"] = "Other"
      end

      # Update track if genre was classified successfully
      if result["genre"].present? && result["confidence"].to_f >= 0.5
        @track.update!(genre: result["genre"])
      end

      result
    rescue JSON::ParserError => e
      Rails.logger.error "Failed to parse genre classification response: #{e.message}"
      { "genre" => "Other", "confidence" => 0.0, "reasoning" => "Failed to parse response" }
    rescue Faraday::Error, OpenAI::Error => e
      Rails.logger.error "OpenAI API error during genre classification: #{e.message}"
      { "genre" => "Other", "confidence" => 0.0, "reasoning" => "API error: #{e.message}" }
    end

    private

    def build_user_prompt
      parts = []
      parts << "Title: #{@track.title}" if @track.title.present?
      parts << "Artist: #{@track.artist}" if @track.artist.present?
      parts << "BPM: #{@track.bpm}" if @track.bpm.present?
      parts << "Key: #{@track.key}" if @track.key.present?
      parts << "File Path: #{@track.file_path}" if @track.file_path.present?
      parts << "Current Genre: #{@track.genre}" if @track.genre.present?
      parts << "Energy: #{@track.energy}/10" if @track.energy.present?
      
      parts.join("\n")
    end

    def openai_client
      @openai_client ||= OpenAI::Client.new
    end
  end
end
