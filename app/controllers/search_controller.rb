class SearchController < ApplicationController
  # POST /search
  def create
    query = params[:q].to_s.strip

    if query.blank?
      render :create, locals: { users: [], playlists: [], tracks: [] }
      return
    end

    # Users: search username, first_name, last_name, bio, city, country
    users_search = User.where(role: ["admin", "artist"]).ransack(
      {
        username_or_first_name_or_last_name_or_bio_or_city_or_country_cont: query
      }
    )
    users = users_search.result.limit(10)

    # Playlists: search title, description, genre, tags
    playlists_search = Playlist.published.ransack(
      {
        title_or_description_or_genre_cont: query
      }
    )
    playlists = playlists_search.result.limit(10)

    # Tracks: search title, description, genre, and tags (array)
    tracks_search = Track.published.ransack(
      {
        title_or_description_or_genre_cont: query
      }
    )
    tracks = tracks_search.result
    # Add tracks that match tags (Postgres array column)
    tag_tracks = Track.where("? = ANY(tags)", query).limit(10)
    # Merge and uniq by id, then limit
    all_tracks = (tracks.to_a + tag_tracks.to_a).uniq { |t| t.id }[0, 10]

    render :create, locals: { users: users, playlists: playlists, tracks: all_tracks }
  end
end
