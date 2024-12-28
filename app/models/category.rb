class Category < ApplicationRecord
  extend FriendlyId
  friendly_id :name, use: :slugged
  has_many :posts

  def self.genres
    [
      "Alternative Rock",
      "Ambient",
      "Classical",
      "Country",
      "Dance &amp; EDM",
      "Dancehall",
      "Deep House",
      "Disco",
      "Drum &amp; Bass",
      "Dubstep",
      "Electronic",
      "Folk &amp; Singer-Songwriter",
      "Hip-hop &amp; Rap",
      "House",
      "Indie",
      "Jazz &amp; Blues",
      "Latin",
      "Metal",
      "Piano",
      "Pop",
      "R&amp;B &amp; Soul",
      "Reggae",
      "Reggaeton",
      "Rock",
      "Soundtrack",
      "Techno",
      "Trance",
      "Trap",
      "Triphop",
      "World",
      "UwUaracha",
      "Trap",
      "Latin Tecno",
      "Latin Core",
      "Dark Disco",
      "FootWork",
      "IDM",
      "Downtempo"
    ]
  end

  def self.music_genres
    [
      "Audiobooks",
      "Business",
      "Comedy",
      "Entertainment",
      "Learning",
      "News &amp; Politics",
      "Religion &amp;amp; Spirituality",
      "Science",
      "Sports",
      "Storytelling",
      "Technology"
    ]
  end

  def self.playlist_types
    [
      "playlist",
      "album",
      "ep",
      "single",
      "compilation"
    ]
  end

  def self.ransackable_attributes(auth_object = nil)
    ["created_at", "id", "id_value", "name", "slug", "updated_at"]
  end
end

module Category::Genres
  def self.all
    [
      {
        "genre" => "Ambient",
        "subgenres" => [
          "Ambient Dub",
          "Dark Ambient",
          "Drone",
          "Space Music"
        ]
      },
      {
        "genre" => "Breakbeat",
        "subgenres" => [
          "Breakcore",
          "Big Beat",
          "Nu Skool Breaks"
        ]
      },
      {
        "genre" => "Dance",
        "subgenres" => [
          "Acid House",
          "Disco House",
          "Eurodance",
          "Italo Disco",
          "Hi-NRG",
          "Europop",
          "House",
          "Techno",
          "Drum and Bass",
          "Dubstep",
          "Ambient",
          "Trance",
          "Footwork"
        ]
      },
      {
        "genre" => "Drum & Bass",
        "subgenres" => [
          "Jungle",
          "Jump Up",
          "Liquid Funk",
          "Intelligent Drum & Bass",
          "Techstep"
        ]
      },
      {
        "genre" => "Dubstep",
        "subgenres" => [
          "Brostep",
          "Dub-Influenced",
          "Post-Dubstep"
        ]
      },
      {
        "genre" => "Electronica",
        "subgenres" => [
          "Glitch",
          "IDM (Intelligent Dance Music)",
          "Trip-Hop",
          "Abstract"
        ]
      },
      {
        "genre" => "House",
        "subgenres" => [
          "Chicago House",
          "Deep House",
          "Funky House",
          "Garage House",
          "Progressive House",
          "Tech House",
          "Tribal House"
        ]
      },
      {
        "genre" => "Techno",
        "subgenres" => [
          "Ambient Techno",
          "Detroit Techno",
          "Minimal Techno",
          "Schranz",
          "Hard Techno",
          "Trance Techno",
          "Dark Disco"
        ]
      },
      {
        "genre" => "Trance",
        "subgenres" => [
          "Acid Trance",
          "Classic Trance",
          "Goa Trance",
          "Hard Trance",
          "Progressive Trance",
          "Uplifting Trance"
          
        ]
      },
      {
        "genre" => "Avant-Garde",
        "subgenres" => [
          "Free Jazz",
          "Musique Concrète",
          "Free Improvisation",
          "Noise Music"
        ]
      },
      {
        "genre" => "Industrial",
        "subgenres" => [
          "EBM (Electronic Body Music)",
          "Power Electronics",
          "Rhythmic Noise",
          "Industrial Rock"
        ]
      },
      {
        "genre" => "Noise",
        "subgenres" => [
          "Harsh Noise",
          "Wall of Sound",
          "Power Electronics"
        ]
      },
      {
        "genre" => "Sound Art",
        "subgenres" => [
          "Acousmatic Music",
          "Sound Installation",
          "Sound Poetry"
        ]
      },
      {
        "genre" => "Indie Pop",
        "subgenres" => [
          "Twee Pop",
          "Dream Pop",
          "Jangle Pop"
        ]
      },
      {
        "genre" => "Indie Rock",
        "subgenres" => [
          "Alternative Rock",
          "Post-Punk",
          "New Wave",
          "Post-Rock",
          "Math Rock",
          "Lo-Fi"
        ]
      },
      {
        "genre" => "Indie Folk",
        "subgenres" => [
          "Freak Folk",
          "New Weird America",
          "Anti-Folk"
        ]
      },
      {
        "genre" => "Indie Electronic",
        "subgenres" => [
          "Chillwave",
          "Synthpop",
          "Dream Pop",
          "Indietronica"
        ]
      },
      {
        "genre" => "Indie Metal",
        "subgenres" => [
          "Math Metal",
          "Post-Metal",
          "Sludge Metal"
        ]
      },
      {
        "genre" => "Latin Electronica",
        "subgenres" => [
          "Latin House",
          "Reggaeton",
          "Moombahton",
          "Cumbiaton",
          "UwUaracha",
          "Tribal Guarachero (or 3Ball)",
          "Electrocumbia",
          "Latin Trap",
          "Digital Cumbia",
          "Bachata Electronica",
          "Latin Trance or Latin Progressive House"
        ]
      }
    ]
  end

  def self.categories
    all.map { |o| o["genre"] }
  end

  def self.plain
    all.reduce([]) do |acc, el|
      acc + [el["genre"]] + el["subgenres"]
    end
  end
end
