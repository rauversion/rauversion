module EditorTemplates
  module Defaults
    module_function

    def global_templates
      [
        {
          name: "Single Release",
          description: "Perfecto para lanzar un single con artwork destacado",
          category: "album-releases",
          page_data: page_payload(
            "Nuevo Single",
            [
              spacer_block("single-spacer-1", "lg"),
              text_block("single-title", "<h1>Nuevo Single</h1>", "center"),
              text_block("single-subtitle", "<p>Artista - 2024</p>", "center"),
              spacer_block("single-spacer-2", "md"),
              image_block("single-image"),
              spacer_block("single-spacer-3", "md"),
              track_block("single-track"),
              spacer_block("single-spacer-4", "lg"),
              text_block("single-footer", "<p>Disponible en todas las plataformas</p>", "center"),
            ],
            {
              primaryColor: "#6366f1",
              template: "minimal",
              darkMode: true,
              fontFamily: "sans",
            }
          ),
        },
        {
          name: "Album Release",
          description: "Ideal para lanzamientos de album completo",
          category: "album-releases",
          page_data: page_payload(
            "Nuevo Album",
            [
              spacer_block("album-spacer-1", "lg"),
              text_block("album-title", "<h1>Nuevo Album</h1>", "center"),
              text_block("album-subtitle", "<p>Artista - 12 Tracks</p>", "center"),
              spacer_block("album-spacer-2", "md"),
              image_block("album-image"),
              spacer_block("album-spacer-3", "lg"),
              text_block("album-tracklist-title", "<h2>Tracklist</h2>", "center"),
              spacer_block("album-spacer-4", "sm"),
              playlist_block("album-playlist"),
              spacer_block("album-spacer-5", "lg"),
              text_block("album-about-title", "<h2>Sobre el Album</h2>", "left"),
              text_block(
                "album-about-copy",
                "<p>Escribe aqui la historia detras del album, el proceso creativo, colaboraciones y mas.</p>",
                "left"
              ),
              spacer_block("album-spacer-6", "lg"),
            ],
            {
              primaryColor: "#ec4899",
              template: "gradient",
              darkMode: true,
              fontFamily: "sans",
            }
          ),
        },
        {
          name: "EP Release",
          description: "Para EPs con multiples tracks destacados",
          category: "album-releases",
          page_data: page_payload(
            "Nuevo EP",
            [
              spacer_block("ep-spacer-1", "lg"),
              text_block("ep-title", "<h1>EP Title</h1>", "center"),
              text_block("ep-subtitle", "<p>Un nuevo viaje sonoro</p>", "center"),
              spacer_block("ep-spacer-2", "md"),
              image_block("ep-image"),
              spacer_block("ep-spacer-3", "lg"),
              text_block("ep-tracks-title", "<h2>Tracks Destacados</h2>", "left"),
              spacer_block("ep-spacer-4", "sm"),
              track_block("ep-track-1"),
              spacer_block("ep-spacer-5", "sm"),
              track_block("ep-track-2"),
              spacer_block("ep-spacer-6", "sm"),
              track_block("ep-track-3"),
              spacer_block("ep-spacer-7", "lg"),
            ],
            {
              primaryColor: "#14b8a6",
              template: "bold",
              darkMode: true,
              fontFamily: "sans",
            }
          ),
        },
        {
          name: "Pagina en Blanco",
          description: "Empieza desde cero con total libertad",
          category: "album-releases",
          page_data: page_payload(
            "Nueva Pagina",
            [],
            {
              primaryColor: "#6366f1",
              template: "minimal",
              darkMode: true,
              fontFamily: "sans",
            }
          ),
        },
      ]
    end

    def page_payload(name, blocks, style)
      {
        name: name,
        blocks: blocks,
        style: style,
      }
    end

    def text_block(id, content, alignment)
      {
        id: id,
        type: "text",
        props: {
          content: content,
          alignment: alignment,
          proseSize: "base",
        },
      }
    end

    def image_block(id)
      {
        id: id,
        type: "image",
        props: {
          src: "",
          alt: "",
          fit: "cover",
          rounded: "lg",
          aspectRatio: "video",
        },
      }
    end

    def spacer_block(id, height)
      {
        id: id,
        type: "spacer",
        props: {
          height: height,
        },
      }
    end

    def playlist_block(id)
      {
        id: id,
        type: "playlist",
        props: {
          platform: "spotify",
          url: "",
          height: 380,
          theme: "auto",
        },
      }
    end

    def track_block(id)
      {
        id: id,
        type: "track",
        props: {
          platform: "spotify",
          url: "",
          showArtwork: true,
          compact: false,
        },
      }
    end
  end
end
